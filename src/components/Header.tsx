import { Link } from 'react-router-dom';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import type { Traveller } from '../services/book';

interface Props {
  variant: 'dashboard' | 'book';
  onRefresh?: () => void;
  travellers?: Traveller[];
  user?: string;
  onUser?: (id: string) => void;
}

export function Header({ variant, onRefresh, travellers = [], user = '', onUser }: Props) {
  const me = travellers.find((t) => t.id === user);
  return (
    <header
      className="glass rise hdr"
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 10px 10px 12px', borderRadius: '999px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="logo" aria-hidden="true"><Icon name="plane" size={20} /></span>
        <span style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 650, fontSize: '18px', letterSpacing: '-0.01em' }}>Travel Desk</span>
      </div>
      {variant === 'dashboard' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="live"><span className="dot" style={{ background: '#22C55E' }}></span>Live from bookings DB</span>
          <IconButton className="spin" icon="refresh" aria-label="Refresh bookings" onClick={onRefresh} />
        </div>
      ) : (
        <>
          <nav aria-label="Primary" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', padding: '4px', borderRadius: '999px', background: 'rgba(15,27,45,.05)' }}>
            <a className="nav on" href="#book" aria-current="page">Book a trip</a>
            <Link className="nav" to="/">All bookings</Link>
          </nav>
          <span className="chip who" style={{ background: 'rgba(255,255,255,.75)' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0F1B2D', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }} aria-hidden="true">{me ? me.name.charAt(0).toUpperCase() : '?'}</span>
            <label className="sr-only" htmlFor="bk-who">Booking for</label>
            <select id="bk-who" value={user} onChange={(e) => onUser?.(e.target.value)} disabled={!travellers.length}>
              {!travellers.length && <option value="">No travellers</option>}
              {travellers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <Icon name="chevron" size={14} aria-hidden="true" style={{ transform: 'rotate(90deg)', color: '#52607A', marginLeft: '-22px', pointerEvents: 'none' }} />
          </span>
        </>
      )}
    </header>
  );
}
