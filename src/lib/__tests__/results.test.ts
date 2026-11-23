import { describe, expect, it } from 'vitest';
import type { FlightCard } from '../../services/book';
import { ordered, secondsOf, stopsOf, tagFor } from '../results';

const card = (id: string, price: number, duration: string, stops: number, extra: Partial<FlightCard> = {}): FlightCard => ({
  id, tag: null, tone: null, airline: 'X · ' + (stops ? stops + ' stop' : 'Nonstop'), airline_name: 'X',
  origin: 'DEL', destination: 'BOM', depart_at: null, dep: '07:00', arr: '09:00', arr_day_offset: 0,
  duration, bags: 'Baggage not listed', fare_rules: 'Fare rules not listed', fare_family: null, seller: null,
  cabin: 'economy', price, currency: 'INR', stops, ...extra,
});

const A = card('A', 5000, '5h 10m', 1);
const B = card('B', 7200, '2h 10m', 0, { tag: 'Best value' });
const C = card('C', 6100, '2h 30m', 0);
const D = card('D', 9000, '2h 05m', 0, { tag: 'Most flexible' });
const E = card('E', 4800, '9h 00m', 2);
const search = { picks: [B, A, D], all: [A, B, C, D, E] };
const ids = (cs: FlightCard[]) => cs.map((c) => c.id);

describe('ordered', () => {
  it('Best picks: the server picks first, in its order, then the rest by price', () => {
    expect(ids(ordered(search, 'best'))).toEqual(['B', 'A', 'D', 'E', 'C']);
  });
  it('Cheapest: every flight by price', () => {
    expect(ids(ordered(search, 'cheapest'))).toEqual(['E', 'A', 'C', 'B', 'D']);
  });
  it('Fastest: every flight by journey time', () => {
    expect(ids(ordered(search, 'fastest'))).toEqual(['D', 'B', 'C', 'A', 'E']);
  });
  it('Nonstop only: drops flights with stops, cheapest first', () => {
    expect(ids(ordered(search, 'nonstop'))).toEqual(['C', 'B', 'D']);
  });
  it('breaks price ties by id so the order is stable', () => {
    const x = card('x', 100, '1h 00m', 0), y = card('y', 100, '1h 00m', 0);
    expect(ids(ordered({ picks: [], all: [y, x] }, 'cheapest'))).toEqual(['x', 'y']);
  });
  it('does not change the search it was given', () => {
    ordered(search, 'cheapest');
    expect(ids(search.all)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
  it('handles an empty search', () => {
    expect(ordered({ picks: [], all: [] }, 'nonstop')).toEqual([]);
  });
});

describe('card fallbacks for searches saved by an older bot', () => {
  it('reads stops from the airline label', () => {
    expect(stopsOf(card('a', 1, '1h 00m', 0, { stops: undefined, airline: 'IndiGo · Nonstop' }))).toBe(0);
    expect(stopsOf(card('a', 1, '1h 00m', 0, { stops: undefined, airline: 'IndiGo · 2 stops' }))).toBe(2);
  });
  it('reads seconds from the duration text, unknown sorts last', () => {
    expect(secondsOf(card('a', 1, '2h 05m', 0))).toBe(7500);
    expect(secondsOf(card('a', 1, '—', 0))).toBe(Infinity);
    expect(secondsOf(card('a', 1, '—', 0, { duration_seconds: 600 }))).toBe(600);
  });
});

describe('tagFor', () => {
  it('finds the server tag even for a card from the full list', () => {
    expect(tagFor(search, 'D')).toBe('Most flexible');
    expect(tagFor(search, 'E')).toBeNull();
  });
});
