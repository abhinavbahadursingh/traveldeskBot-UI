import { useEffect, useRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { FlightCard, FlightSearch } from '../../services/book';
import { RESULT_MODES, ordered, tagFor, type ResultMode } from '../../lib/results';
import { fmt } from '../../lib/format';
import { useDialogFocus } from '../../lib/useDialogFocus';
import { badgeClass, stopsLabel } from './flightFacts';
import { dayLabel } from './dates';

interface Props {
  search: FlightSearch;
  pick: string | null;
  locked: boolean;
  mode: ResultMode;
  onMode: (m: ResultMode) => void;
  onPick: (id: string) => void;
  onClose: () => void;
}

const cabin = (c: FlightCard) => (c.cabin ? ' · ' + c.cabin.charAt(0).toUpperCase() + c.cabin.slice(1) : '');

/**
 * Every flight in the search, in a pop-up over the page. Rendered into <body> because the
 * results panel's backdrop-filter would otherwise trap a fixed-position overlay inside it.
 */
export function AllFlightsDialog({ search, pick, locked, mode, onMode, onPick, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref);
  const list = ordered(search, mode);

  // Esc closes; the page behind doesn't scroll while it's open.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  // Keep Tab inside the dialog.
  const trap = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href]')];
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return createPortal(
    <div className="bk-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className="bk-modal-box" role="dialog" aria-modal="true" aria-labelledby="bk-all-title" onKeyDown={trap}>
        <div className="bk-modal-h">
          <div>
            <h2 id="bk-all-title">All {search.all?.length ?? list.length} flights for {dayLabel(search.route.date_from)}</h2>
            <p>{search.route.origin} → {search.route.destination} · All prices are final, with taxes and fees included.</p>
          </div>
          <button className="bk-ghost bk-modal-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="bk-seg" role="radiogroup" aria-label="Sort flights">
          {RESULT_MODES.map(([m, label]) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => onMode(m)}>{label}</button>
          ))}
        </div>
        <div className="bk-modal-list bk-more">
          {!list.length && <p className="bk-empty" style={{ margin: '14px' }}>No flights match this filter.</p>}
          {list.map((o) => {
            const tag = tagFor(search, o.id);
            const on = pick === o.id;
            return (
              <div key={o.id} className={'bk-row' + (on ? ' on' : '')}>
                <div>
                  <span className="t">{o.airline_name}</span>
                  <small>{stopsLabel(o)}{cabin(o)}</small>
                </div>
                <div>
                  {o.dep} → {o.arr}{o.arr_day_offset > 0 && <sup style={{ color: 'var(--rose)', fontSize: '11px' }}>+{o.arr_day_offset}</sup>}
                  {tag && <span className={'bk-badge ' + badgeClass(tag)} style={{ marginLeft: '10px' }}>{tag}</span>}
                </div>
                <div>{o.duration}</div>
                <div className="p">{fmt(o.price)}</div>
                <button className="bk-ghost" aria-pressed={on} disabled={locked}
                  onClick={() => { onPick(o.id); onClose(); }}
                  aria-label={(on ? 'Selected: ' : 'Select ') + o.airline_name + ' ' + o.dep + ', ' + fmt(o.price)}>
                  {on ? 'Selected' : 'Select'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
