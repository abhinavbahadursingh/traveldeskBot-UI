import type { SVGProps } from 'react';

const ICONS = {
  plane: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.4"></path><path d="M21 4v5h-5"></path></>,
  list: <><rect x="4" y="4" width="16" height="16" rx="4"></rect><path d="M8 9h8M8 13h8M8 17h5"></path></>,
  clock: <><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="3"></rect><path d="M3 10h18M7 15h3"></path></>,
  card: <><rect x="3" y="6" width="18" height="13" rx="3"></rect><path d="M3 10h18"></path></>,
  warn: <><path d="M12 4 2.8 19.5h18.4z"></path><path d="M12 10v4M12 17h.01"></path></>,
  info: <><circle cx="12" cy="12" r="8"></circle><path d="M12 8v5M12 16h.01"></path></>,
  search: <><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></>,
  close: <path d="M6 6l12 12M18 6 6 18"></path>,
  chevron: <path d="m9 6 6 6-6 6"></path>,
  check: <path d="m5 12 4.5 4.5L19 7"></path>,
  pin: <><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"></path><circle cx="12" cy="9" r="2.5"></circle></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6"></path>,
  plus: <path d="M12 5v14M5 12h14"></path>,
  bag: <><rect x="6" y="7" width="12" height="13" rx="2"></rect><path d="M9 7V4h6v3"></path></>,
  refund: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path></>,
  chat: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"></path><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"></path></>,
  globe: <><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path></>,
} as const;

export type IconName = keyof typeof ICONS;

type Props = SVGProps<SVGSVGElement> & {
  /** Named icon; or pass `d` for a single custom path. */
  name?: IconName;
  d?: string;
  size?: number;
};

export function Icon({ name, d, size = 18, className, ...rest }: Props) {
  return (
    <svg className={className ? 'ic ' + className : 'ic'} width={size} height={size} viewBox="0 0 24 24" {...rest}>
      {name ? ICONS[name] : <path d={d}></path>}
    </svg>
  );
}
