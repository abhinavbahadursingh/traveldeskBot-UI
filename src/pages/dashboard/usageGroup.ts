// ai_usage rows for one booking → the drawer's "AI usage" group (cost in USD and INR).
import type { AiUsage } from '../../services/bookings';
import type { SchemaRow } from './SchemaGroup';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const n = (x: number) => Math.round(x).toLocaleString('en-IN');

/** "$0.1001" under 10 cents keeps 4 decimals so tiny calls don't read as $0.00. */
export function usd(x: number): string {
  return '$' + (x < 0.1 ? x.toFixed(4) : x.toFixed(2));
}

export function inr(x: number): string {
  return '₹' + x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const both = (costUsd: number, costInr: number) => usd(costUsd) + ' · ' + inr(costInr);

/** "claude-haiku-4-5-20251001" → "Haiku 4.5", "claude-sonnet-5" → "Sonnet 5". */
function modelName(model: string | null): string {
  const m = (model || '').match(/(haiku|sonnet|opus|fable)-(\d+)(?:-(\d+))?(?:-\d{8})?$/i);
  if (!m) return model || 'Unknown model';
  return m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() + ' ' + m[2] + (m[3] ? '.' + m[3] : '');
}

function when(iso: string | null): string {
  const t = iso?.match(/^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return t ? Number(t[2]) + ' ' + MON[Number(t[1]) - 1] + ', ' + t[3] + ':' + t[4] : '';
}

const TASKS: Record<string, string> = {
  extract: 'Read the request',
  classify: 'Judge complexity',
  pick: 'Choose the flight',
  status: 'Check booking status',
};

export function usageRows(u: AiUsage | null, failed: boolean): SchemaRow[] {
  if (failed) return [{ key: 'ai_usage', val: 'Couldn’t load usage', cls: 'kv-v muted' }];
  if (!u) return [{ key: 'ai_usage', val: 'Loading…', cls: 'kv-v muted' }];
  if (!u.calls.length) return [{ key: 'ai_usage', val: 'No AI usage recorded for this booking', cls: 'kv-v muted' }];
  const t = u.totals;
  const cached = t.cache_read_tokens + t.cache_creation_tokens;
  const rows: SchemaRow[] = [
    { key: 'total_cost', val: both(t.est_cost_usd, t.est_cost_inr), cls: 'kv-v' },
    {
      key: 'total_tokens',
      val: n(t.input_tokens + t.output_tokens + cached) + ' (' + n(t.input_tokens) + ' in · ' + n(t.output_tokens) + ' out'
        + (cached ? ' · ' + n(cached) + ' cache' : '') + ')',
      cls: 'kv-v',
    },
    { key: 'calls', val: String(u.calls.length), cls: 'kv-v' },
  ];
  u.calls.forEach((c, i) => {
    const cache = c.cache_read_tokens + c.cache_creation_tokens;
    rows.push({
      id: 'call-' + i,
      key: c.task_kind || 'call',
      val: (TASKS[c.task_kind || ''] || c.task_kind || 'AI call') + ' · ' + modelName(c.model) + '\n'
        + n(c.input_tokens) + ' in · ' + n(c.output_tokens) + ' out' + (cache ? ' · ' + n(cache) + ' cache' : '')
        + ' · ' + both(c.est_cost_usd, c.est_cost_inr) + (when(c.created_at) ? ' · ' + when(c.created_at) : ''),
      cls: 'kv-v',
    });
  });
  const fx = u.fx;
  const rateDay = fx.date ? when(fx.date + 'T00:00').replace(/, 00:00$/, '') + ' ' + fx.date.slice(0, 4) : '';
  rows.push({
    key: 'usd_inr',
    val: fx.source === 'ecb'
      ? inr(fx.rate) + ' per $ · ECB reference rate, ' + rateDay + (fx.days > 1 ? ' (each call at its own day’s rate)' : '')
      : inr(fx.rate) + ' per $ · fixed rate (live rate unavailable)',
    cls: fx.source === 'ecb' ? 'kv-v' : 'kv-v muted',
  });
  rows.push({ key: 'note', val: 'AI costs are the bot’s estimates from its price list, not an invoice.', cls: 'kv-v muted' });
  return rows;
}
