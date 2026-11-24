import { Link } from 'react-router-dom';
import { isMismatch, istDay, ratePct, totals, type GstRow } from '../../lib/gst';
import { Amount, CATEGORIES, categoryOne, inr, prettyDay, stateName } from './money';

interface Props {
  rows: GstRow[]; // already filtered
  employees: string[];
  employee: string;
  onEmployee: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
  empty: string | null; // message when there are no rows
}

const ITC_PILL: Record<string, { cls: string; label: string }> = {
  claimed: { cls: 'gst-pill-claimed', label: 'Claimed' },
  pending: { cls: 'gst-pill-pending', label: 'Pending' },
};

export function GstTable({ rows, employees, employee, onEmployee, category, onCategory, empty }: Props) {
  const t = totals(rows);
  const chips = [{ key: '', label: 'All' }, ...CATEGORIES];

  return (
    <section className="bk-panel gst-table-card" aria-labelledby="gst-h">
      <div className="gst-table-h">
        <div>
          <h2 id="gst-h">Bookings</h2>
          <p>{rows.length} shown</p>
        </div>
        <div className="gst-tools">
          <div className="gst-chips" role="group" aria-label="Category">
            {chips.map((c) => (
              <button key={c.key} type="button" className="gst-chip" aria-pressed={category === c.key} onClick={() => onCategory(c.key)}>
                {c.label}
              </button>
            ))}
          </div>
          <label className="gst-field">
            <span>Employee</span>
            <select value={employee} onChange={(e) => onEmployee(e.target.value)}>
              <option value="">Everyone</option>
              {employees.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="gst-scroll">
        <table className="gst-table">
          <thead>
            <tr>
              <th scope="col">Booking</th>
              <th scope="col">Employee</th>
              <th scope="col">Category</th>
              <th scope="col" className="num">Taxable</th>
              <th scope="col" className="num">Rate</th>
              <th scope="col" className="num">CGST</th>
              <th scope="col" className="num">SGST</th>
              <th scope="col" className="num">IGST</th>
              <th scope="col" className="num">Total GST</th>
              <th scope="col">Supplier &amp; invoice</th>
              <th scope="col">ITC</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const bad = isMismatch(r);
              const pill = ITC_PILL[r.itc_status || ''];
              const state = stateName(r.supplier_state);
              return (
                <tr key={r.id} style={{ ['--i' as string]: Math.min(i, 14) }}>
                  <td>
                    <div className="gst-id">
                      {bad && <span className="gst-flag" role="img" aria-label="GST mismatch" />}
                      {r.legacy_booking_id
                        ? <Link to={'/?booking=' + r.legacy_booking_id}>#{r.id}</Link>
                        : <span>#{r.id}</span>}
                    </div>
                    <div className="gst-sub">{r.route}{r.pnr && <> · <span className="mono">{r.pnr}</span></>}</div>
                  </td>
                  <td>
                    {r.employee || <span className="gst-nil">—</span>}
                    <div className="gst-sub">{prettyDay(istDay(r.created_at))}</div>
                  </td>
                  <td>
                    <span className="gst-cat"><span className={'gst-dot gst-c-' + (r.category || 'none')} aria-hidden="true" />{categoryOne(r.category)}</span>
                  </td>
                  <td className="num"><Amount paise={r.taxable_value_paise} /></td>
                  <td className="num">{ratePct(r.gst_rate) ? ratePct(r.gst_rate) + '%' : <span className="gst-nil">—</span>}</td>
                  <td className="num"><Amount paise={r.cgst_paise} /></td>
                  <td className="num"><Amount paise={r.sgst_paise} /></td>
                  <td className="num"><Amount paise={r.igst_paise} /></td>
                  <td className="num">
                    <Amount paise={r.total_gst_paise} strong />
                    {bad && <div><span className="gst-tag gst-tag-amber">Computed {inr(r.computed_gst_paise || 0)}</span></div>}
                  </td>
                  <td>
                    {r.supplier_gstin && (
                      <div><span className="mono">{r.supplier_gstin}</span>{state && <span className="gst-muted"> · {state}</span>}</div>
                    )}
                    {r.invoice_no ? (
                      <div className="gst-sub">
                        {r.invoice_url
                          ? <a className="bk-link" href={r.invoice_url} target="_blank" rel="noreferrer">{r.invoice_no}</a>
                          : r.invoice_no}
                        {r.invoice_date && ' · ' + prettyDay(r.invoice_date)}
                      </div>
                    ) : (
                      <div><span className="gst-tag">Estimate · no invoice yet</span></div>
                    )}
                  </td>
                  <td>{pill ? <span className={'gst-pill ' + pill.cls}>{pill.label}</span> : <span className="gst-nil">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>Total · {rows.length} {rows.length === 1 ? 'booking' : 'bookings'}</th>
                <td className="num"><Amount paise={t.taxable} /></td>
                <td></td>
                <td className="num"><Amount paise={t.cgst} /></td>
                <td className="num"><Amount paise={t.sgst} /></td>
                <td className="num"><Amount paise={t.igst} /></td>
                <td className="num"><Amount paise={t.gst} strong /></td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
        {empty && <p className="gst-empty">{empty}</p>}
      </div>
    </section>
  );
}
