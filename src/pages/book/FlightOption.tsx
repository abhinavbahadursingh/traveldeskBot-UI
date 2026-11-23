import type { FlightCard } from '../../services/book';
import { fmt } from '../../lib/format';
import { stopsOf } from '../../lib/results';
import { airlineCode, airlineColour, badgeClass, factsFor, missingLine, selClass, stopsLabel } from './flightFacts';

interface Props {
  o: FlightCard;
  tag: string | null;
  on: boolean;
  focusable: boolean; // roving tab stop: the selected card, else the first
  onPick: () => void;
  disabled?: boolean;
}

/** One flight in the picks grid: a radio in the "Flight options" group. */
export function FlightOption({ o, tag, on, focusable, onPick, disabled }: Props) {
  const { facts, missing } = factsFor(o);
  const unk = missingLine(missing);
  const code = airlineCode(o);
  const label = o.airline_name + ', ' + o.dep + ' to ' + o.arr + ', ' + stopsLabel(o) + ', ' + fmt(o.price) + (tag ? ', ' + tag : '');
  return (
    <button
      className={'bk-fl' + (on ? ' sel' + selClass(tag) : '')}
      role="radio"
      aria-checked={on}
      aria-label={label}
      tabIndex={focusable ? 0 : -1}
      data-id={o.id}
      onClick={onPick}
      disabled={disabled}
    >
      <div className="bk-fl-top">
        <span className="bk-air"><span className="bk-al" style={{ background: airlineColour(code) }} aria-hidden="true">{code}</span><span>{o.airline_name}</span></span>
        <span className="bk-radio" aria-hidden="true">{on ? '✓' : ''}</span>
      </div>
      <div className="bk-times">
        <b>{o.dep}</b>
        <div className="bk-route">{o.duration}<div className={'ln' + (stopsOf(o) > 0 ? ' stop' : '')}></div>{stopsLabel(o)}</div>
        <b>{o.arr}{o.arr_day_offset > 0 && <sup>+{o.arr_day_offset}</sup>}</b>
      </div>
      <div className="bk-codes"><span>{o.origin}</span><span>{o.destination}</span></div>
      <div className="bk-facts">
        {facts.map((f) => <span key={f.text} className={'bk-tag' + (f.tone === 'good' ? ' g' : f.tone === 'bad' ? ' r' : '')}>{f.text}</span>)}
      </div>
      {unk ? <div className="bk-unk">{unk}</div> : <div className="bk-unk" aria-hidden="true">{'\u00a0'}</div>}
      <div className="bk-price">
        <div><b>{fmt(o.price)}</b>{o.seller && <div className="bk-sold">Sold by {o.seller}</div>}</div>
        {tag && <span className={'bk-badge ' + badgeClass(tag)}>{tag}</span>}
      </div>
    </button>
  );
}

export function FlightOptionSkeleton() {
  return (
    <div className="bk-fl sk" aria-hidden="true">
      <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span className="bk-sk" style={{ width: '26px', height: '26px', borderRadius: '7px' }}></span>
        <span className="bk-sk" style={{ width: '45%', height: '14px' }}></span>
      </span>
      <span className="bk-sk" style={{ width: '100%', height: '28px', marginTop: '6px' }}></span>
      <span className="bk-sk" style={{ width: '100%', height: '10px' }}></span>
      <span style={{ display: 'flex', gap: '6px' }}>
        <span className="bk-sk" style={{ width: '30%', height: '22px' }}></span>
        <span className="bk-sk" style={{ width: '30%', height: '22px' }}></span>
      </span>
      <span className="bk-sk" style={{ width: '100%', height: '1px', marginTop: '6px' }}></span>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="bk-sk" style={{ width: '40%', height: '26px' }}></span>
        <span className="bk-sk" style={{ width: '25%', height: '22px', borderRadius: '99px' }}></span>
      </span>
    </div>
  );
}
