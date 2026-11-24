import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Traveller } from '../../services/book';
import { Icon } from '../../components/ui/Icon';
import { initials } from './people';

interface Props {
  active: 'book' | 'bookings' | 'gst';
  travellers?: Traveller[];
  user?: string;
  onUser?: (id: string) => void;
  waiting?: number | null; // bookings paused on this traveller; null while loading
  right?: ReactNode; // replaces the traveller picker (the bookings page shows live status instead)
}

/** Where the active-tab pill was last drawn, so the next page's nav can slide it across. */
let lastPill: { left: number; width: number } | null = null;

/** Sticky glass nav shared by Book a trip and All bookings. Travellers / Policy / notifications are left out: those pages and feeds don't exist yet. */
export function BookNav({ active, travellers = [], user = '', onUser, waiting = null, right }: Props) {
  const me = travellers.find((t) => t.id === user);
  const tabsRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  // Slide the active-tab pill from where it sat on the previous page to the current tab.
  useLayoutEffect(() => {
    const on = tabsRef.current?.querySelector<HTMLElement>('a.on');
    const pill = pillRef.current;
    if (!on || !pill) return;
    const to = { left: on.offsetLeft, width: on.offsetWidth };
    const from = lastPill ?? to;
    pill.style.transition = 'none';
    pill.style.transform = `translateX(${from.left}px)`;
    pill.style.width = from.width + 'px';
    void pill.offsetWidth; // commit the start position before transitioning
    pill.style.transition = '';
    pill.style.transform = `translateX(${to.left}px)`;
    pill.style.width = to.width + 'px';
    lastPill = to;
  }, [active, waiting]);

  return (
    <nav className="bk-nav" aria-label="Primary">
      <div className="bk-brand">
        <span className="bk-logo" aria-hidden="true"><Icon name="plane" size={18} style={{ strokeWidth: 2 }} /></span>
        Travel Desk
      </div>
      <div className="bk-tabs" ref={tabsRef}>
        <span className="bk-tab-pill" ref={pillRef} aria-hidden="true" />
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
        {active === 'gst'
          ? <a className="on" href="#top" aria-current="page">GST</a>
          : <Link to="/gst">GST</Link>}
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
