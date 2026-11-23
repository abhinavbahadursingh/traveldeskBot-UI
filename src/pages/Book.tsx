import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as book from '../services/book';
import { ApiError } from '../services/book';
import type { Details, FlightSearch, PassengerFormSpec, Traveller } from '../services/book';
import * as bookings from '../services/bookings';
import type { Booking } from '../services/bookings';
import { isActive } from '../lib/status';
import { loadDraft, saveDraft } from '../lib/bookDraft';
import { tripData } from '../lib/tripData';
import type { ResultMode } from '../lib/results';
import { BookNav } from './book/BookNav';
import { Hero } from './book/Hero';
import { SearchCard } from './book/SearchCard';
import { ResultsPanel } from './book/ResultsPanel';
import { ActivityPanel, WaitingPanel } from './book/WaitingPanel';
import { TripSummary } from './book/TripSummary';
import { SideSkeleton, TravellerCard, UpcomingCard } from './book/SideCards';
import { FRESH_SECONDS } from './book/HoldTimer';
import '../styles/book.css';

const SEARCH_POLL_MS = 2500;
const STATUS_POLL_MS = 5000;
const USER_KEY = 'traveldesk.book.user';

const remember = (id: string) => { try { localStorage.setItem(USER_KEY, id); } catch { /* private mode */ } };
const remembered = () => { try { return localStorage.getItem(USER_KEY) || ''; } catch { return ''; } };

/** Seconds of price freshness left, counted from when the search finished. */
function freshLeft(s: FlightSearch | null): number {
  if (!s?.finished) return FRESH_SECONDS;
  return Math.max(0, FRESH_SECONDS - Math.floor(Date.now() / 1000 - s.finished));
}

