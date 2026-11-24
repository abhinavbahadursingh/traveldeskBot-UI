import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import {
  applyFilters, fyLabel, fyOf, istDay, monthLabel, periodFromSearch, periodToSearch, toCsv, totals,
  type GstRow, type Period,
} from '../lib/gst';
import { getGst } from '../services/gst';
import { BookNav } from './book/BookNav';
import { MOCK_GST } from './gst/mockGst';
import { GstKpis } from './gst/GstKpis';
import { CategoryCard, TaxHeadCard } from './gst/GstBreakdown';
import { GstTable } from './gst/GstTable';
import { categoryOne } from './gst/money';
import '../styles/book.css';
import '../styles/gst.css';

const DOWNLOAD = 'M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14';

const encode = (p: Period) => (p.kind === 'month' ? 'm:' + p.ym : p.kind === 'fy' ? 'fy:' + p.year : 'all');
function decode(v: string): Period {
  if (v.startsWith('m:')) return { kind: 'month', ym: v.slice(2) };
  if (v.startsWith('fy:')) return { kind: 'fy', year: Number(v.slice(3)) };
  return { kind: 'all' };
}
const periodLabel = (p: Period) => (p.kind === 'month' ? monthLabel(p.ym) : p.kind === 'fy' ? fyLabel(p.year) : 'All time');
const eyebrow = (p: Period) =>
  p.kind === 'fy' ? fyLabel(p.year) + ' · Apr–Mar' : p.kind === 'month' ? monthLabel(p.ym) + ' · ' + fyLabel(fyOf(p.ym + '-01')) : 'All time';

export default function Gst() {
  const today = istDay(new Date().toISOString());
  const [rows, setRows] = useState<GstRow[]>([]);
  const [setup, setSetup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [period, setPeriod] = useState<Period>(() => periodFromSearch(window.location.search, { kind: 'fy', year: fyOf(today) }));
  const [employee, setEmployee] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await getGst();
      setRows(r.rows);
      setSetup(r.setup || null);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    document.title = 'Travel Desk — GST';
    load();
  }, [load]);

  // Hide the window's scrollbar while on this page (scrolling still works); restored on leave.
  useEffect(() => {
    document.documentElement.classList.add('gst-no-scrollbar');
    return () => document.documentElement.classList.remove('gst-no-scrollbar');
  }, []);

  // Keep the period in the URL (the Slack summary links to /gst?month=… or ?fy=…).
  useEffect(() => {
    window.history.replaceState(null, '', window.location.pathname + periodToSearch(period));
  }, [period]);

  // No real GST bookings yet → sample rows so the page can be tried out (never saved anywhere).
  const sample = loaded && !error && rows.length === 0;
  const data = sample ? MOCK_GST : rows;

  const months = useMemo(() => {
    const s = new Set(data.map((r) => istDay(r.created_at).slice(0, 7)).filter(Boolean));
    s.add(today.slice(0, 7));
    if (period.kind === 'month') s.add(period.ym);
    return [...s].sort().reverse();
  }, [data, today, period]);
  const fys = useMemo(() => {
    const s = new Set(months.map((m) => fyOf(m + '-01')));
    if (period.kind === 'fy') s.add(period.year);
    return [...s].sort((a, b) => b - a);
  }, [months, period]);
  const employees = useMemo(() => [...new Set(data.map((r) => r.employee || '').filter(Boolean))].sort(), [data]);

  // KPI + breakdown cards: the whole period. Table + its totals: period + category + employee.
  const inPeriod = useMemo(() => applyFilters(data, { period, employee: '', category: '' }), [data, period]);
  const periodTotals = useMemo(() => totals(inPeriod), [inPeriod]);
  const shown = useMemo(() => applyFilters(inPeriod, { period, employee, category }), [inPeriod, period, employee, category]);

  const download = () => {
    const blob = new Blob(['\ufeff' + toCsv(shown)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (sample ? 'sample-' : '') + 'gst-' + encode(period).replace(':', '-') + (employee ? '-' + employee.replace(/\W+/g, '_') : '') + (category ? '-' + category : '') + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const empty = loaded && !error && !shown.length
    ? 'No bookings with GST for ' + periodLabel(period) + (employee ? ' · ' + employee : '') + (category ? ' · ' + categoryOne(category) : '') + '.'
    : null;

  return (
    <div className="page-dash">
      <div className="bk-page" id="top">
        <div className="bk-wrap">
          <BookNav
            active="gst"
            right={<button className="bk-iconbtn" aria-label="Refresh GST" onClick={load}><Icon name="refresh" size={17} /></button>}
          />

          <div className="gst-page">
            <header className="gst-head">
              <div>
                <div className="bk-eyebrow">{eyebrow(period)}</div>
                <h1>GST overview</h1>
                <p>Tax on every ticketed booking — computed from the rate table, replaced by the supplier invoice once attached.</p>
              </div>
              <div className="gst-head-r">
                <label className="gst-field">
                  <span>Period</span>
                  <select value={encode(period)} onChange={(e) => setPeriod(decode(e.target.value))}>
                    <option value="all">All time</option>
                    <optgroup label="Financial year (Apr–Mar)">
                      {fys.map((y) => <option key={y} value={'fy:' + y}>{fyLabel(y)}</option>)}
                    </optgroup>
                    <optgroup label="Month">
                      {months.map((m) => <option key={m} value={'m:' + m}>{monthLabel(m)}</option>)}
                    </optgroup>
                  </select>
                </label>
                <button type="button" className="bk-primary gst-export" onClick={download} disabled={!shown.length}>
                  <Icon d={DOWNLOAD} size={17} /> Export CSV
                </button>
              </div>
            </header>

            {error && <p className="bk-err" role="alert">Couldn’t load GST: {error}</p>}
            {setup && <p className="bk-err" role="status">GST columns aren’t in the database yet — run <code>alembic upgrade head</code> in traveldesk-bot. ({setup})</p>}
            {sample && (
              <p className="gst-sample" role="status">
                <span className="gst-sample-tag">Sample data</span>
                No GST bookings in the database yet, so made-up rows are shown. They disappear once real bookings have GST.
              </p>
            )}

            <GstKpis t={periodTotals} />

            <div className="gst-split">
              <TaxHeadCard t={periodTotals} />
              <CategoryCard rows={inPeriod} />
            </div>

            <GstTable
              rows={shown}
              employees={employees}
              employee={employee}
              onEmployee={setEmployee}
              category={category}
              onCategory={setCategory}
              empty={empty}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
