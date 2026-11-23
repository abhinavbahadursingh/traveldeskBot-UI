import type { FlightSearch, Traveller } from '../../services/book';
import { shortDay } from './dates';

/** Example requests. Clicking one fills the box and searches. */
export const EXAMPLES = [
  'Delhi to Mumbai tomorrow morning',
  'Delhi to Bengaluru Friday, back Sunday',
  'Cheapest Delhi to Dubai next week',
];

interface Props {
  ask: string;
  onAsk: (v: string) => void;
  onFind: (text?: string) => void;
  busy: boolean;
  traveller?: Traveller;
  search: FlightSearch | null;
  recent: string[]; // "DEL → BOM"
}

/**
 * The request box, what the parser understood (read-only: the search API takes free text only),
 * and the profile / recent / example chips.
 */
export function SearchCard({ ask, onAsk, onFind, busy, traveller, search, recent }: Props) {
  const canFind = !busy && !!traveller?.ready && ask.trim().length > 0;
  const r = search?.route;
  const parsed = !!(r && r.origin && r.destination);
  const pax = r?.passengers ?? 1;

  const fillRoute = (route: string) => {
    onAsk(route.replace(' → ', ' to ') + ' ');
    const el = document.getElementById('bk-ask') as HTMLInputElement | null;
    el?.focus();
  };

  return (
    <>
      <div className="bk-search">
        <div className="bk-search-row">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" aria-hidden="true" style={{ flex: 'none' }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          <label className="sr-only" htmlFor="bk-ask">Describe your trip</label>
          <input
            id="bk-ask"
            type="text"
            placeholder="e.g. Delhi to Mumbai, Sunday morning"
            maxLength={300}
            value={ask}
            onChange={(e) => onAsk(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canFind) onFind(); }}
          />
          <button className="bk-primary" onClick={() => onFind()} disabled={!canFind}>
            {busy ? 'Searching…' : 'Find flights'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
        {parsed && (
          <div className="bk-parsed" aria-label="What we understood">
            <div className="bk-pill"><small>From</small><b>{r!.origin}</b></div>
            <div className="bk-pill"><small>To</small><b>{r!.destination}</b></div>
            {r!.date_from && <div className="bk-pill"><small>Depart</small><b>{shortDay(r!.date_from).replace(' ', ', ')}</b></div>}
            <div className="bk-pill"><small>Return</small>{r!.return_from ? <b>{shortDay(r!.return_from).replace(' ', ', ')}</b> : <b className="none">One way</b>}</div>
            <div className="bk-pill"><small>Who</small><b>{pax + (pax === 1 ? ' traveller' : ' travellers')}</b></div>
          </div>
        )}
      </div>

      <div className="bk-chips">
        {traveller && (traveller.ready
          ? <span className="bk-chip ok">✓ Profile saved · ready to book</span>
          : <span className="bk-chip warn">⚠ Profile needs fixing by the admin: {traveller.problems}</span>)}
        {recent.length > 0 && (
          <>
            <span className="lbl">Recent:</span>
            {recent.map((route, i) => (
              <button key={route} className="bk-chip" onClick={() => fillRoute(route)} disabled={busy}>
                ↻ {route}{i === 0 ? ' again' : ''}
              </button>
            ))}
          </>
        )}
        {traveller?.ready && (
          <>
            <span className="lbl">Try:</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} className="bk-chip" onClick={() => { onAsk(ex); onFind(ex); }} disabled={busy}>{ex}</button>
            ))}
          </>
        )}
      </div>
    </>
  );
}