export default function Book() {
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [user, setUser] = useState('');
  const [ask, setAsk] = useState('');
  const [list, setList] = useState<Booking[] | null>(null); // the bookings DB; null while loading
  const [mode, setMode] = useState<ResultMode>('best');
  const [search, setSearch] = useState<FlightSearch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [showBreak, setShowBreak] = useState(false);
  const [left, setLeft] = useState(FRESH_SECONDS);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState<Booking | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [needs, setNeeds] = useState<PassengerFormSpec | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadedFor, setLoadedFor] = useState(''); // whose draft the state holds
  const searchSeq = useRef(0); // ignores answers for a search that was replaced
  const pendingSent = useRef<number | null>(null); // restored request id while it loads

  useEffect(() => {
    document.title = 'Travel Desk — Book a trip';
    book.getTravellers().then(
      (list) => {
        setTravellers(list);
        const saved = remembered();
        setUser(list.some((t) => t.id === saved) ? saved : list[0]?.id || '');
      },
      (e: Error) => setError(e.message),
    );
  }, []);

  // Restore this traveller's search from the browser: no new agent call on reload.
  useEffect(() => {
    if (!user) return;
    const d = loadDraft(user);
    searchSeq.current++;
    pendingSent.current = d?.sentId ?? null;
    setAsk(d?.ask ?? '');
    setSearch(d?.search ?? null); // a running search resumes polling by its id
    setPick(d?.pick ?? null);
    setLeft(freshLeft(d?.search ?? null));
    setShowBreak(false); setError(null); setSendError(null); setSent(null);
    setLoadedFor(user);
    if (d?.sentId != null) {
      const seq = searchSeq.current;
      bookings.get(d.sentId).then(
        (b) => { if (seq === searchSeq.current) { pendingSent.current = null; setSent(b); } },
        () => undefined,
      );
    }
  }, [user]);

  // Keep the browser copy current.
  useEffect(() => {
    if (!user || loadedFor !== user) return; // not yet restored: would save the previous traveller's state
    saveDraft(user, { ask, search: search?.id ? search : null, pick, showAll: false, sentId: sent?.id ?? pendingSent.current });
  }, [user, loadedFor, ask, search, pick, sent]);

  // This traveller's bookings: stats, waiting items, recent routes, upcoming trips.
  useEffect(() => {
    let alive = true;
    bookings.getAll().then(
      (all) => { if (alive) setList(all); },
      (e: Error) => { console.error('Failed to load bookings', e); if (alive) setList([]); },
    );
    return () => { alive = false; };
  }, [user, sent?.id, sent?.status]);
  const data = useMemo(() => (list ? tripData(list, user) : null), [list, user]);

  // Follow a running search until it finishes.
  useEffect(() => {
    if (search?.status !== 'running' || !search.id) return; // id arrives with the first answer
    const seq = searchSeq.current;
    const t = window.setTimeout(() => {
      book.getSearch(search.id).then(
        (s) => {
          if (seq !== searchSeq.current) return;
          setSearch(s);
          if (s.status === 'ok') {
            setPick(s.picks?.[0]?.id ?? null);
            setLeft(freshLeft(s));
          }
        },
        (e: Error) => { if (seq === searchSeq.current) { setSearch(null); setError(e.message); } },
      );
    }, SEARCH_POLL_MS);
    return () => clearTimeout(t);
  }, [search]);

  // Price freshness countdown.
  const fresh = search?.status === 'ok' && !sent;
  useEffect(() => {
    if (!fresh) return;
    // Recomputed from the finish time each tick, so a throttled background tab never drifts.
    const tick = () => setLeft(freshLeft(search));
    tick();
    const iv = window.setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [fresh, search?.id, search?.finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow a request sent to Slack until it stops moving.
  useEffect(() => {
    if (!sent || !isActive(sent.status)) return;
    const t = window.setTimeout(() => {
      bookings.get(sent.id).then(setSent, () => setSent({ ...sent }));
    }, STATUS_POLL_MS);
    return () => clearTimeout(t);
  }, [sent]);

  const reset = useCallback(() => {
    searchSeq.current++;
    pendingSent.current = null;
    setSearch(null); setError(null); setPick(null); setShowBreak(false); setMode('best');
    setSent(null); setSendError(null); setActionError(null); setNeeds(null); setFieldErrors({});
  }, []);

  const chooseUser = (id: string) => { setUser(id); remember(id); }; // their draft loads above

  const runSearch = (raw: string) => {
    const text = raw.trim();
    if (!text || !user) return;
    reset();
    const seq = searchSeq.current;
    setSearch({ id: '', status: 'running', message: '', text, route: {}, started: Date.now() / 1000, finished: null, max_price: null, currency: 'INR' });
    book.startSearch(user, text).then(
      (s) => { if (seq === searchSeq.current) setSearch(s); },
      (e: Error) => { if (seq === searchSeq.current) { setSearch(null); setError(e.message); } },
    );
  };
  const find = (text?: string) => runSearch(text ?? ask);
  // Same trip as the last search, even if the request box was edited since.
  const reload = () => { if (search?.text) runSearch(search.text); };

  const submit = async () => {
    if (!search || !pick) return;
    setSending(true); setSendError(null);
    try {
      const { booking_id } = await book.sendToSlack(user, search.id, pick);
      setSent(await bookings.get(booking_id));
    } catch (e) {
      setSendError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  // Confirm & book on the page: a new booking from the picks, or one already sent to Slack.
  // The bot books it within seconds. Missing passenger details come back as a form.
  const confirm = async (details?: Details) => {
    if (!sent && (!search || !pick)) return;
    setConfirming(true); setActionError(null); setFieldErrors({});
    try {
      const id = sent
        ? (await book.confirmOnWeb(user, sent.id, details)).booking_id
        : (await book.bookHere(user, search!.id, pick!, details)).booking_id;
      setNeeds(null);
      setSent(await bookings.get(id));
    } catch (e) {
      if (e instanceof ApiError && e.needs) setNeeds(e.needs);
      if (e instanceof ApiError && e.fieldErrors) setFieldErrors(e.fieldErrors);
      else setActionError((e as Error).message);
      if (sent) setSent(await bookings.get(sent.id).catch(() => sent));
    } finally {
      setConfirming(false);
    }
  };

  // Before confirming in Slack: drop that request (the bot clears the card) and pick again.
  const changeFlight = async () => {
    if (!sent) return;
    try {
      await bookings.cancel(sent.id, { reason: 'change_flight' });
      setSent(null);
    } catch (e) {
      setSent(await bookings.get(sent.id).catch(() => sent));
      setSendError('Couldn’t change it: ' + (e as Error).message);
    }
  };

  const anotherTrip = () => { reset(); setAsk(''); };

  const traveller = travellers.find((t) => t.id === user);
  const cards = search?.status === 'ok' ? search.all || [] : [];
  const sel = cards.find((c) => c.id === pick) || null;

  return (
    <div className="bk-page" id="top">
      <div className="bk-wrap">
        <BookNav active="book" travellers={travellers} user={user} onUser={chooseUser} waiting={data ? data.waiting.length : null} />
        <Hero name={traveller?.name} data={data} />
        <SearchCard
          ask={ask}
          onAsk={setAsk}
          onFind={find}
          busy={search?.status === 'running'}
          traveller={traveller}
          search={search}
          recent={data?.recentRoutes ?? []}
        />

        <div className="bk-grid">
          <main className="bk-col">
            <ResultsPanel
              search={search}
              error={error}
              pick={pick}
              locked={!!sent}
              onPick={(id) => { if (!sent) { setPick(id); setNeeds(null); setActionError(null); } }}
              left={left}
              onReload={sent ? undefined : reload}
              mode={mode}
              onMode={setMode}
            />
            <div className="bk-split">
              <WaitingPanel items={data ? data.waiting : null} />
              <ActivityPanel />
            </div>
          </main>
          <aside className="bk-side" aria-label="Your trip">
            {!user && !error ? <SideSkeleton /> : (
              <TripSummary
                search={search}
                sel={sel}
                sending={sending}
                sendError={sendError}
                sent={sent}
                showBreak={showBreak}
                onToggleBreak={() => setShowBreak(!showBreak)}
                onSubmit={submit}
                onChange={changeFlight}
                onAnother={anotherTrip}
                user={user}
                confirming={confirming}
                actionError={actionError}
                needs={needs}
                fieldErrors={fieldErrors}
                onConfirm={confirm}
                onCancelDetails={() => { setNeeds(null); setFieldErrors({}); }}
              />
            )}
            <TravellerCard traveller={traveller} />
            <UpcomingCard trips={data ? data.upcoming : null} />
          </aside>
        </div>
      </div>
    </div>
  );
}
