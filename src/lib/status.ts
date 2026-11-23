// Status vocabulary of the traveldesk-bot `bookings` table.
export type StatusGroup = 'active' | 'done' | 'closed';

export interface StatusMeta {
  label: string;
  fg: string;
  bg: string;
  dot: string;
  group: StatusGroup;
  step: number | null;
}

const C = {
  sky:    { fg: '#0B5C73', bg: 'rgba(56,189,248,.18)',  dot: '#0EA5E9' },
  blue:   { fg: '#1E40AF', bg: 'rgba(59,130,246,.15)',  dot: '#3B82F6' },
  violet: { fg: '#5B21B6', bg: 'rgba(139,92,246,.15)',  dot: '#8B5CF6' },
  amber:  { fg: '#854D0E', bg: 'rgba(245,158,11,.2)',   dot: '#F59E0B' },
  orange: { fg: '#9A3412', bg: 'rgba(251,146,60,.18)',  dot: '#C2410C' },
  green:  { fg: '#166534', bg: 'rgba(34,197,94,.16)',   dot: '#22C55E' },
  grey:   { fg: '#475569', bg: 'rgba(100,116,139,.14)', dot: '#94A3B8' },
  rose:   { fg: '#9F1239', bg: 'rgba(244,63,94,.13)',   dot: '#F43F5E' },
};

export const S: Record<string, StatusMeta> = {
  searching:           { label: 'Searching',         ...C.sky,    group: 'active', step: 0 },
  need_info:           { label: 'Needs info',        ...C.blue,   group: 'active', step: 1 },
  need_documents:      { label: 'Needs documents',   ...C.violet, group: 'active', step: 1 },
  no_passport:         { label: 'Needs passport',    ...C.violet, group: 'active', step: 1 },
  picked:              { label: 'Flight picked',     ...C.blue,   group: 'active', step: 1 },
  needs_attention:     { label: 'Needs attention',   ...C.orange, group: 'active', step: null },
  awaiting_confirm:    { label: 'Awaiting approval', ...C.amber,  group: 'active', step: 2 },
  awaiting_approval:   { label: 'Awaiting approval', ...C.amber,  group: 'active', step: 2 },
  web_confirmed:       { label: 'Confirmed on web',  ...C.blue,   group: 'active', step: 2 },
  confirmed:           { label: 'Approved',          ...C.blue,   group: 'active', step: 2 },
  booking_started:     { label: 'Booking',           ...C.sky,    group: 'active', step: 2 },
  booking_in_progress: { label: 'Booking',           ...C.sky,    group: 'active', step: 2 },
  awaiting_payment:    { label: 'Awaiting payment',  ...C.amber,  group: 'active', step: 2 },
  completed:           { label: 'Booked',            ...C.green,  group: 'done',   step: 3 },
  booked:              { label: 'Booked',            ...C.green,  group: 'done',   step: 3 },
  replaced:            { label: 'Replaced',          ...C.grey,   group: 'closed', step: null },
  cancelled:           { label: 'Cancelled',         ...C.rose,   group: 'closed', step: null },
  failed:              { label: 'Failed',            ...C.rose,   group: 'closed', step: null },
  payment_blocked:     { label: 'Payment blocked',   ...C.rose,   group: 'closed', step: null },
  no_match:            { label: 'No match',          ...C.grey,   group: 'closed', step: null },
  expired:             { label: 'Expired',           ...C.grey,   group: 'closed', step: null },
  approval_expired:    { label: 'Approval expired',  ...C.grey,   group: 'closed', step: null },
  timeout:             { label: 'Timed out',         ...C.grey,   group: 'closed', step: null },
  not_started:         { label: 'Not started',       ...C.grey,   group: 'closed', step: null },
};

export const statusMeta = (s: string): StatusMeta =>
  S[s] || { label: s ? s.replace(/_/g, ' ') : 'Unknown', ...C.grey, group: 'closed', step: null };

export const PAY: Record<string, { label: string; dot: string }> = {
  unpaid:           { label: 'Unpaid',           dot: '#94A3B8' },
  awaiting_payment: { label: 'Awaiting payment', dot: '#F59E0B' },
  held:             { label: 'Held',             dot: '#F59E0B' },
  paid:             { label: 'Paid',             dot: '#22C55E' },
  failed:           { label: 'Failed',           dot: '#F43F5E' },
};

export const payMeta = (p: string | null) => (p && PAY[p]) || PAY.unpaid;

export const isActive = (s: string) => statusMeta(s).group === 'active';
export const isClosed = (s: string) => statusMeta(s).group === 'closed';
export const isDone = (s: string) => statusMeta(s).group === 'done';
export const stageIndex = (s: string) => statusMeta(s).step;

/**
 * Statuses the dashboard may cancel (shared with the API): the bot can still stop these.
 * Once LetsFG is booking (booking_started / booking_in_progress / awaiting_approval) or the
 * ticket is issued, a cancel has to happen at LetsFG, so the dashboard doesn't offer it.
 */
export const CANCELLABLE = [
  'searching', 'picked', 'need_info', 'need_documents', 'no_passport', 'needs_attention',
  'awaiting_confirm', 'web_confirmed', 'confirmed', 'awaiting_payment',
];
export const isCancellable = (s: string) => CANCELLABLE.includes(s);

export const BOOKING_STEPS = ['Searching', 'Info & documents', 'Payment', 'Booked'];

export type TabKey = 'all' | 'active' | 'payment' | 'done' | 'closed';

export const TABS: [TabKey, string][] = [
  ['all', 'All'],
  ['active', 'In progress'],
  ['payment', 'Awaiting payment'],
  ['done', 'Booked'],
  ['closed', 'Closed'],
];

export function inTab(tab: TabKey, s: string): boolean {
  if (tab === 'active') return isActive(s);
  if (tab === 'payment') return s === 'awaiting_payment';
  if (tab === 'done') return isDone(s);
  if (tab === 'closed') return isClosed(s);
  return true;
}
