import type { ReactNode } from 'react';

export function GlassBackdrop({ page, children }: { page: 'page-dash' | 'page-book'; children: ReactNode }) {
  return (
    <div className={'root ' + page}>
      <div className="blob b1" aria-hidden="true"></div>
      <div className="blob b2" aria-hidden="true"></div>
      <div className="blob b3" aria-hidden="true"></div>
      {children}
    </div>
  );
}
