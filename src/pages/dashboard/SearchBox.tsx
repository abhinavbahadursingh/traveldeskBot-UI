import { Icon } from '../../components/ui/Icon';

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="search">
      <Icon name="search" size={18} aria-hidden="true" />
      <label className="sr-only" htmlFor="td-q">Search bookings</label>
      <input id="td-q" type="search" placeholder="Search by ID, route or status" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
