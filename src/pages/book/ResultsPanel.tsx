import { useCallback, useState, type KeyboardEvent } from 'react';
import type { FlightSearch } from '../../services/book';
import { RESULT_MODES, ordered, tagFor, type ResultMode } from '../../lib/results';
import { fmt } from '../../lib/format';
import { HoldTimer } from './HoldTimer';
import { AllFlightsDialog } from './AllFlightsDialog';
import { FlightOption, FlightOptionSkeleton } from './FlightOption';
import { stopsLabel } from './flightFacts';
import { dayLabel } from './dates';

interface Props {
  search: FlightSearch | null;
  error: string | null;
  pick: string | null;
  onPick: (id: string) => void;
  locked: boolean; // a request was sent: the choice can't change here
  left: number;
  onReload?: () => void;
  mode: ResultMode;
  onMode: (m: ResultMode) => void;
}

const TOP = 3, MORE = 3;

const HEADING: Record<ResultMode, string> = { best: 'picks', cheapest: 'cheapest', fastest: 'fastest', nonstop: 'nonstop' };

export function ResultsPanel({ search, error, pick, onPick, locked, left, onReload, mode, onMode }: Props) {
  const [allOpen, setAllOpen] = useState(false);
  const closeAll = useCallback(() => setAllOpen(false), []);
  const running = search?.status === 'running';
  const ok = search?.status === 'ok';
  const list = ok ? ordered(search, mode) : [];
  const top = list.slice(0, TOP);
  const rest = list.slice(TOP);
  const more = rest.slice(0, MORE);
  const total = search?.all?.length ?? list.length;
  const day = ok ? dayLabel(search.route.date_from) : '';

  const title = ok
    ? (list.length ? top.length + ' ' + HEADING[mode] + ' for ' + day : 'No ' + HEADING[mode] + ' flights for ' + day)
    : running ? 'Searching flights…' : 'Flights';

  const focusId = top.some((c) => c.id === pick) ? pick : top[0]?.id;

  // Arrow keys move the choice within the radio group, as native radios do.
  const onKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (locked || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const i = Math.max(0, top.findIndex((c) => c.id === pick));
    const next = top[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : top.length - 1)) % top.length];
    if (!next) return;
    onPick(next.id);
    (e.currentTarget.querySelector('[data-id="' + CSS.escape(next.id) + '"]') as HTMLElement | null)?.focus();
  };

  return (
    <section className="bk-panel" aria-labelledby="bk-results" aria-busy={running}>
      <div className="bk-panel-h">
        <div>
          <h2 id="bk-results">{title}</h2>
          <p>
            {ok ? 'All prices are final, with taxes and fees included.'
              : running ? 'Live fares from LetsFG. This usually takes 1–3 minutes.'
              : 'Describe your trip above and press Find flights.'}
          </p>
        </div>
        {ok && <HoldTimer left={left} onReload={onReload} />}
      </div>

      {error && <p className="bk-err" role="alert">{error}</p>}
      {search && !ok && !running && <p className="bk-err" role="alert">{search.message || 'No flights found.'}</p>}

      {running && (
        <>
          <div className="bk-searching" role="status">
            <span>{search.route.origin || 'From'}</span>
            <span className="track" aria-hidden="true"><span className="plane"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg></span></span>
            <span>{search.route.destination || 'To'}</span>
            <span className="sr-only">Searching flights</span>
          </div>
          <div className="bk-picks">{[0, 1, 2].map((i) => <FlightOptionSkeleton key={i} />)}</div>
        </>
      )}

      {ok && (
        <>
          <div className="bk-seg" role="radiogroup" aria-label="Sort flights">
            {RESULT_MODES.map(([m, label]) => (
              <button key={m} role="radio" aria-checked={mode === m} onClick={() => onMode(m)}>{label}</button>
            ))}
          </div>

          {!list.length && <p className="bk-empty">No {HEADING[mode]} flights in this search. Try another filter.</p>}

          {top.length > 0 && (
            <div className="bk-picks" role="radiogroup" aria-label="Flight options" onKeyDown={onKeys}>
              {top.map((o) => (
                <FlightOption key={o.id} o={o} tag={tagFor(search, o.id)} on={pick === o.id} focusable={o.id === focusId} onPick={() => onPick(o.id)} disabled={locked && pick !== o.id} />
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="bk-more">
              <div className="bk-more-h">
                <span>Other good options</span>
                <button className="bk-link" onClick={() => setAllOpen(true)} aria-haspopup="dialog">See all {total} flights →</button>
              </div>
              {more.map((o) => (
                <div key={o.id} className={'bk-row' + (pick === o.id ? ' on' : '')}>
                  <div><span className="t">{o.airline_name}</span><small>{stopsLabel(o)}{o.cabin ? ' · ' + o.cabin.charAt(0).toUpperCase() + o.cabin.slice(1) : ''}</small></div>
                  <div>{o.dep} → {o.arr}{o.arr_day_offset > 0 && <sup style={{ color: 'var(--rose)', fontSize: '11px' }}>+{o.arr_day_offset}</sup>}</div>
                  <div>{o.duration}</div>
                  <div className="p">{fmt(o.price)}</div>
                  <button className="bk-ghost" aria-pressed={pick === o.id} onClick={() => onPick(o.id)} disabled={locked}
                    aria-label={(pick === o.id ? 'Selected: ' : 'Select ') + o.airline_name + ' ' + o.dep + ', ' + fmt(o.price)}>
                    {pick === o.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {ok && allOpen && (
        <AllFlightsDialog search={search} pick={pick} locked={locked} mode={mode} onMode={onMode} onPick={onPick} onClose={closeAll} />
      )}
    </section>
  );
}
