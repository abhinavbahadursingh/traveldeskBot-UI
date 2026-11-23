 // The /book page's work in progress, kept in localStorage per traveller so a reload
// (or a new tab) shows the same search without asking the agent again.
import type { FlightSearch } from '../services/book';

export interface BookDraft {
  ask: string;
  search: FlightSearch | null; // last known copy; its id resumes polling / sending
  pick: string | null;
  showAll: boolean;
  sentId: number | null; // a request already sent to Slack, still being followed
  savedAt: number; // ms
}

const VERSION = 1;
// The web service keeps a search for 30 minutes after it finishes; after that its
// id can't be sent to Slack, so the copy here is dropped too.
const SEARCH_TTL_MS = 30 * 60 * 1000;
const SENT_TTL_MS = 24 * 60 * 60 * 1000;

const key = (user: string) => `traveldesk.book.v${VERSION}.${user}`;

function searchExpired(s: FlightSearch | null, now: number): boolean {
  if (!s) return false;
  const since = (s.finished ?? s.started) * 1000;
  return now - since > SEARCH_TTL_MS;
}

export function loadDraft(user: string): BookDraft | null {
  try {
    const raw = localStorage.getItem(key(user));
    if (!raw) return null;
    const d = JSON.parse(raw) as BookDraft;
    const now = Date.now();
    const search = searchExpired(d.search, now) ? null : d.search;
    const sentId = d.sentId != null && now - d.savedAt <= SENT_TTL_MS ? d.sentId : null;
    if (!search && sentId == null && !d.ask) return null;
    return { ...d, search, pick: search ? d.pick : null, sentId };
  } catch {
    return null; // blocked storage or a bad entry: start fresh
  }
}

export function saveDraft(user: string, d: Omit<BookDraft, 'savedAt'>): void {
  try {
    if (!d.ask && !d.search && d.sentId == null) localStorage.removeItem(key(user));
    else localStorage.setItem(key(user), JSON.stringify({ ...d, savedAt: Date.now() }));
  } catch {
    /* private mode / quota: the page still works, it just won't survive a reload */
  }
}
