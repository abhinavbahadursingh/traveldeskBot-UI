import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function Callout({ tone, icon, children }: { tone: 'amber' | 'orange' | 'grey'; icon: IconName; children: ReactNode }) {
  return (
    <div className={'callout c-' + tone}>
      <Icon name={icon} size={18} aria-hidden="true" style={{ flex: 'none', marginTop: '2px' }} />
      <span>{children}</span>
    </div>
  );
}
