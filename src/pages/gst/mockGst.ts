// Sample GST rows for the /gst page only, shown while the DB has no real GST bookings.
// Never written to the database; GSTINs are made up (valid format + check digit, PAN "AAACX000…").
// Company is taken to be in Maharashtra (27): same state → CGST + SGST, else IGST. Amounts in paise.
import type { GstRow } from '../../lib/gst';

type Mock = Pick<GstRow, 'id' | 'created_at' | 'route' | 'category' | 'fare_paise' | 'taxable_value_paise' | 'gst_rate' | 'cgst_paise' | 'sgst_paise' | 'igst_paise' | 'total_gst_paise' | 'computed_gst_paise' | 'supplier_gstin' | 'supplier_state' | 'invoice_no' | 'invoice_date' | 'employee'> &
  Partial<GstRow>;

const row = (m: Mock): GstRow => ({
  pnr: null, status: 'ticketed', gst_mismatch: 0, invoice_url: null, itc_eligible: 0, itc_status: 'na', legacy_booking_id: null,
  ...m,
});

export const MOCK_GST: GstRow[] = [
  // Nov 2026
  row({ id: 9006, created_at: '2026-11-22 05:30:00.000000', route: 'BOM-BLR', pnr: 'K7Q2LM', category: 'flight', fare_paise: 735000, taxable_value_paise: 700000, gst_rate: '5', cgst_paise: 0, sgst_paise: 0, igst_paise: 35000, total_gst_paise: 35000, computed_gst_paise: 35000, supplier_gstin: null, supplier_state: null, invoice_no: null, invoice_date: null, employee: 'Karan Shah' }),
  row({ id: 9001, created_at: '2026-11-20 05:30:00.000000', route: 'BOM-DEL', pnr: 'X4TR9B', category: 'flight', fare_paise: 1050000, taxable_value_paise: 1000000, gst_rate: '5', cgst_paise: 25000, sgst_paise: 25000, igst_paise: 0, total_gst_paise: 50000, computed_gst_paise: 50000, supplier_gstin: '27AAACX0001A1ZA', supplier_state: '27', invoice_no: 'SAMPLE-FL-1101', invoice_date: '2026-11-20', invoice_url: 'https://example.com/sample-invoice.pdf', employee: 'Asha Rao' }),
  row({ id: 9005, created_at: '2026-11-20 05:35:00.000000', route: 'BOM-DEL', category: 'service_fee', fare_paise: 59000, taxable_value_paise: 50000, gst_rate: '18', cgst_paise: 4500, sgst_paise: 4500, igst_paise: 0, total_gst_paise: 9000, computed_gst_paise: 9000, supplier_gstin: '27AAACX0006F1ZV', supplier_state: '27', invoice_no: 'SAMPLE-SF-0412', invoice_date: '2026-11-20', itc_eligible: 1, itc_status: 'pending', employee: 'Asha Rao' }),
  row({ id: 9002, created_at: '2026-11-14 05:30:00.000000', route: 'BOM-DEL-BOM', pnr: 'B2C8NW', category: 'flight', fare_paise: 5310000, taxable_value_paise: 4500000, gst_rate: '18', cgst_paise: 0, sgst_paise: 0, igst_paise: 810000, total_gst_paise: 810000, computed_gst_paise: 810000, supplier_gstin: '07AAACX0002B1Z9', supplier_state: '07', invoice_no: 'SAMPLE-FL-1088', invoice_date: '2026-11-15', employee: 'Ravi Menon' }),
  row({ id: 9003, created_at: '2026-11-08 05:30:00.000000', route: 'Bengaluru · 3 nights', category: 'hotel', fare_paise: 2142000, taxable_value_paise: 2040000, gst_rate: '5', cgst_paise: 0, sgst_paise: 0, igst_paise: 102000, total_gst_paise: 102000, computed_gst_paise: 102000, supplier_gstin: '29AAACX0003C1Z0', supplier_state: '29', invoice_no: 'SAMPLE-HT-2231', invoice_date: '2026-11-11', employee: 'Priya Nair' }),
  // invoice shows ₹3,500 GST vs ₹3,420 computed → mismatch (highlighted)
  row({ id: 9004, created_at: '2026-11-03 05:30:00.000000', route: 'Mumbai · 2 nights', category: 'hotel', fare_paise: 2250000, taxable_value_paise: 1900000, gst_rate: '18', cgst_paise: 175000, sgst_paise: 175000, igst_paise: 0, total_gst_paise: 350000, computed_gst_paise: 342000, gst_mismatch: 1, supplier_gstin: '27AAACX0001A1ZA', supplier_state: '27', invoice_no: 'SAMPLE-HT-2207', invoice_date: '2026-11-05', employee: 'Asha Rao' }),
  // Oct 2026
  row({ id: 9007, created_at: '2026-10-17 05:30:00.000000', route: 'DEL-GGN', pnr: 'H9MD3P', category: 'flight', fare_paise: 861000, taxable_value_paise: 820000, gst_rate: '5', cgst_paise: 0, sgst_paise: 0, igst_paise: 41000, total_gst_paise: 41000, computed_gst_paise: 41000, supplier_gstin: '06AAACX0004D1Z5', supplier_state: '06', invoice_no: 'SAMPLE-FL-0977', invoice_date: '2026-10-17', employee: 'Ravi Menon' }),
  row({ id: 9008, created_at: '2026-10-17 05:35:00.000000', route: 'DEL-GGN', category: 'service_fee', fare_paise: 88500, taxable_value_paise: 75000, gst_rate: '18', cgst_paise: 6750, sgst_paise: 6750, igst_paise: 0, total_gst_paise: 13500, computed_gst_paise: 13500, supplier_gstin: '27AAACX0006F1ZV', supplier_state: '27', invoice_no: 'SAMPLE-SF-0388', invoice_date: '2026-10-17', itc_eligible: 1, itc_status: 'claimed', employee: 'Ravi Menon' }),
  // Sep 2026
  row({ id: 9009, created_at: '2026-09-25 05:30:00.000000', route: 'Pune · 4 nights', category: 'hotel', fare_paise: 2184000, taxable_value_paise: 2080000, gst_rate: '5', cgst_paise: 52000, sgst_paise: 52000, igst_paise: 0, total_gst_paise: 104000, computed_gst_paise: 104000, supplier_gstin: '27AAACX0001A1ZA', supplier_state: '27', invoice_no: 'SAMPLE-HT-1950', invoice_date: '2026-09-29', employee: 'Priya Nair' }),
  // Mar 2026 (FY 2025-26)
  row({ id: 9010, created_at: '2026-03-12 05:30:00.000000', route: 'BOM-MAA', pnr: 'R5VN8E', category: 'flight', fare_paise: 2596000, taxable_value_paise: 2200000, gst_rate: '18', cgst_paise: 0, sgst_paise: 0, igst_paise: 396000, total_gst_paise: 396000, computed_gst_paise: 396000, supplier_gstin: '33AAACX0005E1Z5', supplier_state: '33', invoice_no: 'SAMPLE-FL-0412', invoice_date: '2026-03-12', employee: 'Karan Shah' }),
];
