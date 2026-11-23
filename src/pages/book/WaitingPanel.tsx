import { Link } from 'react-router-dom';
import type { WaitingItem } from '../../lib/tripData';
import { ago } from '../../lib/format';

const SHOWN = 3;

/** Bookings paused until this traveller acts (the bookings DB); the first 3, all counted. */
export function WaitingPanel({ items }: { items: WaitingItem[] | null }) {
  const n = items?.length ?? 0;
  return (
    <section className="bk-panel" aria-labelledby="bk-wait">
      <div className="bk-panel-h">
        <div>
          <h2 id="bk-wait">Waiting on you</h2>
          <p>{items == null ? 'Loading…' : n ? n + (n === 1 ? ' booking is' : ' bookings are') + ' paused until you act' : 'Nothing is paused on you'}</p>
        </div>
        <Link className="bk-link" to="/">All bookings</Link>
      </div>
      {items == null && [0, 1].map((i) => (
        <div key={i} className="bk-wait" aria-hidden="true">
          <span className="bk-sk" style={{ width: '38px', height: '38px', borderRadius: '11px' }}></span>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="bk-sk" style={{ width: '70%', height: '14px' }}></span>
            <span className="bk-sk" style={{ width: '45%', height: '11px' }}></span>
          </span>
        </div>
      ))}
      {items && !n && <p className="bk-empty">You’re all caught up. Nothing is waiting on you.</p>}
      {items?.slice(0, SHOWN).map((t) => (
        <div key={t.id} className="bk-wait">
          <div className={'bk-wi ' + (t.kind === 'upload' ? 'u' : 'q')} aria-hidden="true">{t.kind === 'upload' ? '⬆' : '?'}</div>
          <div className="m">
            <b><span className="bk-id">#{t.id}</span>{t.title}</b>
            <small>{t.next} <span className="bk-you">You</span>{t.createdMs > 0 && <span className="bk-age">· {ago(t.createdMs)}</span>}</small>
          </div>
          <button className="bk-ghost">{t.cta}</button>
        </div>
      ))}
    </section>
  );
}

/**
 * Booking events. The ops_events table is empty and the bookings table keeps only each
 * request's creation time, so there's nothing real to list yet: a quiet empty state.
 */
export function ActivityPanel() {
  return (
    <section className="bk-panel" aria-labelledby="bk-activity">
      <div className="bk-panel-h"><div><h2 id="bk-activity">Recent activity</h2><p>From the app and Slack</p></div></div>
      <p className="bk-empty">No activity recorded yet.</p>
    </section>
  );
}
