'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formService } from '@/services/formService';
import { ResponseChart, type ResponsePoint } from './ResponseChart';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function ResponseAnalytics({ formCount, publishedCount, refreshKey, firstYear }: {
  formCount: number | null;
  publishedCount: number | null;
  refreshKey: number;
  firstYear?: number;
}) {
  const [today] = useState(() => new Date());
  const currentYear = today.getUTCFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(String(today.getUTCMonth()));
  const [data, setData] = useState<ResponsePoint[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const earliestYear = typeof firstYear === 'number' && Number.isInteger(firstYear) ? Math.min(currentYear - 4, Math.max(1970, firstYear)) : currentYear - 4;
  const years = Array.from({ length: currentYear - earliestYear + 1 }, (_, index) => currentYear - index);
  const periodLabel = month === 'year' ? String(year) : `${months[Number(month)]} ${year}`;
  const range = useMemo(() => ({
    startDate: new Date(Date.UTC(year, month === 'year' ? 0 : Number(month), 1)).toISOString().slice(0, 10),
    endDate: new Date(Date.UTC(year, month === 'year' ? 12 : Number(month) + 1, 0)).toISOString().slice(0, 10),
    groupBy: month === 'year' ? 'month' as const : 'day' as const,
  }), [year, month]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    setTotal(null);
    try {
      const result = await formService.getSubmissionAnalytics(range);
      if (id !== requestId.current) return;
      setData(result.submissions);
      setTotal(result.totalSubmissions);
    } catch { if (id === requestId.current) setError(true); }
    finally { if (id === requestId.current) setLoading(false); }
  }, [range]);

  const invalidateRequest = useCallback(() => { requestId.current++; }, []);

  useEffect(() => {
    load();
    return invalidateRequest;
  }, [load, refreshKey, invalidateRequest]);

  return <section id="activity" className="dashboard-analytics" aria-labelledby="analytics-heading" aria-busy={loading}>
    <div className="dashboard-analytics-heading"><div><h2 id="analytics-heading">Responses</h2><p>{periodLabel} <span className="analytics-timezone">UTC</span></p></div><div className="analytics-period-controls"><Select value={month} onValueChange={setMonth}><SelectTrigger id="analytics-month" className="analytics-select-trigger" aria-label="Analytics month"><SelectValue /></SelectTrigger><SelectContent className="dashboard-select-menu" position="popper" align="end" sideOffset={5}><SelectItem value="year">Whole year</SelectItem>{months.map((label, index) => <SelectItem key={label} value={String(index)}>{label}</SelectItem>)}</SelectContent></Select><Select value={String(year)} onValueChange={value => setYear(Number(value))}><SelectTrigger id="analytics-year" className="analytics-select-trigger" aria-label="Analytics year"><SelectValue /></SelectTrigger><SelectContent className="dashboard-select-menu" position="popper" align="end" sideOffset={5}>{years.map(value => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}</SelectContent></Select></div></div>
    <div className="analytics-summary"><div><strong className="dashboard-response-total" aria-live="polite">{loading || error ? '—' : total ?? 0}</strong><span className="analytics-total-label">Total responses</span></div><div className="dashboard-form-totals"><span><strong>{formCount ?? '—'}</strong> forms</span><span><strong>{publishedCount ?? '—'}</strong> published</span></div></div>
    <div className="dashboard-chart">{loading ? <p role="status">Loading responses…</p> : error ? <div className="dashboard-chart-message" role="alert"><p>Responses couldn’t be loaded.</p><button type="button" className="text-primary underline" onClick={load}>Try again</button></div> : <><ResponseChart data={data} periodLabel={periodLabel} bucket={range.groupBy === 'month' ? 'month' : 'day'} /><table className="sr-only"><caption>Responses for {periodLabel}, in UTC</caption><thead><tr><th scope="col">Date</th><th scope="col">Responses</th></tr></thead><tbody>{data.map(point => <tr key={point.date}><th scope="row">{point.label}</th><td>{point.count}</td></tr>)}</tbody></table></>}</div>
  </section>;
}
