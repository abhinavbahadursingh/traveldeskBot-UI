// Tiny JSON API over the traveldesk-bot SQLite DB, mounted into the Vite dev/preview server.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import type { Connect } from 'vite';
import { CANCELLABLE } from '../src/lib/status';

const DB_PATH = path.resolve(process.env.TRAVELDESK_DB || '../traveldesk-bot/traveldesk.db');

let db: DatabaseSync | null = null;
function conn() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA busy_timeout = 5000');
  }
  return db;
}

// Every bookings column: the bot adds columns over time (migrated in place).
const COLS = '*';

// ?reason= → the `approver` the bot reads (traveldesk-bot storage/db.py WEB_CANCELLERS).
const CANCELLED_BY: Record<string, string> = {
  dashboard: 'dashboard', // Cancel on the bookings dashboard
  change_flight: 'web_change', // "Change flight" on /book
};

// USD → INR for AI cost in rupees: the ECB reference rate for the day of each call
// (Frankfurter, free, no key; published once per working day). Falls back to a fixed
// rate (USD_INR_RATE, default 88) only when the rate service can't be reached.
const FX_URL = process.env.FX_URL || 'https://api.frankfurter.dev/v1/';
const FIXED_USD_INR = Number(process.env.USD_INR_RATE) > 0 ? Number(process.env.USD_INR_RATE) : 88;
const FX_RECENT_TTL_MS = 6 * 60 * 60 * 1000; // today's / yesterday's rate may still be published

interface Fx { rate: number; date: string | null; source: 'ecb' | 'fixed' }

const fxCache = new Map<string, { fx: Promise<Fx>; at: number }>();
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** USD→INR for a day (YYYY-MM-DD). Past days are cached for good, recent ones for 6h. */
function usdInr(day: string): Promise<Fx> {
  const today = isoDay(new Date());
  const key = day > today ? today : day;
  const recent = key >= isoDay(new Date(Date.now() - 2 * 86400000));
  const hit = fxCache.get(key);
  if (hit && (!recent || Date.now() - hit.at < FX_RECENT_TTL_MS)) return hit.fx;
  const fx = fetch(FX_URL + (key === today ? 'latest' : key) + '?base=USD&symbols=INR', { signal: AbortSignal.timeout(4000) })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
    .then((j: { date?: string; rates?: { INR?: number } }) => {
      const rate = Number(j.rates?.INR);
      if (!(rate > 0)) throw new Error('no INR rate');
      return { rate, date: j.date || key, source: 'ecb' as const };
    })
    .catch((e) => {
      fxCache.delete(key); // try again on the next request
      console.warn('[traveldesk-api] USD→INR rate unavailable (' + (e as Error).message + '); using the fixed rate');
      return { rate: FIXED_USD_INR, date: null, source: 'fixed' as const };
    });
  fxCache.set(key, { fx, at: Date.now() });
  return fx;
}

/** Claude calls the bot logged for one booking (ai_usage), with totals in USD and INR. */
async function usageFor(id: number) {
  let calls: Record<string, unknown>[] = [];
  try {
    calls = conn()
      .prepare(
        `SELECT created_at, model, task_kind, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, est_cost_usd
         FROM ai_usage WHERE booking_id = ? ORDER BY id`,
      )
      .all(id) as Record<string, unknown>[];
  } catch {
    calls = []; // no ai_usage table yet
  }
  // Each call is converted at the rate for the day it was made.
  const dayOf = (c: Record<string, unknown>) => String(c.created_at || '').slice(0, 10) || isoDay(new Date());
  const rates = new Map<string, Fx>();
  await Promise.all([...new Set(calls.map(dayOf))].map(async (d) => rates.set(d, await usdInr(d))));
  const withInr = calls.map((c) => {
    const fx = rates.get(dayOf(c))!;
    return { ...c, usd_inr: fx.rate, est_cost_inr: (Number(c.est_cost_usd) || 0) * fx.rate };
  });
  const sum = (k: string) => withInr.reduce((s, c) => s + (Number((c as Record<string, unknown>)[k]) || 0), 0);
  const shown = calls.length ? rates.get(dayOf(calls[calls.length - 1]))! : await usdInr(isoDay(new Date()));
  return {
    calls: withInr,
    totals: {
      input_tokens: sum('input_tokens'),
      output_tokens: sum('output_tokens'),
      cache_read_tokens: sum('cache_read_tokens'),
      cache_creation_tokens: sum('cache_creation_tokens'),
      est_cost_usd: sum('est_cost_usd'),
      est_cost_inr: sum('est_cost_inr'),
    },
    fx: { ...shown, days: rates.size },
  };
}

