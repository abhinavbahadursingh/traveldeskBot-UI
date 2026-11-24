// Display helpers shared by the GST page's components.

const INR2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Paise → "₹1,23,456.78". */
export const inr = (paise: number) => (paise < 0 ? '-₹' : '₹') + INR2.format(Math.abs(paise) / 100);

/** Table amount: zero or missing shows a muted dash. */
export function Amount({ paise, strong }: { paise: number | null; strong?: boolean }) {
  if (!paise) return <span className="gst-nil" aria-label="none">—</span>;
  return strong ? <b>{inr(paise)}</b> : <>{inr(paise)}</>;
}

export const CATEGORIES = [
  { key: 'flight', label: 'Flights', one: 'Flight' },
  { key: 'hotel', label: 'Hotels', one: 'Hotel' },
  { key: 'service_fee', label: 'Service fees', one: 'Service fee' },
] as const;

export const categoryOne = (k: string | null) => CATEGORIES.find((c) => c.key === k)?.one ?? (k || '—');

/** GST state codes (first two digits of a GSTIN). */
const STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat', '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh', '97': 'Other territory',
};
export const stateName = (code: string | null) => (code ? STATES[code.padStart(2, '0')] ?? 'State ' + code : '');

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** YYYY-MM-DD → "20 Nov 2026". */
export const prettyDay = (d: string | null) =>
  d && /^\d{4}-\d\d-\d\d/.test(d) ? Number(d.slice(8, 10)) + ' ' + MON[Number(d.slice(5, 7)) - 1] + ' ' + d.slice(0, 4) : '';
