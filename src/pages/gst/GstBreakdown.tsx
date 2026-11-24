import type { GstRow, GstTotals } from '../../lib/gst';
import { CATEGORIES, inr } from './money';

const pct = (part: number, whole: number) => (whole ? (part / whole) * 100 : 0);

/** CGST / SGST / IGST as one stacked bar, plus a legend with amounts. */
export function TaxHeadCard({ t }: { t: GstTotals }) {
  const heads = [
    { key: 'cgst', label: 'CGST', value: t.cgst },
    { key: 'sgst', label: 'SGST', value: t.sgst },
    { key: 'igst', label: 'IGST', value: t.igst },
  ];
  return (
    <section className="bk-panel gst-card" aria-labelledby="gst-heads-h">
      <h2 id="gst-heads-h">By tax head</h2>
      <div className="gst-stack" aria-hidden="true">
        {heads.map((h) => h.value > 0 && <i key={h.key} className={'gst-h-' + h.key} style={{ width: pct(h.value, t.gst) + '%' }} />)}
      </div>
      <ul className="gst-legend">
        {heads.map((h) => (
          <li key={h.key}>
            <span className={'gst-sw gst-h-' + h.key} aria-hidden="true" />
            <span className="gst-legend-l">{h.label}</span>
            <span className="gst-legend-p">{t.gst ? Math.round(pct(h.value, t.gst)) + '%' : '—'}</span>
            <b>{inr(h.value)}</b>
          </li>
        ))}
      </ul>
      <p className="gst-note">Same state → CGST + SGST · otherwise IGST</p>
    </section>
  );
}

/** GST per category, bars scaled to the largest. */
export function CategoryCard({ rows }: { rows: GstRow[] }) {
  const sums = CATEGORIES.map((c) => ({
    ...c,
    value: rows.reduce((s, r) => s + (r.category === c.key ? r.total_gst_paise || 0 : 0), 0),
  }));
  const max = Math.max(0, ...sums.map((s) => s.value));
  return (
    <section className="bk-panel gst-card" aria-labelledby="gst-cat-h">
      <h2 id="gst-cat-h">GST by category</h2>
      <ul className="gst-cats">
        {sums.map((s) => (
          <li key={s.key}>
            <span className="gst-cat-l"><span className={'gst-dot gst-c-' + s.key} aria-hidden="true" />{s.label}</span>
            <span className="gst-cat-bar" aria-hidden="true"><i className={'gst-c-' + s.key} style={{ width: pct(s.value, max) + '%' }} /></span>
            <b>{inr(s.value)}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}
