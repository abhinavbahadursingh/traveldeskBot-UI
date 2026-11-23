import type { Booking } from '../../services/bookings';
import { fmt } from '../../lib/format';
import { payMeta, isCancellable } from '../../lib/status';
import { StatusChip } from '../../components/ui/StatusChip';
import { IconButton } from '../../components/ui/IconButton';
import { SourceBadge } from '../../components/ui/SourceBadge';
import { requestedVia } from '../../lib/channel';

export function BookingRow({ b, index, onOpen, onAsk }: { b: Booking; index: number; onOpen: () => void; onAsk: () => void }) {
  const pm = payMeta(b.payment);
  const isStuck = !!b.stuck && b.status === 'searching';
  return (
    <div className="row grid lift rise" style={{ animationDelay: 460 + index * 60 + 'ms' }}>
      <span className="mono id" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{'#' + b.id}<SourceBadge via={requestedVia(b)} compact /></span>
      <button className="reqbtn" onClick={onOpen}>{b.request}</button>
      <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        <StatusChip status={b.status} />
        {isStuck && <span className="stuck">{'Stuck ' + (b.stuck || '')}</span>}
      </span>
      <span className="pay"><span className="dot" style={{ background: pm.dot }}></span>{pm.label}</span>
      <span className="price">{fmt(b.price)}</span>
      <span className="muted-t">{b.created}</span>
      <span className="acts">
        {isCancellable(b.status) && (
          <IconButton className="danger" icon="close" iconSize={16} aria-label={'Cancel booking ' + b.id} onClick={onAsk} />
        )}
        <IconButton icon="chevron" iconSize={16} aria-label={'Open booking ' + b.id} onClick={onOpen} />
      </span>
    </div>
  );
}
