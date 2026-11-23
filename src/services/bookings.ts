// Bookings service backed by the traveldesk-bot SQLite DB via /api/bookings (see server/api.ts).

export interface BookingRow {
  id: number;
  created_at: string | null;
  slack_user: string | null;
  request: string | null;
  status: string;
  booking_ref: string | null;
  pnr: string | null;
  price: number | null;
  currency: string | null;
  details: string | null;
  request_key: string | null;
  approver: string | null;
  approval_ts: string | null;
  payment_status: string | null;
  manager_message_ts: string | null;
  manager_channel: string | null;
  provider: string | null;
  charged_amount: number | null;
  pay_url: string | null;
  declined_booking_ref: string | null;
  pay_started_at: string | null;
  pay_expires_at: string | null;
  pay_reminded_at: string | null;
  pay_approvers: string | null;
  slack_thread_ts: string | null;
  confirmed_via?: string | null; // 'web' = confirmed on the website (newer bot versions)
}

export interface Booking {
  id: number;
  created: string;
  createdAt: string;
  createdMs: number;
  request: string;
  status: string;
  price: number | null;
  payment: string;
  stuck?: string;
  raw: BookingRow;
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => (n < 10 ? '0' : '') + n;
const DAY = 86400000;

export const shortDate = (d: Date) => MON[d.getMonth()] + ' ' + d.getDate();

function toBooking(r: BookingRow): Booking {
  const d = r.created_at ? new Date(r.created_at) : null; // bot stores naive local time
  const ok = d && !isNaN(d.getTime());
  const ms = ok ? d!.getTime() : 0;
  const age = ok ? Date.now() - ms : 0;
  const days = Math.floor(age / DAY);
  return {
    id: r.id,
    created: ok ? shortDate(d!) + ', ' + pad(d!.getHours()) + ':' + pad(d!.getMinutes()) : '—',
    createdAt: r.created_at || '',
    createdMs: ms,
    request: r.request || '—',
    status: r.status,
    price: r.price,
    payment: r.payment_status || 'unpaid',
    stuck: r.status === 'searching' && age > DAY ? days + (days === 1 ? ' day' : ' days') : undefined,
    raw: r,
  };
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || res.statusText);
  return body as T;
}

export interface AiCall {
  created_at: string | null;
  model: string | null;
  task_kind: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  est_cost_usd: number;
  est_cost_inr: number; // at the USD→INR rate for the day of the call
  usd_inr: number;
}

export interface AiUsage {
  calls: AiCall[];
  totals: Omit<AiCall, 'created_at' | 'model' | 'task_kind' | 'usd_inr'>;
  /** The rate shown (for the latest call's day). `fixed` = the rate service was unreachable. */
  fx: { rate: number; date: string | null; source: 'ecb' | 'fixed'; days: number };
}

/** Claude calls the bot made for this booking, with estimated cost in USD and INR. */
export function getUsage(id: number): Promise<AiUsage> {
  return req<AiUsage>('/api/bookings/' + id + '/usage');
}

export async function getAll(): Promise<Booking[]> {
  return (await req<BookingRow[]>('/api/bookings')).map(toBooking);
}

export async function get(id: number): Promise<Booking> {
  return toBooking(await req<BookingRow>('/api/bookings/' + id));
}

export type CancelReason = 'dashboard' | 'change_flight';

/**
 * Cancel for good: the bot stops working on the request and sends the traveller a short
 * Slack message that matches `reason`. `keepalive` lets it finish while the page closes.
 */
export async function cancel(id: number, opts: { keepalive?: boolean; reason?: CancelReason } = {}): Promise<Booking> {
  const url = '/api/bookings/' + id + '/cancel?reason=' + (opts.reason || 'dashboard');
  return toBooking(await req<BookingRow>(url, { method: 'POST', keepalive: opts.keepalive }));
}
