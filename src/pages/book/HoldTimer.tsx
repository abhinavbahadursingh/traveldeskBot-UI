import { mmss } from '../../lib/format';

/** How long search prices are treated as fresh before suggesting a new search. */
export const FRESH_SECONDS = 900;

/**
 * "Prices fresh for m:ss" with a bar that shrinks as time runs out. Screen readers get a
 * polite update once a minute (not every second); when time's up it offers a reload.
 */
export function HoldTimer({ left, onReload }: { left: number; onReload?: () => void }) {
  const mins = Math.ceil(left / 60);
  const said = left > 0 ? 'Prices fresh for about ' + mins + (mins === 1 ? ' minute' : ' minutes') : 'Prices may have changed';
  const live = <span className="sr-only" aria-live="polite">{said}</span>;

  if (left <= 0) {
    return (
      <div className="bk-timer stale">
        {live}
        <span aria-hidden="true">⏱ Prices may have changed</span>
        {onReload && <button className="bk-reload" onClick={onReload}>↻ Reload prices</button>}
      </div>
    );
  }
  return (
    <div className="bk-timer">
      {live}
      <span aria-hidden="true">⏱ Prices fresh for</span>
      <b aria-hidden="true">{mmss(left)}</b>
      <div className="bk-bar" aria-hidden="true"><i style={{ width: (left / FRESH_SECONDS) * 100 + '%' }}></i></div>
    </div>
  );
}
