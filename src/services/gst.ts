// GST rows from the bot's ops tables via /api/gst (see server/api.ts).
import type { GstRow } from '../lib/gst';

export interface GstResponse {
  rows: GstRow[];
  setup?: string; // set when the ops GST columns aren't migrated yet
}

export async function getGst(): Promise<GstResponse> {
  const r = await fetch('/api/gst');
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
  return j as GstResponse;
}
