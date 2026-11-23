import { useState } from 'react';
import type { Details, PassengerFormSpec } from '../../services/book';
import { Button } from '../../components/ui/Button';

interface Props {
  spec: PassengerFormSpec;
  fieldErrors: Record<string, string>;
  busy: boolean;
  onSubmit: (details: Details) => void;
  onCancel: () => void;
}

/** Details the booking still needs. Saved values are never shown; fields on file can stay blank. */
export function PassengerForm({ spec, fieldErrors, busy, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Details>({});
  const set = (name: string, v: string) => setValues((x) => ({ ...x, [name]: v }));
  const missing = spec.fields.some((f) => !f.optional && !(values[f.name] || '').trim());

  return (
    <form className="pform pop" onSubmit={(e) => { e.preventDefault(); if (!missing) onSubmit(values); }} autoComplete="off">
      <div>
        <h3 className="h3" style={{ fontSize: '17px' }}>Passenger details</h3>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: 1.5 }}>{spec.intro}</p>
      </div>
      {spec.fields.map((f) => {
        const err = fieldErrors[f.name] || f.error;
        const id = 'pf-' + f.name;
        return (
          <label key={f.name} className={err ? 'pfield bad' : 'pfield'} htmlFor={id}>
            {f.label}{f.optional && !f.on_file ? ' (optional)' : ''}
            {f.kind === 'select' ? (
              <select id={id} value={values[f.name] || ''} onChange={(e) => set(f.name, e.target.value)} aria-invalid={!!err}>
                <option value="">{f.on_file ? 'Keep what’s on file' : 'Choose…'}</option>
                {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                id={id}
                type={f.kind === 'date' ? 'date' : 'text'}
                maxLength={f.kind === 'date' ? undefined : f.max_length}
                value={values[f.name] || ''}
                onChange={(e) => set(f.name, e.target.value)}
                aria-invalid={!!err}
                placeholder={f.on_file ? 'On file' : undefined}
              />
            )}
            {err ? <span className="err">{err}</span> : f.on_file && <span className="hint">On file. Leave blank to keep it.</span>}
          </label>
        );
      })}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Button variant="dark" type="submit" style={{ flex: 1 }} disabled={busy || missing}>{busy ? 'Booking…' : 'Save & book'}</Button>
        <Button variant="ghost" type="button" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </form>
  );
}
