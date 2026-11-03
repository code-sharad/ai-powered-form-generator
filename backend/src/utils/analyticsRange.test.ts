import { describe, expect, test } from 'bun:test';
import { buildAnalyticsSeries, parseAnalyticsRange } from './analyticsRange';

describe('analytics date ranges', () => {
  test('retains rolling-day callers and includes the full current UTC day', () => {
    const range = parseAnalyticsRange({ days: '30' }, new Date('2026-03-15T17:23:00Z'));
    expect(range.start.toISOString()).toBe('2026-02-14T00:00:00.000Z');
    expect(range.endExclusive.toISOString()).toBe('2026-03-16T00:00:00.000Z');
    expect(range.periodDays).toBe(30);
  });

  test('handles leap-year February and fills days without responses', () => {
    const range = parseAnalyticsRange({ startDate: '2024-02-01', endDate: '2024-02-29' });
    const data = buildAnalyticsSeries(range, [{ _id: '2024-02-29', count: 3 }]);
    expect(data).toHaveLength(29);
    expect(data[0]).toEqual({ date: '2024-02-01', label: 'Feb 1', count: 0 });
    expect(data[28]).toEqual({ date: '2024-02-29', label: 'Feb 29', count: 3 });
    expect(range.endExclusive.toISOString()).toBe('2024-03-01T00:00:00.000Z');
  });

  test('returns twelve monthly buckets for a calendar year', () => {
    const range = parseAnalyticsRange({ startDate: '2024-01-01', endDate: '2024-12-31', groupBy: 'month' });
    const data = buildAnalyticsSeries(range, [{ _id: '2024-01', count: 4 }, { _id: '2024-12', count: 7 }]);
    expect(range.periodDays).toBe(366);
    expect(data).toHaveLength(12);
    expect(data[0]).toEqual({ date: '2024-01-01', label: 'Jan', count: 4 });
    expect(data[1]?.count).toBe(0);
    expect(data[11]).toEqual({ date: '2024-12-01', label: 'Dec', count: 7 });
  });

  test('allows multi-year ranges when buckets are monthly', () => {
    const range = parseAnalyticsRange({ startDate: '2024-01-01', endDate: '2026-01-01', groupBy: 'month' });
    expect(range.periodDays).toBe(732);
    expect(buildAnalyticsSeries(range, [])).toHaveLength(25);
  });

  test('labels buckets using UTC even across year boundaries', () => {
    const range = parseAnalyticsRange({ startDate: '2025-12-31', endDate: '2026-01-01' });
    expect(buildAnalyticsSeries(range, []).map(point => point.label)).toEqual(['Dec 31', 'Jan 1']);
  });

  for (const query of [
    { days: '0' }, { days: '-1' }, { days: '1.5' }, { days: '3660' }, { days: 'abc' }, { days: ['30'] },
    { startDate: '2026-02-29', endDate: '2026-03-01' },
    { startDate: '2026-01-01' },
    { startDate: '2026-02-01', endDate: '2026-01-01' },
    { startDate: '2024-01-01', endDate: '2026-01-01' },
    { startDate: '2026-01-01', endDate: '2026-01-31', groupBy: 'minute' },
  ]) {
    test(`rejects invalid input ${JSON.stringify(query)}`, () => {
      expect(() => parseAnalyticsRange(query)).toThrow(RangeError);
    });
  }
});
