import { Link } from 'react-router-dom';
import type { Details, FlightCard, FlightSearch, PassengerFormSpec } from '../../services/book';
import type { Booking } from '../../services/bookings';
import { fmt } from '../../lib/format';
import { PROGRESS_STEPS, progressFor } from '../../lib/bookProgress';
import { Icon } from '../../components/ui/Icon';
import { ProgressSteps } from '../../components/ui/ProgressSteps';
import { daysAhead, shortDay } from './dates';
import { PassengerForm } from './PassengerForm';
import { stopsLabel } from './flightFacts';

interface Props {
  user: string;
  search: FlightSearch | null;
  sel: FlightCard | null;
  sending: boolean;
  sendError: string | null;
  sent: Booking | null;
  showBreak: boolean;
  onToggleBreak: () => void;
  onSubmit: () => void;
  onChange: () => void;
  onAnother: () => void;
  confirming: boolean;
  actionError: string | null;
  needs: PassengerFormSpec | null; // passenger details to collect before booking
  fieldErrors: Record<string, string>;
  onConfirm: (details?: Details) => void; // book here (new or already sent to Slack)
  onCancelDetails: () => void;
}

type ConfirmProps = Pick<Props, 'confirming' | 'needs' | 'fieldErrors' | 'onConfirm' | 'onCancelDetails'> & { price?: number | null };

/** "Confirm & book", or the passenger form when the booking needs more details. */
function ConfirmHere({ confirming, needs, fieldErrors, onConfirm, onCancelDetails, price }: ConfirmProps) {
  if (needs) {
    return <PassengerForm spec={needs} fieldErrors={fieldErrors} busy={confirming} onSubmit={onConfirm} onCancel={onCancelDetails} />;
  }
  return (
    <button className="bk-primary bk-full" onClick={() => onConfirm()} disabled={confirming}>
      {confirming ? 'Booking…' : 'Confirm & book' + (price != null ? ' · ' + fmt(price) : '')}
    </button>
  );
}

/** LetsFG approve-and-pay link the bot stored with the booking result, if any. */
function approveUrl(b: Booking): string | null {
  try {
    const url = JSON.parse(b.raw.details || '{}').approve_url;
    return typeof url === 'string' && url.startsWith('https://') ? url : null;
  } catch {
    return null;
  }
}

/** What the traveller can do next on the page: confirm, or pay. */
function NextAction({ user, sent, actionError, ...confirm }: ConfirmProps & { user: string; sent: Booking; actionError: string | null }) {
  const payTo = (sent.raw.pay_approvers || sent.raw.slack_user || '').split(',').filter(Boolean);
  const payUrl = sent.raw.pay_url && sent.raw.pay_url.startsWith('https://') ? sent.raw.pay_url : null;
  const approve = sent.status === 'awaiting_approval' ? approveUrl(sent) : null;
  const linkBtn = { textDecoration: 'none' };
  return (
    <>
      {actionError && <p className="bk-err" role="alert">{actionError}</p>}
      {sent.status === 'awaiting_confirm' && (
        <>
          <ConfirmHere {...confirm} />
          {!confirm.needs && <p className="bk-fine" style={{ margin: 0 }}>Or press Confirm on the Slack card. Either one books it.</p>}
        </>
      )}
      {sent.status === 'awaiting_payment' && payUrl && (payTo.includes(user) ? (
        <>
          <a className="bk-primary bk-full" href={payUrl} target="_blank" rel="noopener noreferrer" style={linkBtn}>Pay now</a>
          <p className="bk-fine" style={{ margin: 0 }}>Secure LetsFG page: any card, Apple Pay, Google Pay or Revolut Pay. Nothing is charged until you pay.</p>
        </>
      ) : (
        <p className="bk-fine" style={{ margin: 0 }}>The payment approver has the pay link in Slack.</p>
      ))}
      {approve && (
        <a className="bk-primary bk-full" href={approve} target="_blank" rel="noopener noreferrer" style={linkBtn}>Approve &amp; pay on LetsFG</a>
      )}
    </>
  );
}

