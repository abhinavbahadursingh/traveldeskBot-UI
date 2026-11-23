const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹ with Indian digit grouping: 150000 → "₹1,50,000". Null → "—". */
export const fmt = (n: number | null | undefined): string =>
  n == null || !Number.isFinite(n) ? '—' : (n < 0 ? '-₹' : '₹') + INR.format(Math.abs(Math.round(n)));

/** Short ₹ for tight spaces, in lakh/crore: 380000 → "₹3.8L", 25000000 → "₹2.5Cr", 42150 → "₹42,150". */
export function fmtShort(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const a = Math.abs(n), sign = n < 0 ? '-' : '';
  const one = (v: number) => (Math.round(v * 10) / 10).toString();
  if (a >= 1e7) return sign + '₹' + one(a / 1e7) + 'Cr';
  if (a >= 1e5) return sign + '₹' + one(a / 1e5) + 'L';
  return fmt(n);
}

export function mmss(left: number): string {
  const m = Math.floor(left / 60);
  const sec = left % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

/** "just now", "5m ago", "2h ago", "3d ago". */
export function ago(ms: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ms) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

/** "2 days", "5 hours", "under an hour": how long something has waited. */
export function age(ms: number, now = Date.now()): string {
  const h = Math.floor(Math.max(0, now - ms) / 3600000);
  if (h < 1) return 'under an hour';
  if (h < 24) return h + (h === 1 ? ' hour' : ' hours');
  const d = Math.floor(h / 24);
  return d + (d === 1 ? ' day' : ' days');
}
