import { describe, expect, test } from 'bun:test';
import { createRateLimiter } from './rateLimit';

describe('rate limiter', () => {
  test('allows up to the limit then blocks with retryAfterMs', () => {
    let now = 1000;
    const limiter = createRateLimiter({ limit: 3, windowMs: 60000, now: () => now });
    expect(limiter.check('k')).toEqual({ allowed: true, retryAfterMs: 0 });
    expect(limiter.check('k')).toEqual({ allowed: true, retryAfterMs: 0 });
    expect(limiter.check('k')).toEqual({ allowed: true, retryAfterMs: 0 });
    const blocked = limiter.check('k');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  test('a later clock value inside the window still blocks', () => {
    let now = 1000;
    const limiter = createRateLimiter({ limit: 2, windowMs: 60000, now: () => now });
    limiter.check('k');
    limiter.check('k');
    now = 30000;
    expect(limiter.check('k').allowed).toBe(false);
  });

  test('after the window it allows again', () => {
    let now = 1000;
    const limiter = createRateLimiter({ limit: 1, windowMs: 60000, now: () => now });
    limiter.check('k');
    now = 61001;
    expect(limiter.check('k')).toEqual({ allowed: true, retryAfterMs: 0 });
  });

  test('separate keys do not share a bucket', () => {
    let now = 1000;
    const limiter = createRateLimiter({ limit: 1, windowMs: 60000, now: () => now });
    limiter.check('a');
    expect(limiter.check('b')).toEqual({ allowed: true, retryAfterMs: 0 });
  });
});
