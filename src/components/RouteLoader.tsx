import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/** Thin top progress bar that plays on every route change (not on first load). */
export function RouteProgress() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setRun((n) => n + 1);
  }, [pathname]);

  if (run === 0) return null;
  // key restarts the CSS animation on each navigation
  return <div key={run} className="route-progress" aria-hidden="true" />;
}

/** Suspense fallback while a route's code chunk loads. */
export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader-spinner" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
