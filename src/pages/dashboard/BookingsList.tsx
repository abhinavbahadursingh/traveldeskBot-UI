import type { Booking } from '../../services/bookings';
import type { TabKey } from '../../lib/status';
import { FilterTabs } from './FilterTabs';
import { SearchBox } from './SearchBox';
import { BookingRow } from './BookingRow';
import { EmptyState } from './EmptyState';

interface Props {
  tab: TabKey;
  counts: Record<TabKey, number>;
  onTab: (t: TabKey) => void;
  q: string;
  onSearch: (v: string) => void;
  rows: Booking[];
  isEmpty: boolean;
  onOpen: (id: number) => void;
  onAsk: (id: number) => void;
}

export function BookingsList({ tab, counts, onTab, q, onSearch, rows, isEmpty, onOpen, onAsk }: Props) {
  return (
    <section className="bk-panel bk-list" aria-labelledby="bk-list-h">
      <div className="bk-panel-h">
        <div>
          <h2 id="bk-list-h">All requests</h2>
          <p>Every trip the agent picked up from Slack or the web. Open one to see where it stands.</p>
        </div>
      </div>
      <div className="bk-list-tools">
        <FilterTabs tab={tab} counts={counts} onPick={onTab} />
        <SearchBox value={q} onChange={onSearch} />
      </div>

      <div className="scroll">
        <div className="grid thead" aria-hidden="true">
          <span>ID</span><span>Request</span><span>Status</span><span>Payment</span><span style={{ textAlign: 'right' }}>Price</span><span>Created</span><span></span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rows.map((b, i) => (
            <BookingRow key={b.id} b={b} index={i} onOpen={() => onOpen(b.id)} onAsk={() => onAsk(b.id)} />
          ))}
        </div>
        {isEmpty && <EmptyState />}
      </div>
    </section>
  );
}
