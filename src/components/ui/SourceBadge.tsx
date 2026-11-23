import { CHANNEL_NAME, type Channel } from '../../lib/channel';
import { Icon } from './Icon';

/** Pill such as "Requested in Slack"; `compact` = icon only (with a tooltip). */
export function SourceBadge({ via, action = 'Requested', compact = false }: { via: Channel; action?: string; compact?: boolean }) {
  const text = action + (via === 'slack' ? ' in ' : ' on the ') + CHANNEL_NAME[via];
  const icon = <Icon name={via === 'slack' ? 'chat' : 'globe'} size={compact ? 13 : 14} aria-hidden="true" />;
  if (compact) {
    return (
      <span className={'src-ic src-' + via} title={text}>
        {icon}
        <span className="sr-only">{text}</span>
      </span>
    );
  }
  return <span className={'src src-' + via}>{icon}{text}</span>;
}
