import { Icon, type IconName } from '../../components/ui/Icon';

export interface Kpis {
  total: number;
  totalSub: string;
  active: number;
  activeSub: string;
  pay: string;
  paySub: string;
  stuck: number;
  stuckSub: string;
}

function Kpi({ label, icon, iconStyle, delay, value, sub }: { label: string; icon: IconName; iconStyle?: React.CSSProperties; delay: number; value: string | number; sub: string }) {
  return (
    <div className="kpi glass lift rise" style={{ animationDelay: delay + 'ms' }}>
      <div className="kpi-top">{label}<span className="kpi-ic" aria-hidden="true" style={iconStyle}><Icon name={icon} size={18} /></span></div>
      <div className="kpi-val">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

export function KpiGrid({ k }: { k: Kpis }) {
  return (
    <section className="kpis" aria-label="Summary">
      <Kpi label="Total requests" icon="list" delay={140} value={k.total} sub={k.totalSub} />
      <Kpi label="In progress" icon="clock" delay={200} value={k.active} sub={k.activeSub} />
      <Kpi label="Awaiting payment" icon="wallet" delay={260} value={k.pay} sub={k.paySub} />
      <Kpi label="Stuck over 24h" icon="warn" iconStyle={{ color: '#C2410C' }} delay={320} value={k.stuck} sub={k.stuckSub} />
    </section>
  );
}
