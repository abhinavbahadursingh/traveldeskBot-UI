const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parse(iso?: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

/** "Sunday, 23 Nov" */
export function dayLabel(iso?: string | null): string {
  const d = parse(iso);
  return d ? DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()] : 'your dates';
}

/** "Sun 23 Nov" */
export function shortDay(iso?: string | null): string {
  const d = parse(iso);
  return d ? DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MON[d.getMonth()] : '';
}

/** Whole days from today to the date (negative = past). */
export function daysAhead(iso?: string | null): number | null {
  const d = parse(iso);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}
