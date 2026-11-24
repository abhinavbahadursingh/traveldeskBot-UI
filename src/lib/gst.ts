// GST page helpers: periods (IST month / Indian FY Apr–Mar), filters, totals and the CSV export.
// Amounts stay in integer paise until display, so totals are exact.

export interface GstRow {
  id: number;
  created_at: string; // UTC, as SQLAlchemy writes it ("2026-11-20 06:00:00.000000")
  route: string;
  pnr: string | null;
  status: string;
  fare_paise: number;
  category: string | null;
  taxable_value_paise: number | null;
  gst_rate: string | number | null;
  cgst_paise: number | null;
  sgst_paise: number | null;
  igst_paise: number | null;
  total_gst_paise: number | null;
  computed_gst_paise: number | null;
  gst_mismatch: number | boolean | null;
  supplier_gstin: string | null;
  supplier_state: string | null;
  invoice_no: string | null;
  invoice_date: string | null; // YYYY-MM-DD
  invoice_url: string | null;
  itc_eligible: number | boolean | null;
  itc_status: 'na' | 'pending' | 'claimed' | null;
  legacy_booking_id: number | null;
  employee: string | null;
}

export type Period = { kind: 'all' } | { kind: 'month'; ym: string } | { kind: 'fy'; year: number };

export interface Filters {
  period: Period;
  employee: string; // '' = everyone
  category: string; // '' = all
}

const IST_MS = 5.5 * 3600 * 1000;

/** The booking's IST calendar day, YYYY-MM-DD (months and FYs are IST, like the bot's summary). */
export function istDay(createdUtc: string): string {
  const s = createdUtc.trim().replace(' ', 'T');
  const ms = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');
  return Number.isNaN(ms) ? '' : new Date(ms + IST_MS).toISOString().slice(0, 10);
}

/** FY start year for a YYYY-MM-DD day: 2026-03-31 → 2025, 2026-04-01 → 2026. */
export function fyOf(day: string): number {
  const y = Number(day.slice(0, 4));
  return Number(day.slice(5, 7)) >= 4 ? y : y - 1;
}

export const fyLabel = (y: number) => 'FY ' + y + '-' + String(y + 1).slice(2);

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (ym: string) => MON[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4);

export function inPeriod(r: GstRow, p: Period): boolean {
  if (p.kind === 'all') return true;
  const day = istDay(r.created_at);
  return p.kind === 'month' ? day.slice(0, 7) === p.ym : !!day && fyOf(day) === p.year;
}

export const applyFilters = (rows: GstRow[], f: Filters) =>
  rows.filter((r) => inPeriod(r, f.period) && (!f.employee || r.employee === f.employee) && (!f.category || r.category === f.category));

/** ?month=2026-11 / ?fy=2026 (the Slack link) → period; else the given fallback. */
export function periodFromSearch(search: string, fallback: Period): Period {
  const q = new URLSearchParams(search);
  const m = q.get('month');
  if (m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m)) return { kind: 'month', ym: m };
  const fy = Number(q.get('fy'));
  if (Number.isInteger(fy) && fy > 2000) return { kind: 'fy', year: fy };
  return fallback;
}

export function periodToSearch(p: Period): string {
  return p.kind === 'month' ? '?month=' + p.ym : p.kind === 'fy' ? '?fy=' + p.year : '';
}

export const isMismatch = (r: GstRow) => !!r.gst_mismatch;
const n = (v: number | null) => v || 0;

export interface GstTotals {
  count: number;
  spend: number; // paise: fares paid
  taxable: number;
  gst: number;
  cgst: number;
  sgst: number;
  igst: number;
  itcEligible: number;
  itcClaimed: number;
  mismatches: number;
  noInvoice: number;
}

export function totals(rows: GstRow[]): GstTotals {
  const t: GstTotals = { count: 0, spend: 0, taxable: 0, gst: 0, cgst: 0, sgst: 0, igst: 0, itcEligible: 0, itcClaimed: 0, mismatches: 0, noInvoice: 0 };
  for (const r of rows) {
    const g = n(r.total_gst_paise);
    t.count += 1;
    t.spend += n(r.fare_paise);
    t.taxable += n(r.taxable_value_paise);
    t.gst += g;
    t.cgst += n(r.cgst_paise);
    t.sgst += n(r.sgst_paise);
    t.igst += n(r.igst_paise);
    if (r.itc_status === 'pending' || r.itc_status === 'claimed') t.itcEligible += g;
    if (r.itc_status === 'claimed') t.itcClaimed += g;
    if (isMismatch(r)) t.mismatches += 1;
    if (!r.invoice_no) t.noInvoice += 1;
  }
  return t;
}

/** Exact paise → "1234.50" (no float rounding). */
export function rupees(paise: number | null): string {
  if (paise == null) return '';
  const sign = paise < 0 ? '-' : '';
  const a = Math.abs(Math.round(paise));
  return sign + Math.floor(a / 100) + '.' + String(a % 100).padStart(2, '0');
}

/** "5" / "5.0" / 18 → "5" / "18" (percent). */
export const ratePct = (v: string | number | null) => (v == null || v === '' ? '' : String(Number(v)));

/** YYYY-MM-DD → DD-MM-YYYY (the GST portal's date format). */
const portalDate = (d: string | null) => (d && /^\d{4}-\d\d-\d\d/.test(d) ? d.slice(8, 10) + '-' + d.slice(5, 7) + '-' + d.slice(0, 4) : '');

function cell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// GSTR-2B order first (supplier GSTIN, invoice no/date/value, place of supply, rate, taxable, tax heads),
// then what reconciliation needs to trace a line back to the booking.
const CSV_HEAD = [
  'GSTIN of supplier', 'Invoice number', 'Invoice date', 'Invoice value', 'Place of supply', 'Rate (%)',
  'Taxable value', 'Integrated tax', 'Central tax', 'State/UT tax', 'Total tax',
  'Computed tax', 'Mismatch', 'ITC eligible', 'ITC status', 'Category', 'Booking', 'PNR', 'Route', 'Employee', 'Booked on (IST)', 'Invoice URL',
];

export function toCsv(rows: GstRow[]): string {
  const lines = rows.map((r) => [
    r.supplier_gstin, r.invoice_no, portalDate(r.invoice_date),
    rupees(n(r.taxable_value_paise) + n(r.total_gst_paise)), r.supplier_state, ratePct(r.gst_rate),
    rupees(r.taxable_value_paise), rupees(r.igst_paise), rupees(r.cgst_paise), rupees(r.sgst_paise), rupees(r.total_gst_paise),
    rupees(r.computed_gst_paise), isMismatch(r) ? 'Y' : 'N', r.itc_eligible ? 'Y' : 'N', r.itc_status, r.category,
    r.id, r.pnr, r.route, r.employee, istDay(r.created_at), r.invoice_url,
  ].map(cell).join(','));
  return [CSV_HEAD.map(cell).join(','), ...lines].join('\r\n') + '\r\n';
}
