import { statusMeta } from '../../lib/status';

export function StatusChip({ status }: { status: string }) {
  const m = statusMeta(status);
  return (
    <span className="chip" style={{ color: m.fg, background: m.bg }}>
      <span className={status === 'searching' ? 'dot ping' : 'dot'} style={{ background: m.dot }}></span>
      {m.label}
    </span>
  );
}
