import { describe, expect, it } from 'vitest';
import { applyFilters, fyOf, istDay, periodFromSearch, periodToSearch, rupees, toCsv, totals, type GstRow } from '../gst';

const row = (o: Partial<GstRow> = {}): GstRow => ({
  id: 1, created_at: '2026-11-20 06:00:00.000000', route: 'DEL-BOM', pnr: 'ABC123', status: 'ticketed',
  fare_paise: 1_050_000, category: 'flight', taxable_value_paise: 1_000_000, gst_rate: '5',
  cgst_paise: 0, sgst_paise: 0, igst_paise: 50_000, total_gst_paise: 50_000, computed_gst_paise: 50_000,
  gst_mismatch: 0, supplier_gstin: '29AAGCB7383J1Z4', supplier_state: '29', invoice_no: 'INV-1',
  invoice_date: '2026-11-21', invoice_url: null, itc_eligible: 0, itc_status: 'na', legacy_booking_id: null,
  employee: 'Asha Rao', ...o,
});

describe('periods', () => {
  it('uses the IST day', () => {
    expect(istDay('2026-10-31 18:29:59.000000')).toBe('2026-10-31');
    expect(istDay('2026-10-31 18:30:00')).toBe('2026-11-01');
    expect(istDay('2026-10-31T18:30:00+00:00')).toBe('2026-11-01');
    expect(istDay('junk')).toBe('');
  });
  it('FY runs April to March', () => {
    expect(fyOf('2026-03-31')).toBe(2025);
    expect(fyOf('2026-04-01')).toBe(2026);
  });
  it('reads and writes the Slack link params', () => {
    const all = { kind: 'all' } as const;
    expect(periodFromSearch('?month=2026-11', all)).toEqual({ kind: 'month', ym: '2026-11' });
    expect(periodFromSearch('?fy=2026', all)).toEqual({ kind: 'fy', year: 2026 });
    expect(periodFromSearch('?month=2026-13', all)).toEqual(all);
    expect(periodToSearch({ kind: 'fy', year: 2025 })).toBe('?fy=2025');
  });
});

describe('filters and totals', () => {
  const rows = [
    row(),
    row({ id: 2, created_at: '2026-04-01 00:00:00', employee: 'Ravi', category: 'hotel', cgst_paise: 300, sgst_paise: 300, igst_paise: 0, total_gst_paise: 600, itc_status: 'claimed', invoice_no: null }),
    row({ id: 3, created_at: '2026-03-30 00:00:00', gst_mismatch: 1, itc_status: 'pending' }),
  ];
  it('filters by month, FY, employee and category', () => {
    const f = { employee: '', category: '' };
    expect(applyFilters(rows, { ...f, period: { kind: 'month', ym: '2026-11' } }).map((r) => r.id)).toEqual([1]);
    expect(applyFilters(rows, { ...f, period: { kind: 'fy', year: 2026 } }).map((r) => r.id)).toEqual([1, 2]);
    expect(applyFilters(rows, { ...f, period: { kind: 'fy', year: 2025 } }).map((r) => r.id)).toEqual([3]);
    expect(applyFilters(rows, { period: { kind: 'all' }, employee: 'Ravi', category: '' }).map((r) => r.id)).toEqual([2]);
    expect(applyFilters(rows, { period: { kind: 'all' }, employee: '', category: 'flight' }).map((r) => r.id)).toEqual([1, 3]);
  });
  it('adds up heads, ITC and flags in paise', () => {
    const t = totals(rows);
    expect(t).toMatchObject({ count: 3, taxable: 3_000_000, gst: 100_600, cgst: 300, sgst: 300, igst: 100_000, itcEligible: 50_600, itcClaimed: 600, mismatches: 1, noInvoice: 1 });
  });
});

describe('csv', () => {
  it('formats exact rupees', () => {
    expect(rupees(1_000_005)).toBe('10000.05');
    expect(rupees(0)).toBe('0.00');
    expect(rupees(null)).toBe('');
  });
  it('is GSTR-2B ordered with portal dates and escaped cells', () => {
    const csv = toCsv([row({ employee: 'Rao, Asha "AR"' })]).split('\r\n');
    expect(csv[0].startsWith('GSTIN of supplier,Invoice number,Invoice date,Invoice value,Place of supply,Rate (%),Taxable value,Integrated tax,Central tax,State/UT tax')).toBe(true);
    expect(csv[1].startsWith('29AAGCB7383J1Z4,INV-1,21-11-2026,10500.00,29,5,10000.00,500.00,0.00,0.00,500.00,500.00,N,N,na,flight,1,ABC123,DEL-BOM,"Rao, Asha ""AR""",2026-11-20,')).toBe(true);
    expect(csv[2]).toBe('');
  });
});
