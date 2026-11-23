import { Link } from 'react-router-dom';
import type { Traveller } from '../../services/book';
import type { UpcomingTrip } from '../../lib/tripData';
import { MONTHS } from '../../lib/tripData';
import { initials } from './people';

/** Name and what's saved. Seat and meal preferences aren't stored; there's no profile page to edit. */
export function TravellerCard({ traveller }: { traveller?: Traveller }) {
  if (!traveller) return null;
  const bits = [
    traveller.passport_on_file == null ? null : traveller.passport_on_file ? 'Passport on file' : 'No passport on file',
    traveller.ready ? 'Ready to book' : 'Profile needs fixing',
  ].filter(Boolean);
  return (
    <section className="bk-panel bk-mini" aria-labelledby="bk-trav">
      <h4 id="bk-trav">Traveller</h4>
      <div className="bk-trav">
        <div className="bk-avatar" aria-hidden="true">{initials(traveller.name)}</div>
        <div><b>{traveller.name}</b><small>{bits.join(' · ')}</small></div>
      </div>
    </section>
  );
}

export function UpcomingCard({ trips }: { trips: UpcomingTrip[] | null }) {
  return (
    <section className="bk-panel bk-mini" aria-labelledby="bk-up">
      <h4 id="bk-up">Upcoming trips <Link className="bk-link" to="/">View all</Link></h4>
      {trips == null && <span className="bk-sk" style={{ width: '100%', height: '42px' }} aria-hidden="true"></span>}
      {trips && !trips.length && <p className="bk-quiet">No upcoming trips.</p>}
      {trips?.map((t) => (
        <div key={t.id} className="bk-up">
          <div className="bk-date"><small>{MONTHS[t.date.getMonth()]}</small><b>{String(t.date.getDate()).padStart(2, '0')}</b></div>
          <div><b>{t.route}</b><small>{t.status}</small></div>
        </div>
      ))}
    </section>
  );
}

export function SideSkeleton() {
  return (
    <section className="bk-panel" aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <span className="bk-sk" style={{ width: '30%', height: '11px' }}></span>
      <span className="bk-sk" style={{ width: '60%', height: '24px' }}></span>
      <span className="bk-sk" style={{ width: '100%', height: '90px', borderRadius: '14px' }}></span>
      <span className="bk-sk" style={{ width: '100%', height: '34px' }}></span>
      <span className="bk-sk" style={{ width: '100%', height: '48px', borderRadius: '14px' }}></span>
    </section>
  );
}
