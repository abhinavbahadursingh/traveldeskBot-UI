// Client for the bot's web booking service (traveldesk-bot: python -m traveldesk.web),
// reached through the Vite proxy at /api/book/*. See vite.config.ts.

export interface Traveller {
  id: string;
  name: string;
  ready: boolean;
  problems: string;
  passport_on_file?: boolean; // yes/no only; older bot versions leave it out
}

export interface Route {
  origin: string;
  destination: string;
  date_from: string;
  return_from: string | null;
  passengers: number;
}

export interface FlightCard {
  id: string;
  tag: string | null;
  tone: 'blue' | 'green' | 'violet' | null;
  airline: string;
  airline_name: string;
  // Newer bot versions only; a search saved by an older version leaves these out.
  airline_code?: string | null;
  stops?: number;
  stop_airports?: string[];
  duration_seconds?: number | null;
  origin: string;
  destination: string;
  depart_at: string | null;
  dep: string;
  arr: string;
  arr_day_offset: number;
  duration: string;
  bags: string;
  fare_rules: string;
  // The fare's full rules as the seller gave them (refund, change, no-show, bags…).
  // Newer bot versions only.
  fare_conditions?: { label: string; value: string }[];
  fare_family: string | null;
  seller: string | null;
  cabin: string | null;
  price: number;
  currency: string;
}

export type SearchStatus = 'running' | 'ok' | 'need_info' | 'no_match' | 'failed';

export interface FlightSearch {
  id: string;
  status: SearchStatus;
  message: string;
  text: string;
  route: Partial<Route>;
  started: number;
  finished: number | null;
  max_price: number | null;
  currency: string;
  found?: number;
  picks?: FlightCard[];
  all?: FlightCard[];
}

/** Passenger details the booking still needs (saved values are never sent here). */
export interface PassengerField {
  name: string;
  label: string;
  kind: 'text' | 'date' | 'select';
  options: { value: string; label: string }[] | null;
  max_length: number;
  optional: boolean;
  on_file: boolean; // saved already: leave blank to keep it
  error: string | null;
}

export interface PassengerFormSpec {
  domestic: boolean;
  intro: string;
  fields: PassengerField[];
}

/** An API refusal; `needs` = passenger form to show, `field_errors` = per-field problems. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly needs?: PassengerFormSpec, readonly fieldErrors?: Record<string, string>) {
    super(message);
  }
}

async function call<T>(method: 'GET' | 'POST', url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Can’t reach the booking service.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data.error || (res.status >= 500 ? 'The booking service isn’t running (python -m traveldesk.web).' : res.statusText),
      res.status,
      data.needs,
      data.field_errors,
    );
  }
  return data as T;
}

export const getTravellers = () => call<Traveller[]>('GET', '/api/book/travellers');

export const startSearch = (user: string, text: string) =>
  call<FlightSearch>('POST', '/api/book/searches', { user, text });

export const getSearch = (id: string) => call<FlightSearch>('GET', '/api/book/searches/' + encodeURIComponent(id));

export type Details = Record<string, string>;

/** Confirm & book the chosen flight right here (no Slack card); the bot books it within seconds. */
export const bookHere = (user: string, search: string, offer: string, details?: Details) =>
  call<{ booking_id: number }>('POST', '/api/book/bookings', { user, search, offer, details });

/** Confirm on the page a request already sent to Slack. */
export const confirmOnWeb = (user: string, bookingId: number, details?: Details) =>
  call<{ booking_id: number; status: string }>('POST', '/api/book/requests/' + bookingId + '/confirm', { user, details });

/** Posts the standard confirmation card to the traveller in Slack; returns the new booking id. */
export const sendToSlack = (user: string, search: string, offer: string) =>
  call<{ booking_id: number }>('POST', '/api/book/requests', { user, search, offer });
