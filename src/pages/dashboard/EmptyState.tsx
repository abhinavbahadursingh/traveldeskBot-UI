import { Icon } from '../../components/ui/Icon';

export function EmptyState() {
  return (
    <div className="empty fade">
      <span className="kpi-ic" aria-hidden="true"><Icon name="search" size={18} /></span>
      <strong style={{ fontSize: '16px', color: '#0F1B2D' }}>No bookings here</strong>
      <span className="muted-t">Try another filter or clear the search.</span>
    </div>
  );
}
