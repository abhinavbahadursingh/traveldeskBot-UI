import { TABS, type TabKey } from '../../lib/status';

export function FilterTabs({ tab, counts, onPick }: { tab: TabKey; counts: Record<TabKey, number>; onPick: (t: TabKey) => void }) {
  return (
    <div className="seg" role="group" aria-label="Filter by status">
      {TABS.map(([key, label]) => {
        const on = tab === key;
        return (
          <button key={key} className={on ? 'tab is-on' : 'tab'} aria-pressed={on ? 'true' : 'false'} onClick={() => onPick(key)}>
            {label}<span className="count">{counts[key]}</span>
          </button>
        );
      })}
    </div>
  );
}
