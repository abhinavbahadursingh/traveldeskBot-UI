import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  iconSize?: number;
  'aria-label': string;
};

export function IconButton({ icon, iconSize = 18, className, ...rest }: Props) {
  return (
    <button className={className ? 'iconbtn ' + className : 'iconbtn'} {...rest}>
      <Icon name={icon} size={iconSize} aria-hidden="true" />
    </button>
  );
}
