// The results panel's segmented control: re-sorts or filters the search on the client.
import type { FlightCard, FlightSearch } from '../services/book';

export type ResultMode = 'best' | 'cheapest' | 'fastest' | 'nonstop';

export const RESULT_MODES: [ResultMode, string][] = [
  ['best', 'Best picks'],
  ['cheapest', 'Cheapest'],
  ['fastest', 'Fastest'],
  ['nonstop', 'Nonstop only'],
];

/** Stops: the server's count, else read from the "IndiGo · 1 stop" label (older saved searches). */
export function stopsOf(c: FlightCard): number {
  if (typeof c.stops === 'number') return c.stops;
  if (/nonstop/i.test(c.airline)) return 0;
  const m = c.airline.match(/(\d+)\s+stop/i);
  return m ? Number(m[1]) : 0;
}

/** Seconds: the server's figure, else parsed from "2h 05m". Unknown → Infinity (sorts last). */
export function secondsOf(c: FlightCard): number {
  if (typeof c.duration_seconds === 'number' && c.duration_seconds > 0) return c.duration_seconds;
  const m = c.duration.match(/(\d+)h\s*(\d+)m/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 : Infinity;
}

const byPrice = (a: FlightCard, b: FlightCard) => a.price - b.price || a.id.localeCompare(b.id);
const byTime = (a: FlightCard, b: FlightCard) => secondsOf(a) - secondsOf(b) || byPrice(a, b);

/**
 * Every flight in the order the chosen mode shows them. "Best picks" leads with the server's
 * picks (in its order), then the rest by price. The others don't drop flights except
 * "Nonstop only", which keeps nonstop flights, cheapest first.
 */
export function ordered(search: Pick<FlightSearch, 'picks' | 'all'>, mode: ResultMode): FlightCard[] {
  const all = search.all ?? search.picks ?? [];
  if (mode === 'cheapest') return [...all].sort(byPrice);
  if (mode === 'fastest') return [...all].sort(byTime);
  if (mode === 'nonstop') return all.filter((c) => stopsOf(c) === 0).sort(byPrice);
  const picks = search.picks ?? [];
  const ids = new Set(picks.map((p) => p.id));
  return [...picks, ...all.filter((c) => !ids.has(c.id)).sort(byPrice)];
}

/** The server's tag for a flight ("Best value", …), whichever list the card came from. */
export function tagFor(search: Pick<FlightSearch, 'picks'>, id: string): string | null {
  return search.picks?.find((p) => p.id === id)?.tag ?? null;
}
