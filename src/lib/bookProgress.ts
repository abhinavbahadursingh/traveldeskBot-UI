import { statusMeta } from './status';

export const PROGRESS_STEPS = ['Flight chosen', 'Confirmed in Slack', 'Payment', 'Ticketed'];

export interface Progress {
  current: number; // index into PROGRESS_STEPS; PROGRESS_STEPS.length = all done
  title: string;
  text: string;
  ok: boolean; // false = the request stopped without a ticket
}

/** What the traveller sees on /book for a request sent to Slack, by bot status. */
export function progressFor(status: string, pnr?: string | null): Progress {
  switch (status) {
    case 'awaiting_confirm':
      return { current: 1, ok: true, title: 'Sent to Slack', text: 'Open the card in your Slack DMs and press Confirm to book it. Nothing is booked or charged until you do.' };
    case 'web_confirmed':
      return { current: 2, ok: true, title: 'Confirmed', text: 'Handing it to the agent to book. This takes a few seconds.' };
    case 'confirmed':
    case 'booking_started':
      return { current: 2, ok: true, title: 'Booking started', text: 'Confirmed. The agent is booking it with LetsFG; updates arrive here and in Slack.' };
    case 'picked':
      return { current: 2, ok: true, title: 'Dry run', text: 'Confirmed, but the bot is in DRY_RUN mode, so nothing was booked.' };
    case 'need_documents':
    case 'no_passport':
      return { current: 2, ok: true, title: 'Details needed', text: 'LetsFG needs more passenger details. Use the button in your Slack DMs to add them.' };
    case 'awaiting_payment':
      return { current: 2, ok: true, title: 'Waiting for payment', text: 'Pay on the secure LetsFG page; the booking starts by itself once it’s paid. Your PNR appears here and in Slack.' };
    case 'awaiting_approval':
      return { current: 2, ok: true, title: 'Payment approval needed', text: 'Approve and pay on LetsFG (check the LetsFG account or email). Your PNR appears here once it’s paid.' };
    case 'booking_in_progress':
      return { current: 3, ok: true, title: 'Paid, ticketing', text: 'Payment received. LetsFG is issuing the ticket, usually in 4–11 minutes.' };
    case 'completed':
    case 'booked':
      return { current: PROGRESS_STEPS.length, ok: true, title: 'Ticket issued', text: (pnr ? 'PNR ' + pnr + '. ' : '') + 'Your e-ticket is in your Slack DMs.' };
    case 'needs_attention':
      return { current: 2, ok: false, title: 'Needs attention', text: 'LetsFG couldn’t finish this booking, so the travel admin has been told. Details are in Slack.' };
    case 'cancelled':
      return { current: 1, ok: false, title: 'Cancelled', text: 'This request was cancelled. Nothing more will happen to it. Pick a flight to start again.' };
    default:
      return { current: 1, ok: false, title: statusMeta(status).label, text: 'This request stopped before a ticket was issued. Details are in Slack. Pick a flight to try again.' };
  }
}
