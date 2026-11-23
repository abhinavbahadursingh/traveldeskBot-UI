import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Traveller } from '../../services/book';
import { Icon } from '../../components/ui/Icon';
import { initials } from './people';

interface Props {
  active: 'book' | 'bookings';
  travellers?: Traveller[];
  user?: string;
  onUser?: (id: string) => void;
  waiting?: number | null; // bookings paused on this traveller; null while loading
  right?: ReactNode; // replaces the traveller picker (the bookings page shows live status instead)
}

/** Sticky glass nav shared by Book a trip and All bookings. Travellers / Policy / notifications are left out: those pages and feeds don't exist yet. */
export function BookNav({ active, travellers = [], user = '', onUser, waiting = null, right }: Props) {
  const me = travellers.find((t) => t.id === user);
  return (
    <nav className="bk-nav" aria-label="Primary">
      <div className="bk-brand">
        <span className="bk-logo" aria-hidden="true"><Icon name="plane" size={18} style={{ strokeWidth: 2 }} /></span>
        Travel Desk
      </div>
      <div className="bk-tabs">
        {active === 'book'
          ? <a className="on" href="#top" aria-current="page">Book a trip</a>
          : <Link to="/book">Book a trip</Link>}
        {active === 'bookings'
          ? <a className="on" href="#top" aria-current="page">All bookings</a>
          : (
            <Link to="/">
              All bookings
              {!!waiting && <span className="bk-count" aria-label={waiting + ' waiting on you'}>{waiting}</span>}
            </Link>
          )}
      </div>
      <div className="bk-nav-right">
        {right ?? (
          <span className="bk-user">
            <span className="bk-avatar" aria-hidden="true">{me ? initials(me.name).charAt(0) : '?'}</span>
            <label className="sr-only" htmlFor="bk-who">Booking for</label>
            <select id="bk-who" value={user} onChange={(e) => onUser?.(e.target.value)} disabled={!travellers.length}>
              {!travellers.length && <option value="">No travellers</option>}
              {travellers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        )}
      </div>
    </nav>
  );
}
