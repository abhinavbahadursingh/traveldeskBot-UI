// The bookings.details JSON (the bot's pick + LetsFG result) as readable drawer groups.
import type { SchemaRow } from './SchemaGroup';

export interface DetailsGroup {
  title: string;
  open: boolean;
  rows: SchemaRow[];
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Keys per section, in display order. Anything not listed goes to "Other".
const SECTIONS: { title: string; keys: string[]; open: (d: Record<string, unknown>) => boolean }[] = [
  {
    title: 'Flight',
    keys: ['summary', 'airline_name', 'airline', 'airports', 'depart_at', 'last_flight_date', 'return_from', 'domestic', 'fare_type', 'price', 'passengers_requested'],
    open: () => true,
  },
  {
    title: 'Booking result',
    keys: ['state', 'status', 'booking_ref', 'book_attempt', 'message', 'required_fields', 'missing_fields', 'approve_url', 'pnr', 'ticket_url'],
    open: (d) => !!(d.message || d.booking_ref),
  },
  {
    title: 'Payment',
    keys: ['payment_kind', 'pay_amount', 'pay_valid_until', 'decline_reason', 'decline_message', 'decline_advice', 'declined_booking_ref'],
    open: (d) => !!d.payment_kind,
  },
  {
    title: 'Search',
    keys: ['origin', 'destination', 'depart_date', 'search_id', 'offer_id', 'offers_found', 'offers_shown', 'signature', 'offer_link', 'model', 'provider', 'backend', 'auto_summary'],
    open: () => false,
  },
];

// Shown inside another row instead of on their own.
const FOLDED = new Set(['currency', 'pay_currency']);

function dateText(v: string): string | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const day = Number(m[3]) + ' ' + MON[Number(m[2]) - 1] + ' ' + m[1];
  return m[4] ? day + ', ' + m[4] + ':' + m[5] : day;
}

function money(amount: unknown, currency: unknown): string {
  const n = Number(amount);
  const num = isNaN(n) ? String(amount) : n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return currency === 'INR' ? '₹' + num : num + (currency ? ' ' + currency : '');
}

function scalar(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  if (typeof v === 'string') return dateText(v) && v.length <= 32 ? dateText(v)! : v;
  return JSON.stringify(v);
}

function row(key: string, v: unknown, d: Record<string, unknown>): SchemaRow {
  const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
  if (empty) return { key, val: '—', cls: 'kv-v muted' };
  if (typeof v === 'string' && /^https:\/\//.test(v)) {
    let host = v;
    try { host = new URL(v).host; } catch { /* keep the url */ }
    return { key, val: 'Open on ' + host, cls: 'kv-v', href: v };
  }
  if (key === 'price') return { key, val: money(v, d.currency), cls: 'kv-v' };
  if (key === 'pay_amount') return { key, val: money(v, d.pay_currency), cls: 'kv-v' };
  if (key === 'airports' && Array.isArray(v)) return { key, val: v.join(' → '), cls: 'kv-v' };
  if (key === 'signature' && Array.isArray(v)) {
    // [[airline, flight_no, origin, destination, departure], ...]
    const legs = v.map((s) => (Array.isArray(s) ? [[s[0], s[1]].filter(Boolean).join(' '), s[2] + ' → ' + s[3], dateText(String(s[4] || '')) || s[4]].filter(Boolean).join(' · ') : JSON.stringify(s)));
    return { key, val: legs.join('\n'), cls: 'kv-v' };
  }
  if (Array.isArray(v)) return { key, val: v.every((x) => typeof x !== 'object' || x === null) ? v.map(scalar).join(', ') : JSON.stringify(v, null, 1), cls: 'kv-v' };
  if (typeof v === 'object') return { key, val: JSON.stringify(v, null, 1), cls: 'kv-v' };
  return { key, val: scalar(v), cls: 'kv-v' };
}

/** Readable groups for a bookings.details value; null when it isn't a JSON object. */
export function detailsGroups(json: string | null): DetailsGroup[] | null {
  if (!json) return null;
  let d: Record<string, unknown>;
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    d = parsed;
  } catch {
    return null;
  }
  const used = new Set<string>(FOLDED);
  if (d.auto_summary === d.summary) used.add('auto_summary'); // same text twice
  const groups: DetailsGroup[] = [];
  for (const s of SECTIONS) {
    const keys = s.keys.filter((k) => k in d && !used.has(k));
    keys.forEach((k) => used.add(k));
    if (keys.length) groups.push({ title: s.title, open: s.open(d), rows: keys.map((k) => row(k, d[k], d)) });
  }
  const rest = Object.keys(d).filter((k) => !used.has(k)).sort();
  if (rest.length) groups.push({ title: 'Other', open: false, rows: rest.map((k) => row(k, d[k], d)) });
  return groups;
}
