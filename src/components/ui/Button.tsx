import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: 'dark' | 'ghost' | 'danger' | 'soft';
  size?: 'sm';
};

export function Button({ variant, size, className, ...rest }: Props) {
  const cls = ['btn', 'btn-' + variant, size === 'sm' ? 'btn-sm' : '', className || ''].filter(Boolean).join(' ');
  return <button className={cls} {...rest} />;
}