const getRow = (id: number) => conn().prepare(`SELECT ${COLS} FROM bookings WHERE id = ?`).get(id);

function send(res: Parameters<Connect.NextHandleFunction>[1], status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

// Same format the bot writes: naive local time, seconds precision.
function localNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export const bookingsApi: Connect.NextHandleFunction = (req, res, next) => {
  const url = new URL(req.url || '/', 'http://x');
  if (!url.pathname.startsWith('/api/bookings')) return next();
  try {
    if (req.method === 'GET' && url.pathname === '/api/bookings') {
      return send(res, 200, conn().prepare(`SELECT ${COLS} FROM bookings ORDER BY id DESC`).all());
    }
    const m = url.pathname.match(/^\/api\/bookings\/(\d+)(?:\/(cancel|usage))?$/);
    if (!m) return send(res, 404, { error: 'Not found' });
    const id = Number(m[1]);
    const before = getRow(id) as { status: string } | undefined;
    if (!before) return send(res, 404, { error: 'Booking not found' });

    if (req.method === 'GET' && !m[2]) return send(res, 200, before);
    if (req.method === 'GET' && m[2] === 'usage') {
      usageFor(id).then((u) => send(res, 200, u), (e: Error) => send(res, 500, { error: e.message }));
      return;
    }

    if (req.method === 'POST' && m[2] === 'cancel') {
      // The approver value tells the bot to stop its work and which Slack message to send.
      const approver = CANCELLED_BY[url.searchParams.get('reason') || 'dashboard'];
      if (!approver) return send(res, 400, { error: 'Unknown reason' });
      const ph = CANCELLABLE.map(() => '?').join(',');
      const r = conn()
        .prepare(`UPDATE bookings SET status = 'cancelled', approver = ?, approval_ts = ? WHERE id = ? AND status IN (${ph})`)
        .run(approver, localNow(), id, ...CANCELLABLE);
      if (r.changes !== 1) return send(res, 409, { error: `it's ${before.status.replace(/_/g, ' ')} now` });
      return send(res, 200, getRow(id));
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    return send(res, 500, { error: (e as Error).message });
  }
};

// GST page: ops_bookings that have a GST breakdown (traveldesk-bot ops/gst.py; amounts in paise).
// Same "money spent" statuses as the bot's `/traveldesk gst` summary (ops/gst_report.py SPENT).
const GST_SQL = `
  SELECT b.id, b.created_at, b.route, b.pnr, b.status, b.fare_paise, b.category, b.taxable_value_paise,
         CAST(b.gst_rate AS TEXT) AS gst_rate, b.cgst_paise, b.sgst_paise, b.igst_paise, b.total_gst_paise,
         b.computed_gst_paise, b.gst_mismatch, b.supplier_gstin, b.supplier_state, b.invoice_no,
         b.invoice_date, b.invoice_url, b.itc_eligible, b.itc_status, r.legacy_booking_id,
         COALESCE(t.name, r.slack_user) AS employee
  FROM ops_bookings b
  JOIN ops_requests r ON r.id = b.request_id
  LEFT JOIN ops_travelers t ON t.id = b.traveler_id
  WHERE b.total_gst_paise IS NOT NULL AND b.status IN ('ticketed', 'held', 'refund_pending')
  ORDER BY b.created_at DESC, b.id DESC`;

export const gstApi: Connect.NextHandleFunction = (req, res, next) => {
  const url = new URL(req.url || '/', 'http://x');
  if (url.pathname !== '/api/gst') return next();
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  try {
    return send(res, 200, { rows: conn().prepare(GST_SQL).all() });
  } catch (e) {
    const msg = (e as Error).message;
    // ops tables missing, or GST columns not migrated yet (alembic upgrade head in traveldesk-bot)
    if (/no such (table|column)/.test(msg)) return send(res, 200, { rows: [], setup: msg });
    return send(res, 500, { error: msg });
  }
};
