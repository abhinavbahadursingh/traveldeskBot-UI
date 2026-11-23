import { useRef } from 'react';
import type { Booking } from '../../services/bookings';
import { fmt } from '../../lib/format';
import { useDialogFocus } from '../../lib/useDialogFocus';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';

export function CancelModal({ cb, onKeep, onConfirm }: { cb: Booking; onKeep: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref);
  return (
    <>
      <div className="scrim2 fade" aria-hidden="true"></div>
      <div className="modalwrap">
        <div ref={ref} className="modal glass-strong pop" role="alertdialog" aria-modal="true" aria-labelledby="td-cx-t" aria-describedby="td-cx-d">
          <span className="warn" aria-hidden="true"><Icon name="warn" size={22} /></span>
          <h3 id="td-cx-t" className="h2" style={{ fontSize: '24px' }}>{'Cancel booking #' + cb.id + '?'}</h3>
          <p id="td-cx-d" style={{ margin: 0, fontSize: '15px', lineHeight: 1.55, color: '#3A4860' }}>Its status changes to cancelled and it moves to Closed. You can undo for a few seconds after.</p>
          <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
            <span style={{ fontWeight: 600 }}>{cb.request}</span>
            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(cb.price)}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '4px' }}>
            <Button variant="ghost" onClick={onKeep}>Keep booking</Button>
            <Button variant="danger" onClick={onConfirm}>Cancel booking</Button>
          </div>
        </div>
      </div>
    </>
  );
}
