// Where each step of a booking happened: in Slack or on the website.
import type { Booking } from '../services/bookings';

export type Channel = 'slack' | 'web';

export const CHANNEL_NAME: Record<Channel, string> = { slack: 'Slack', web: 'website' };

// `approver` values the website writes when it cancels (traveldesk-bot storage/db.py).
const WEB_CANCELLERS = ['dashboard', 'web_change'];

/** Requested in Slack, or chosen on the /book page (its pick record says model "web"). */
export function requestedVia(b: Booking): Channel {
  try {
    return JSON.parse(b.raw.details || '{}').model === 'web' ? 'web' : 'slack';
  } catch {
    return 'slack';
  }
}

/** Where it was confirmed, once it has been; null if not confirmed (yet).
 *  A Slack Confirm click records the traveller as `approver` (so does a Slack Cancel,
 *  hence cancelled rows are left out); the website also sets confirmed_via='web'. */
export function confirmedVia(b: Booking): Channel | null {
  if (b.raw.confirmed_via === 'web') return 'web';
  if (b.status === 'cancelled' || b.status === 'awaiting_confirm') return null;
  return b.raw.approver && b.raw.approver === b.raw.slack_user ? 'slack' : null;
}

/** Who cancelled it: the website (dashboard / Change flight) or the Slack Cancel button. */
export function cancelledVia(b: Booking): Channel | null {
  if (b.status !== 'cancelled') return null;
  if (b.raw.approver && WEB_CANCELLERS.includes(b.raw.approver)) return 'web';
  return b.raw.approver && b.raw.approver === b.raw.slack_user ? 'slack' : null;
}
