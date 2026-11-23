import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import type { Booking } from '../services/bookings';
import * as bookings from '../services/bookings';
import { fmt } from '../lib/format';
import { inTab, isActive, isClosed, isDone, statusMeta, type TabKey } from '../lib/status';
import { BookNav } from './book/BookNav';
import { BookingsList } from './dashboard/BookingsList';
import { BookingDrawer } from './dashboard/BookingDrawer';
import { CancelModal } from './dashboard/CancelModal';
import { Toast } from './dashboard/Toast';
import '../styles/book.css';

const POLL_MS = 30000;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function todayLabel() {
  const d = new Date();
  return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
}

export default function Dashboard() {
  const [all, setAll] = useState<Booking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<TabKey>('all');
  const [q, setQ] = useState('');
  // /?booking=<id> opens that booking's drawer (links from the Slack ops digest).
  const [selId, setSelId] = useState<number | null>(() => {
    const id = Number(new URLSearchParams(window.location.search).get('booking'));
    return Number.isInteger(id) && id > 0 ? id : null;
  });
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; undoable: boolean } | null>(null);
  const [p, setP] = useState(0);
  const timer = useRef<number | null>(null);
  // A cancel shown in the UI but not yet written: it's sent when the Undo toast closes,
  // because once written the bot stops for good and messages the traveller.
  const pending = useRef<{ id: number; prev: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await bookings.getAll();
      const pend = pending.current;
      setAll(pend ? list.map((b) => (b.id === pend.id ? { ...b, status: 'cancelled' } : b)) : list);
    } catch (e) {
      console.error('Failed to load bookings', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    document.title = 'Travel Desk — Bookings';
    load();
    const iv = window.setInterval(load, POLL_MS);
    return () => clearInterval(iv);
  }, [load]);

  // KPI count-up: 1100ms easeOutCubic, starting 250ms after mount.
  useEffect(() => {
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* noop */ }
    if (reduce) { setP(1); return; }
    let start: number | null = null;
    let raf = 0;
    const tick = (t: number) => {
      if (start === null) start = t;
      const x = Math.min(1, (t - start) / 1100);
      setP(1 - Math.pow(1 - x, 3));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    const to = window.setTimeout(() => { raf = requestAnimationFrame(tick); }, 250);
    return () => { clearTimeout(to); cancelAnimationFrame(raf); };
  }, []);

  const setStatus = (id: number, status: string) =>
    setAll((list) => list.map((x) => (x.id === id ? { ...x, status } : x)));

  const showToast = (text: string, undoable: boolean) => {
    setToast({ text, undoable });
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setToast(null);
      if (undoable) commit();
    }, 4500);
  };

  // Write the pending cancel to the DB.
  const commit = useCallback((keepalive = false) => {
    const pend = pending.current;
    if (!pend) return;
    pending.current = null;
    bookings.cancel(pend.id, { keepalive }).then(
      (b) => setAll((list) => list.map((x) => (x.id === b.id ? b : x))),
      (e: Error) => {
        setStatus(pend.id, pend.prev);
        setToast({ text: 'Couldn’t cancel #' + pend.id + ': ' + e.message, undoable: false });
        if (timer.current) clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setToast(null), 4500);
        load();
      },
    );
  }, [load]);

  // Leaving the page or closing the tab doesn't drop a cancel.
  useEffect(() => {
    const flush = () => commit(true);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      if (timer.current) clearTimeout(timer.current);
      flush();
    };
  }, [commit]);

  const counts: Record<TabKey, number> = {
    all: all.length,
    active: all.filter((b) => isActive(b.status)).length,
    payment: all.filter((b) => b.status === 'awaiting_payment').length,
    done: all.filter((b) => isDone(b.status)).length,
    closed: all.filter((b) => isClosed(b.status)).length,
  };

  const ql = (q || '').trim().toLowerCase();
  const rows = all.filter((b) => inTab(tab, b.status)).filter((b) =>
    !ql || String(b.id).indexOf(ql.replace('#', '')) > -1 || b.request.toLowerCase().indexOf(ql) > -1 || statusMeta(b.status).label.toLowerCase().indexOf(ql) > -1 || b.status.indexOf(ql) > -1,
  );

  const awaiting = all.filter((b) => b.status === 'awaiting_payment');
  const awaitSum = awaiting.reduce((s, b) => s + (b.price || 0), 0);
  const waitingOn = all.filter((b) => b.status === 'need_info' || b.status === 'need_documents' || b.status === 'no_passport').length;
  const stuck = all.filter((b) => b.status === 'searching' && b.stuck);
  const oldestStuck = stuck.reduce<Booking | null>((o, b) => (!o || b.createdMs < o.createdMs ? b : o), null);
  const k = {
    total: Math.round(counts.all * p),
    totalSub: counts.closed + ' closed · ' + counts.done + ' booked',
    active: Math.round(counts.active * p),
    activeSub: waitingOn + ' waiting on the traveller',
    pay: fmt(awaitSum * p),
    paySub: awaiting.length === 0 ? 'Nothing outstanding' : awaiting.length + (awaiting.length === 1 ? ' booking' : ' bookings') + ' · pay link sent',
    stuck: Math.round(stuck.length * p),
    stuckSub: oldestStuck ? stuck.map((b) => '#' + b.id).join(', ') + ' still searching since ' + bookings.shortDate(new Date(oldestStuck.createdMs)) : 'Nothing stuck right now',
  };

  const sb = all.find((b) => b.id === selId) || null;
  const cb = all.find((b) => b.id === confirmId) || null;

  const closeSel = () => {
    setSelId(null);
    if (window.location.search.includes('booking=')) window.history.replaceState(null, '', window.location.pathname);
  };
  const keep = () => setConfirmId(null);

  const doCancel = () => {
    const b = cb;
    setConfirmId(null);
    if (!b) return;
    commit(); // an earlier cancel still in its Undo window is sent now
    pending.current = { id: b.id, prev: b.status };
    setStatus(b.id, 'cancelled');
    showToast('Booking #' + b.id + ' cancelled', true);
  };

  const undo = () => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
    const pend = pending.current;
    pending.current = null;
    if (pend) setStatus(pend.id, pend.prev);
  };

  // Esc closes the modal first, then the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmId != null) setConfirmId(null);
      else if (selId != null) setSelId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmId, selId]);

  const stats: { label: string; value: string | number; sub: string; alert?: boolean }[] = [
    { label: 'Total requests', value: k.total, sub: k.totalSub },
    { label: 'In progress', value: k.active, sub: k.activeSub },
    { label: 'Awaiting payment', value: k.pay, sub: k.paySub },
    { label: 'Stuck over 24h', value: k.stuck, sub: k.stuckSub, alert: stuck.length > 0 },
  ];

  return (
    <div className="page-dash">
      <div className="bk-page" id="top">
        <div className="bk-wrap">
          <BookNav
            active="bookings"
            right={
              <>
                <span className="bk-live"><span className="dot" aria-hidden="true"></span><span>Live from bookings DB</span></span>
                <button className="bk-iconbtn" aria-label="Refresh bookings" onClick={load}><Icon name="refresh" size={17} /></button>
              </>
            }
          />

          <section className="bk-hero">
            <div>
              <div className="bk-eyebrow">{todayLabel()}</div>
              <h1>Bookings</h1>
              <p className="bk-greet">Every travel request the agent picked up from Slack — where it stands, what’s owed, and what’s stuck.</p>
            </div>
            <div className="bk-stats" style={{ ['--n' as string]: 4 }} aria-label="Summary">
              {stats.map((t) => (
                <div key={t.label} className="bk-stat">
                  <small>{t.label}</small>
                  <b style={{ color: t.alert ? 'var(--rose)' : undefined }}>{t.value}</b>
                  <em className="flat">{t.sub}</em>
                </div>
              ))}
            </div>
          </section>

          <BookingsList
            tab={tab}
            counts={counts}
            onTab={setTab}
            q={q}
            onSearch={setQ}
            rows={rows}
            isEmpty={loaded && rows.length === 0}
            onOpen={setSelId}
            onAsk={setConfirmId}
          />
        </div>
      </div>

      {sb && <BookingDrawer sb={sb} onClose={closeSel} onAsk={() => setConfirmId(selId)} onChanged={load} />}
      {cb && <CancelModal cb={cb} onKeep={keep} onConfirm={doCancel} />}
      {toast && <Toast text={toast.text} onUndo={toast.undoable ? undo : undefined} />}
    </div>
  );
}
