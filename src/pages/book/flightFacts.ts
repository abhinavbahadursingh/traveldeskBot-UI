// What a flight card says about a flight, from the server's card fields.
import type { FlightCard } from '../../services/book';
import { stopsOf } from '../../lib/results';

export interface Fact { text: string; tone: 'good' | 'bad' | 'plain' }

const title = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const GOOD_RULES = ['Free cancellation', 'Free changes'];
const GOOD_BAGS = ['Checked bag included', 'Checked bag + cabin bag'];
const UNKNOWN_BAGS = ['Baggage not listed', 'Checked bag not confirmed'];

/** Tags with text (colour is never the only signal), plus the fields the seller didn't give. */
export function factsFor(c: FlightCard): { facts: Fact[]; missing: string[] } {
  const facts: Fact[] = [];
  const missing: string[] = [];
  if (c.cabin) facts.push({ text: title(c.cabin), tone: 'plain' });
  else missing.push('cabin');
  if (stopsOf(c) === 0) facts.push({ text: 'Nonstop', tone: 'good' });
  if (c.fare_rules === 'Fare rules not listed') missing.push('fare rules');
  else facts.push({ text: c.fare_rules, tone: GOOD_RULES.includes(c.fare_rules) ? 'good' : c.fare_rules === 'Non-refundable' ? 'bad' : 'plain' });
  if (UNKNOWN_BAGS.includes(c.bags)) missing.unshift('baggage');
  else facts.push({ text: c.bags, tone: GOOD_BAGS.includes(c.bags) ? 'good' : 'plain' });
  // "Economy Cabin" next to "Economy" says the same thing twice: keep one.
  const bare = (s: string) => s.toLowerCase().replace(/\bcabin\b/g, '').replace(/[\s_-]+/g, ' ').trim();
  if (c.fare_family && !(c.cabin && bare(c.fare_family) === bare(c.cabin))) facts.push({ text: title(c.fare_family), tone: 'plain' });
  return { facts, missing };
}

/** ["baggage", "fare rules"] → "Baggage & fare rules not provided by seller". */
export function missingLine(missing: string[]): string | null {
  if (!missing.length) return null;
  const list = missing.length === 1 ? missing[0] : missing.slice(0, -1).join(', ') + ' & ' + missing[missing.length - 1];
  return list.charAt(0).toUpperCase() + list.slice(1) + ' not provided by seller';
}

/** "Nonstop" / "1 stop · PVG" / "2 stops". */
export function stopsLabel(c: FlightCard): string {
  const n = stopsOf(c);
  if (n === 0) return 'Nonstop';
  const via = c.stop_airports?.length ? ' · ' + c.stop_airports.join(', ') : '';
  return n + (n === 1 ? ' stop' : ' stops') + via;
}

const PALETTE = ['#c8102e', '#1d3b8f', '#d71921', '#0f766e', '#7c3aed', '#b45309', '#0369a1', '#be185d', '#4d7c0f', '#334155'];

/** A steady colour per airline code (there's no brand colour data). */
export function airlineColour(code: string): string {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** The 2-letter code for the badge: the server's code, else the airline name's initials. */
export function airlineCode(c: FlightCard): string {
  if (c.airline_code) return c.airline_code.toUpperCase();
  const words = c.airline_name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : c.airline_name.slice(0, 2)).toUpperCase();
}

const BADGE: Record<string, string> = {
  'Best value': 'b-glow-green',
  Cheapest: 'b-glow-yellow',
  Fastest: 'b-glow-yellow',
  'Most flexible': 'b-glow-red',
  'Also good': 'b-blue',
};
export const badgeClass = (tag: string) => BADGE[tag] || 'b-blue';

/** The selected card's border and shadow follow its badge colour ('' = default blue). */
export const selClass = (tag: string | null) => {
  const b = tag ? BADGE[tag] : '';
  return b?.startsWith('b-glow-') ? ' sel-' + b.slice('b-glow-'.length) : '';
};
