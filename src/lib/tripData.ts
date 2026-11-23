// What the Book page shows about a traveller's own bookings, from the bookings DB rows.
import type { Booking } from '../services/bookings';
import { isClosed, isDone, statusMeta } from './status';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface WaitingItem {
  id: number;
  title: string;
  next: string;
  kind: 'question' | 'upload';
  cta: string;
  createdMs: number;
}

export interface UpcomingTrip {
  id: number;
  date: Date;
  route: string;
  status: string;
}

export interface TripData {
  tripsThisMonth: number;
  tripsLastMonth: number;
  lastMonthName: string;
  spentThisMonth: number;
  waiting: WaitingItem[];
  recentRoutes: string[]; // "DEL → BOM", newest first, unique
  upcoming: UpcomingTrip[];
}

interface Details { origin?: string; destination?: string; depart_date?: string; depart_at?: string; airline_name?: string }

function details(b: Booking): Details {
  try {
    const d = JSON.parse(b.raw.details || '{}');
    return d && typeof d === 'object' ? d : {};
  } catch {
    return {};
  }
}

/** Requests paused until the traveller acts (the same set the nav badge counts). */
export function waitingFor(b: Booking): WaitingItem | null {
  const base = { id: b.id, title: b.request, createdMs: b.createdMs };
  if (b.status === 'need_info') return { ...base, kind: 'question', next: 'Answer the agent’s question', cta: 'Open in Slack' };
  if (b.status === 'need_documents' || b.status === 'no_passport') return { ...base, kind: 'upload', next: 'Upload ID document', cta: 'Upload' };
  return null;
}

function localDate(iso?: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

export function tripData(list: Booking[], user: string, now = new Date()): TripData {
  const mine = list.filter((b) => b.raw.slack_user === user);
  const y = now.getFullYear(), m = now.getMonth();
  const prev = new Date(y, m - 1, 1);
  const inMonth = (b: Booking, yy: number, mm: number) => {
    if (!b.createdMs) return false;
    const d = new Date(b.createdMs);
    return d.getFullYear() === yy && d.getMonth() === mm;
  };
  const booked = mine.filter((b) => isDone(b.status));
  const thisMonth = booked.filter((b) => inMonth(b, y, m));

  const routes: string[] = [];
  for (const b of mine) {
    const d = details(b);
    const r = d.origin && d.destination ? d.origin + ' → ' + d.destination : null;
    if (r && !routes.includes(r)) routes.push(r);
    if (routes.length === 3) break;
  }

  const today = new Date(y, m, now.getDate());
  const upcoming = mine
    .filter((b) => !isClosed(b.status))
    .map((b) => {
      const d = details(b);
      const date = localDate(d.depart_date || d.depart_at);
      if (!date || date < today || !d.origin || !d.destination) return null;
      const label = statusMeta(b.status).label;
      return { id: b.id, date, route: d.origin + ' → ' + d.destination, status: d.airline_name ? label + ' · ' + d.airline_name : label };
    })
    .filter((t): t is UpcomingTrip => !!t)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 2);

  return {
    tripsThisMonth: thisMonth.length,
    tripsLastMonth: booked.filter((b) => inMonth(b, prev.getFullYear(), prev.getMonth())).length,
    lastMonthName: MON[prev.getMonth()],
    spentThisMonth: thisMonth.reduce((s, b) => s + (b.price ?? 0), 0),
    waiting: mine.map(waitingFor).filter((w): w is WaitingItem => !!w),
    recentRoutes: routes,
    upcoming,
  };
}

/** "Good morning" / "Good afternoon" / "Good evening" from local time. */
export function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export const MONTHS = MON;