/** The fare's full rules, always shown before Confirm. Rules the seller didn't send say so. */
function FareRules({ sel }: { sel: FlightCard }) {
  const rows = sel.fare_conditions?.length
    ? sel.fare_conditions
    : [{ label: 'Baggage', value: sel.bags }, { label: 'Changes & refunds', value: sel.fare_rules }];
  return (
    <section className="bk-rules" aria-labelledby="bk-rules-h" key={sel.id}>
      <h4 id="bk-rules-h">Fare rules</h4>
      <dl>
        {rows.map((r) => (
          <div key={r.label} className={r.value.startsWith('Not provided') ? 'bk-rule unknown' : 'bk-rule'}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="bk-fine" style={{ margin: 0 }}>As given by the seller. The airline&apos;s full fare conditions apply.</p>
    </section>
  );
}

function checksFor(search: FlightSearch, sel: FlightCard) {
  const checks: { ok: boolean; text: string }[] = [];
  if (search.max_price != null) checks.push({ ok: true, text: 'Within the ' + fmt(search.max_price) + ' trip budget' });
  const days = daysAhead(sel.depart_at);
  if (days != null) checks.push({ ok: days >= 1, text: days >= 1 ? 'Booked ' + days + (days === 1 ? ' day' : ' days') + ' ahead' : 'Departs today' });
  if (sel.cabin) checks.push({ ok: sel.cabin === 'economy', text: sel.cabin === 'economy' ? 'Economy, as per policy' : 'Cabin: ' + sel.cabin });
  const asked = search.route.passengers ?? 1;
  if (asked > 1) checks.push({ ok: false, text: 'Books 1 traveller (you asked for ' + asked + ')' });
  return checks;
}

export function TripSummary({ user, search, sel, sending, sendError, sent, showBreak, onToggleBreak, onSubmit, onChange, onAnother, actionError, ...confirm }: Props) {
  const title = sel ? sel.origin + ' → ' + sel.destination + ' · ' + shortDay(sel.depart_at) : 'Your request';

  if (sent) {
    const pr = progressFor(sent.status, sent.raw.pnr);
    return (
      <section className="bk-panel bk-trip" aria-labelledby="bk-sum" aria-live="polite">
        <div className="pop" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pr.ok
            ? <span className="success" aria-hidden="true"><Icon name="check" size={26} style={{ strokeWidth: 2.4 }} /></span>
            : <span className="warn" aria-hidden="true"><Icon name="warn" size={22} /></span>}
          <div>
            <div className="bk-eyebrow">Your trip</div>
            <h3 id="bk-sum">{pr.title}</h3>
            <p className="sub" style={{ lineHeight: 1.5 }}>{pr.text}</p>
          </div>
          {pr.ok && <ProgressSteps labels={PROGRESS_STEPS} current={pr.current} />}
          <NextAction user={user} sent={sent} actionError={actionError} {...confirm} price={sent.price} />
          <div className="bk-total" style={{ marginTop: 0 }}><span style={{ fontSize: '13px', color: 'var(--muted)' }}>{'#' + sent.id + ' · ' + title}</span><b style={{ fontSize: '20px' }}>{fmt(sent.price)}</b></div>
          <Link className="bk-sec" to="/">Track in bookings</Link>
          {sent.status === 'awaiting_confirm'
            ? <button className="bk-sec" onClick={onChange}>Change flight</button>
            : <button className="bk-sec" onClick={onAnother}>Book another trip</button>}
        </div>
      </section>
    );
  }

  return (
    <section className="bk-panel bk-trip" aria-labelledby="bk-sum">
      <div className="bk-eyebrow">Your trip</div>
      <h3 id="bk-sum">{sel ? sel.origin + ' → ' + sel.destination : 'No flight chosen yet'}</h3>
      <div className="sub">
        {sel ? [shortDay(sel.depart_at), sel.airline_name, '1 traveller'].filter(Boolean).join(' · ') : 'Search, then pick a flight to see it here.'}
      </div>
      {sel && search && (
        <>
          <div className="bk-legs">
            <span className="d"></span><div><b>{sel.dep} · {sel.origin}</b></div>
            <span className="v"></span><div style={{ color: 'var(--muted)', fontSize: '12px', alignSelf: 'center' }}>{sel.duration} {stopsLabel(sel).toLowerCase()}</div>
            <span className="d end"></span><div><b>{sel.arr}{sel.arr_day_offset > 0 ? ' (+' + sel.arr_day_offset + ')' : ''} · {sel.destination}</b></div>
          </div>
          <div className="bk-kv"><span>Fare, taxes &amp; fees</span><span>{fmt(sel.price)}</span></div>
          {showBreak && (
            <>
              {sel.fare_family && <div className="bk-kv pop"><span>Fare</span><span>{sel.fare_family}</span></div>}
              {sel.seller && <div className="bk-kv pop"><span>Sold by</span><span>{sel.seller}</span></div>}
              <div className="bk-kv pop"><span>Booking fee</span><span>₹0</span></div>
            </>
          )}
          <button className="bk-link" aria-expanded={showBreak} onClick={onToggleBreak}>{showBreak ? 'Hide fare details' : 'Show fare details'}</button>
          <div className="bk-total"><span style={{ fontWeight: 600 }}>Total, all in</span><b><span key={sel.id} className="bk-tick">{fmt(sel.price)}</span></b></div>
          <div className="bk-checks" key={sel.id}>
            {checksFor(search, sel).map((c) => (
              <div key={c.text} className={'bk-ck' + (c.ok ? '' : ' no')}><i aria-hidden="true">{c.ok ? '✓' : '!'}</i><span><span className="sr-only">{c.ok ? 'OK: ' : 'Check: '}</span>{c.text}</span></div>
            ))}
          </div>
          <FareRules sel={sel} />
          {(actionError || sendError) && <p className="bk-err" role="alert">{actionError || sendError}</p>}
          <ConfirmHere {...confirm} price={sel.price} />
          {!confirm.needs && (
            <>
              <p className="bk-fine">Books now with LetsFG. Updates appear here and in Slack.</p>
              <button className="bk-sec" onClick={onSubmit} disabled={sending || confirm.confirming}>{sending ? 'Sending…' : 'Send to Slack to confirm there'}</button>
            </>
          )}
        </>
      )}
    </section>
  );
}
