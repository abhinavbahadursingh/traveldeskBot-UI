import type { TripData } from '../../lib/tripData';
import { greeting } from '../../lib/tripData';
import { age, fmtShort } from '../../lib/format';
import { firstName } from './people';

interface Props {
  name?: string;
  data: TripData | null; // null while the bookings load
}

/**
 * Heading, greeting and the stat tiles. Only tiles with real data render:
 * there's no monthly budget (MAX_PRICE is a per-trip cap) and no list fare yet,
 * so "Spent" has no bar and "Saved vs list fare" is left out.
 */
export function Hero({ name, data }: Props) {
  return (
    <section className="bk-hero">
      <div>
        <div className="bk-eyebrow">Book a trip</div>
        <h1>Where do you need to be?</h1>
        <p className="bk-greet">
          {greeting()}{name ? ', ' + firstName(name) : ''}. Type it the way you’d say it — we’ll handle the rest.
        </p>
      </div>
      {data ? <Stats data={data} /> : <StatsSkeleton />}
    </section>
  );
}

function Stats({ data }: { data: TripData }) {
  const diff = data.tripsThisMonth - data.tripsLastMonth;
  const oldest = data.waiting.length ? Math.min(...data.waiting.map((w) => w.createdMs || Date.now())) : null;
  return (
    <div className="bk-stats" style={{ ['--n' as string]: 3 }}>
      <div className="bk-stat">
        <small>Trips this month</small>
        <b>{data.tripsThisMonth}</b>
        <em className={diff > 0 ? '' : diff < 0 ? 'down' : 'flat'}>
          {diff > 0 ? '▲ ' + diff : diff < 0 ? '▼ ' + -diff : 'Same as'} {diff === 0 ? data.lastMonthName : 'vs ' + data.lastMonthName}
        </em>
      </div>
      <div className="bk-stat">
        <small>Spent this month</small>
        <b>{fmtShort(data.spentThisMonth)}</b>
        <em className="flat">Booked trips, all in</em>
      </div>
      <div className="bk-stat">
        <small>Needs your action</small>
        <b style={{ color: data.waiting.length ? 'var(--rose)' : undefined }}>{data.waiting.length}</b>
        <em className="flat">{oldest != null ? 'oldest ' + age(oldest) : 'All clear'}</em>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="bk-stats" style={{ ['--n' as string]: 3 }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bk-stat">
          <span className="bk-sk" style={{ width: '70%', height: '12px' }}></span>
          <span className="bk-sk" style={{ width: '40%', height: '22px', marginTop: '6px' }}></span>
          <span className="bk-sk" style={{ width: '55%', height: '10px', marginTop: '6px' }}></span>
        </div>
      ))}
    </div>
  );
}
