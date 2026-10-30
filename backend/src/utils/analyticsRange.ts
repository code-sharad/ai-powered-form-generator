export type AnalyticsRange = {
  start: Date;
  endExclusive: Date;
  periodDays: number;
  groupBy: 'day' | 'month';
};

const DAY_MS = 86_400_000;

function parseDate(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError('Dates must use YYYY-MM-DD format.');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError('Choose a valid calendar date.');
  }
  return date;
}

export function parseAnalyticsRange(query: Record<string, unknown>, now = new Date()): AnalyticsRange {
  const groupBy = query.groupBy ?? 'day';
  if (groupBy !== 'day' && groupBy !== 'month') throw new RangeError('Group by day or month.');
  let start: Date;
  let endExclusive: Date;
  if (query.startDate !== undefined || query.endDate !== undefined) {
    start = parseDate(query.startDate);
    const end = parseDate(query.endDate);
    endExclusive = new Date(end.getTime() + DAY_MS);
  } else {
    const value = query.days ?? '30';
    if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new RangeError('Days must be a positive integer.');
    const days = Number(value);
    if (!Number.isInteger(days) || days < 1 || days > 366) throw new RangeError('Choose between 1 and 366 days.');
    endExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    start = new Date(endExclusive.getTime() - days * DAY_MS);
  }
  const periodDays = (endExclusive.getTime() - start.getTime()) / DAY_MS;
  if (periodDays < 1 || periodDays > 366) throw new RangeError('Choose an ordered date range of up to 366 days.');
  return { start, endExclusive, periodDays, groupBy };
}

export function buildAnalyticsSeries(range: AnalyticsRange, buckets: Array<{ _id: string; count: number }>) {
  const counts = new Map(buckets.map(bucket => [bucket._id, bucket.count]));
  const result: Array<{ date: string; count: number; label: string }> = [];
  const cursor = new Date(range.start);
  if (range.groupBy === 'month') cursor.setUTCDate(1);
  while (cursor < range.endExclusive) {
    const key = cursor.toISOString().slice(0, range.groupBy === 'month' ? 7 : 10);
    result.push({
      date: range.groupBy === 'month' ? `${key}-01` : key,
      count: counts.get(key) ?? 0,
      label: cursor.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', ...(range.groupBy === 'day' ? { day: 'numeric' } : {}) }),
    });
    if (range.groupBy === 'month') cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}
