import { useEffect, useRef, useState } from 'react';
import { getUsage, type AiUsage, type Booking } from '../../services/bookings';
import { fmt } from '../../lib/format';
import { BOOKING_STEPS, isCancellable, payMeta, stageIndex, statusMeta } from '../../lib/status';
import { useDialogFocus } from '../../lib/useDialogFocus';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { ProgressSteps } from '../../components/ui/ProgressSteps';
import { StatusChip } from '../../components/ui/StatusChip';
import { SchemaGroup, type SchemaRow } from './SchemaGroup';
import { PayLink } from './PayLink';
import { detailsGroups } from './detailsGroups';
import { usageRows } from './usageGroup';
import { ConfirmPanel } from './ConfirmPanel';
import { SourceBadge } from '../../components/ui/SourceBadge';
import { cancelledVia, confirmedVia, requestedVia } from '../../lib/channel';

type Val = string | number | null | undefined;

const V = (x: Val) => (x == null || x === '' ? { val: '—', cls: 'kv-v muted' } : { val: String(x), cls: 'kv-v' });

export function BookingDrawer({ sb, onClose, onAsk, onChanged }: { sb: Booking; onClose: () => void; onAsk: () => void; onChanged: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useDialogFocus(ref);

  // AI usage for this booking; reloaded when its status moves (new calls may be logged).
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [usageFailed, setUsageFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setUsageFailed(false);
    getUsage(sb.id).then(
      (u) => { if (alive) setUsage(u); },
      () => { if (alive) setUsageFailed(true); },
    );
    return () => { alive = false; };
  }, [sb.id, sb.status]);

  const pm = payMeta(sb.payment);
  const r = sb.raw;
  const cur = stageIndex(sb.status);
  const G: [string, boolean, [string, Val][]][] = [
    ['Core', true, [['id', r.id], ['created_at', r.created_at], ['slack_user', r.slack_user], ['request', r.request], ['status', r.status], ['request_key', r.request_key], ['provider', r.provider]]],
    ['Result', true, [['booking_ref', r.booking_ref], ['pnr', r.pnr], ['price', r.price != null ? r.price.toLocaleString('en-IN') : null], ['currency', r.currency], ['charged_amount', r.charged_amount]]],
    ['Payment', false, [['payment_status', r.payment_status]]],
    ['Pay-by-link', sb.status === 'awaiting_payment', [['pay_url', r.pay_url], ['declined_booking_ref', r.declined_booking_ref], ['pay_started_at', r.pay_started_at], ['pay_expires_at', r.pay_expires_at], ['pay_reminded_at', r.pay_reminded_at], ['pay_approvers', r.pay_approvers]]],
    ['Confirmation', false, [['approver', r.approver], ['approval_ts', r.approval_ts], ['manager_message_ts', r.manager_message_ts], ['manager_channel', r.manager_channel]]],
    ['Threading', false, [['slack_thread_ts', r.slack_thread_ts]]],
  ];
  const base = G.map(([title, open, rows]) => ({
    title,
    open,
    rows: rows.map(([key, x]): SchemaRow => ({ key, ...V(x) })),
  }));
  // bookings.details is JSON: shown as readable groups after "Result", raw only if it isn't JSON.
  const parsed = detailsGroups(r.details);
  const details = parsed
    ? parsed.map((g) => ({ ...g, title: 'Details · ' + g.title }))
    : [{ title: 'Details', open: false, rows: [{ key: 'details', ...V(r.details) }] }];
  const ai = { title: 'AI usage', open: true, rows: usageRows(usage, usageFailed) };
  const groups = [...base.slice(0, 2), ai, ...details, ...base.slice(2)];

  const isAwaiting = sb.status === 'awaiting_payment';
  const isStuck = sb.status === 'searching' && !!sb.stuck;
  const closed = statusMeta(sb.status).group === 'closed';

  return (
    <>
      <button className="scrim fade" aria-label="Close booking details" onClick={onClose}></button>
      <aside ref={ref} className="drawer glass-strong" role="dialog" aria-modal="true" aria-label={'Booking ' + sb.id + ' details'}>
        <div className="drawer-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="mono id" style={{ fontSize: '14px' }}>{'#' + sb.id}</span>
              <StatusChip status={sb.status} />
            </div>
            <IconButton icon="close" aria-label="Close" onClick={onClose} />
          </div>

          <div>
            <h2 className="h2">{sb.request}</h2>
            <p className="muted-t" style={{ margin: '8px 0 0' }}>{'Created ' + sb.created}</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }} aria-label="Where this happened">
              <SourceBadge via={requestedVia(sb)} action="Requested" />
              {confirmedVia(sb) && <SourceBadge via={confirmedVia(sb)!} action="Confirmed" />}
              {cancelledVia(sb) && <SourceBadge via={cancelledVia(sb)!} action="Cancelled" />}
            </div>
          </div>

          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div className="muted-t" style={{ fontSize: '13px' }}>Quoted price</div>
                <div className="bigprice">{fmt(sb.price)}</div>
              </div>
              <span className="pay" style={{ padding: '8px 14px', borderRadius: '999px', background: 'rgba(255,255,255,.75)' }}><span className="dot" style={{ background: pm.dot }}></span>{pm.label}</span>
            </div>
            {cur != null && <ProgressSteps labels={BOOKING_STEPS} current={cur} />}
          </div>

          {isAwaiting && (
            <Callout tone="amber" icon="card">{'Pay link sent to the traveller for ' + fmt(sb.price) + '. The booking completes once payment lands and a PNR comes back.'}</Callout>
          )}
          <ConfirmPanel booking={sb} onChanged={onChanged} />
          <PayLink booking={sb} />
          {isStuck && (
            <Callout tone="orange" icon="warn">{'Still searching after ' + (sb.stuck || '') + '. Consider cancelling and asking the traveller to send a fresh request.'}</Callout>
          )}
          {closed && (
            <Callout tone="grey" icon="info">
              {sb.status === 'replaced' ? 'Replaced by a newer request for the same trip. Kept for the record.' : sb.status === 'cancelled' ? 'Cancelled from the dashboard. The agent won’t work on this request any more.' : statusMeta(sb.status).label + '. The agent isn’t working on this request any more.'}
            </Callout>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {groups.map((g) => <SchemaGroup key={g.title} {...g} />)}
          </div>
        </div>
        <div className="drawer-foot">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="soft" onClick={onAsk} disabled={!isCancellable(sb.status)}><Icon name="close" size={16} aria-hidden="true" />Cancel booking</Button>
        </div>
      </aside>
    </>
  );
}
