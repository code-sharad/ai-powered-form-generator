'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SegmentedControl from '@/components/arc/segmented-control/segmented-control';
import { formService } from '@/services/formService';
import { ResponseChart, type ResponsePoint } from './ResponseChart';

type RangeKey = '1M' | '5M' | '1Y' | '2Y' | 'MAX';

type RangePreset = {
  value: RangeKey;
  label: string;
  /** Whole months back from today. `null` means from the first day of the account. */
  months: number | null;
  groupBy: 'day' | 'month';
};

const DAY_MS = 86_400_000;

/** The presets a stock chart would offer: short windows by day, long ones by month. */
const RANGE_PRESETS: RangePreset[] = [
  { value: '1M', label: '1M', months: 1, groupBy: 'day' },
  { value: '5M', label: '5M', months: 5, groupBy: 'day' },
  { value: '1Y', label: '1Y', months: 12, groupBy: 'month' },
  { value: '2Y', label: '2Y', months: 24, groupBy: 'month' },
  { value: 'MAX', label: 'Max', months: null, groupBy: 'month' },
];

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** Shifts by whole UTC months, clamping the day to the target month's length. */
function monthsBefore(date: Date, months: number) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(date.getUTCDate(), lastDay)));
}

/** "Sep 3 – Nov 3, 2026" inside a year, with both years when the window crosses one. */
function rangeLabel(start: Date, end: Date) {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const startText = start.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
  const endText = end.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
  return `${startText} – ${endText}`;
}

export function ResponseAnalytics({ formCount, publishedCount, refreshKey, earliestAt }: {
  formCount: number | null;
  publishedCount: number | null;
  refreshKey: number;
  earliestAt?: string;
}) {
  const [now] = useState(() => new Date());
  const [rangeKey, setRangeKey] = useState<RangeKey>('1M');
  const [data, setData] = useState<ResponsePoint[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const range = useMemo(() => {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const earliest = earliestAt ? new Date(earliestAt) : null;
    const earliestDay = earliest && Number.isFinite(earliest.getTime())
      ? new Date(Date.UTC(earliest.getUTCFullYear(), earliest.getUTCMonth(), earliest.getUTCDate()))
      : new Date(Date.UTC(today.getUTCFullYear() - 4, 0, 1));
    const preset = RANGE_PRESETS.find(item => item.value === rangeKey) ?? RANGE_PRESETS[0];
    // Fixed windows keep their full span. Max starts at the first data we know of.
    let start = preset.months === null ? earliestDay : monthsBefore(today, preset.months);
    if (start.getTime() >= today.getTime()) start = new Date(today.getTime() - DAY_MS);
    // Monthly buckets begin on the first, so the first column is a whole month.
    if (preset.groupBy === 'month') start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    return {
      startDate: isoDay(start),
      endDate: isoDay(today),
      groupBy: preset.groupBy,
      label: rangeLabel(start, today),
    };
  }, [rangeKey, now, earliestAt]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    setTotal(null);
    try {
      const result = await formService.getSubmissionAnalytics({
        startDate: range.startDate,
        endDate: range.endDate,
        groupBy: range.groupBy,
      });
      if (id !== requestId.current) return;
      setData(result.submissions);
      setTotal(result.totalSubmissions);
    } catch { if (id === requestId.current) setError(true); }
    finally { if (id === requestId.current) setLoading(false); }
  }, [range.startDate, range.endDate, range.groupBy]);

  const invalidateRequest = useCallback(() => { requestId.current++; }, []);

  useEffect(() => {
    load();
    return invalidateRequest;
  }, [load, refreshKey, invalidateRequest]);

  return <section id="activity" className="dashboard-analytics" aria-labelledby="analytics-heading" aria-busy={loading}>
    <div className="dashboard-analytics-heading">
      <div>
        <h2 id="analytics-heading">Responses</h2>
        <p>{range.label} <span className="analytics-timezone">UTC</span></p>
      </div>
      <SegmentedControl
        className="analytics-range"
        label="Date range"
        value={rangeKey}
        onValueChange={value => setRangeKey(value as RangeKey)}
        options={RANGE_PRESETS.map(({ value, label }) => ({ value, label }))}
      />
    </div>
    <div className="analytics-summary"><div><strong className="dashboard-response-total" aria-live="polite">{loading || error ? '—' : total ?? 0}</strong><span className="analytics-total-label">Total responses</span></div><div className="dashboard-form-totals"><span><strong>{formCount ?? '—'}</strong> forms</span><span><strong>{publishedCount ?? '—'}</strong> published</span></div></div>
    <div className="dashboard-chart">{loading ? <p role="status">Loading responses…</p> : error ? <div className="dashboard-chart-message" role="alert"><p>Responses couldn’t be loaded.</p><button type="button" className="text-primary underline" onClick={load}>Try again</button></div> : <><ResponseChart data={data} periodLabel={range.label} bucket={range.groupBy} /><table className="sr-only"><caption>Responses for {range.label}, in UTC</caption><thead><tr><th scope="col">Date</th><th scope="col">Responses</th></tr></thead><tbody>{data.map(point => <tr key={point.date}><th scope="row">{point.label}</th><td>{point.count}</td></tr>)}</tbody></table></>}</div>
  </section>;
}
