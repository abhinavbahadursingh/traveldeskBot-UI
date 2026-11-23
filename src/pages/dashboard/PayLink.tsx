import type { Booking } from '../../services/bookings';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The LetsFG secure payment link for a booking waiting on payment, if it has a live one. */
export function payLinkFor(b: Booking): { url: string; label: string; expires: Date | null } | null {
  const r = b.raw;
  let url: string | null = null;
  let label = 'Pay now';
  if (b.status === 'awaiting_payment' && r.pay_url) url = r.pay_url;
  if (b.status === 'awaiting_approval') {
    try {
      url = JSON.parse(r.details || '{}').approve_url || null;
      label = 'Approve & pay on LetsFG';
    } catch { /* not JSON */ }
  }
  if (!url || !url.startsWith('https://')) return null;
  // The bot stores pay_expires_at in UTC; a value without a zone is UTC too.
  const raw = r.pay_expires_at;
  const expires = raw ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(raw) ? raw : raw + 'Z') : null;
  return { url, label, expires: expires && !isNaN(expires.getTime()) ? expires : null };
}

const pad = (n: number) => (n < 10 ? '0' : '') + n;

export function PayLink({ booking }: { booking: Booking }) {
  const link = payLinkFor(booking);
  if (!link) return null;
  const expired = link.expires != null && link.expires.getTime() <= Date.now();
  const until = link.expires && MON[link.expires.getMonth()] + ' ' + link.expires.getDate() + ', ' + pad(link.expires.getHours()) + ':' + pad(link.expires.getMinutes());
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      {expired ? (
        <span className="muted-t">The payment link expired{until ? ' on ' + until : ''}. The agent will close this booking.</span>
      ) : (
        <>
          <a className="btn btn-dark" href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{link.label}</a>
          <span className="muted-t" style={{ fontSize: '13px' }}>
            Secure LetsFG page{until ? ' · valid until ' + until : ''}. The booking starts by itself once it’s paid.
          </span>
        </>
      )}
    </div>
  );
}
