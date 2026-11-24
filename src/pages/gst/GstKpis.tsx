import type { GstTotals } from '../../lib/gst';
import { inr } from './money';

/** Four headline cards for the whole selected period (ignores the table's category/employee filters). */
export function GstKpis({ t }: { t: GstTotals }) {
  const rate = t.taxable ? (t.gst / t.taxable) * 100 : 0;
  const claimPct = t.itcEligible ? Math.min(100, (t.itcClaimed / t.itcEligible) * 100) : 0;
  const toClaim = t.itcEligible - t.itcClaimed;

  return (
    <section className="gst-kpis" aria-label="Summary">
      <div className="bk-panel gst-kpi">
        <h2>Total spend</h2>
        <b className="gst-kpi-v">{inr(t.taxable + t.gst)}</b>
        <p>{t.count} {t.count === 1 ? 'booking' : 'bookings'} incl. GST</p>
      </div>

      <div className="bk-panel gst-kpi">
        <h2>GST paid</h2>
        <b className="gst-kpi-v">{inr(t.gst)}</b>
        <p>{rate.toFixed(1)}% effective rate</p>
      </div>

      <div className="bk-panel gst-kpi">
        <h2>Input tax credit</h2>
        <b className="gst-kpi-v">
          {inr(t.itcClaimed)} <span className="gst-kpi-of">/ {inr(t.itcEligible)}</span>
        </b>
        <div
          className="gst-progress"
          role="progressbar"
          aria-label="ITC claimed of eligible"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(claimPct)}
        >
          <i style={{ width: claimPct + '%' }} />
        </div>
        <p>{t.itcEligible ? inr(toClaim) + ' still to claim' : 'Nothing marked eligible yet'}</p>
      </div>

      <div className="bk-panel gst-kpi">
        <h2>Needs review</h2>
        <b className={'gst-kpi-v' + (t.mismatches ? ' gst-amber-text' : '')}>{t.mismatches}</b>
        <p>Invoice GST differs from computed by more than ₹1</p>
      </div>
    </section>
  );
}
