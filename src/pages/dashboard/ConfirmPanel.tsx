import { useState } from 'react';
import { ApiError, confirmOnWeb, type Details, type PassengerFormSpec } from '../../services/book';
import type { Booking } from '../../services/bookings';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { PassengerForm } from '../book/PassengerForm';

/**
 * Confirm & book from the dashboard, for a booking waiting on the traveller's Slack card.
 * Same path as /book: the web service checks passenger details, marks it confirmed, and
 * the Slack bot books it within seconds and clears the card's buttons.
 */
export function ConfirmPanel({ booking, onChanged }: { booking: Booking; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needs, setNeeds] = useState<PassengerFormSpec | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (booking.status === 'web_confirmed') {
    return <Callout tone="grey" icon="clock">Confirmed on the website. The agent starts booking within a few seconds.</Callout>;
  }
  if (booking.status !== 'awaiting_confirm') return null;

  const confirm = async (details?: Details) => {
    setBusy(true); setError(null); setFieldErrors({});
    try {
      // The booking's own traveller confirms it (the web service only allows the requester).
      await confirmOnWeb(booking.raw.slack_user || '', booking.id, details);
      setNeeds(null);
      onChanged();
      window.setTimeout(onChanged, 6000); // the bot has usually started by then
    } catch (e) {
      if (e instanceof ApiError && e.needs) setNeeds(e.needs);
      if (e instanceof ApiError && e.fieldErrors) setFieldErrors(e.fieldErrors);
      else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {error && <Callout tone="orange" icon="warn">{error}</Callout>}
      {needs ? (
        <PassengerForm spec={needs} fieldErrors={fieldErrors} busy={busy} onSubmit={confirm} onCancel={() => { setNeeds(null); setFieldErrors({}); }} />
      ) : (
        <>
          <div>
            <div style={{ fontWeight: 600 }}>Waiting for confirmation</div>
            <p className="muted-t" style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: 1.5 }}>
              Confirm here to book it now, just like pressing Confirm on the traveller’s Slack card. The card’s buttons are cleared.
            </p>
          </div>
          <Button variant="dark" onClick={() => confirm()} disabled={busy} style={{ alignSelf: 'flex-start' }}>{busy ? 'Booking…' : 'Confirm & book'}</Button>
        </>
      )}
    </div>
  );
}
