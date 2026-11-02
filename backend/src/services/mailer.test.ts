import { describe, expect, test } from 'bun:test';
import { resolveMailTransport } from './mailer';

describe('mail transport', () => {
  test('uses resend when a key is present', () => {
    expect(resolveMailTransport({ RESEND_API_KEY: 're_123' })).toBe('resend');
    expect(resolveMailTransport({ RESEND_API_KEY: 're_123', NODE_ENV: 'production' })).toBe('resend');
  });

  test('prints to the console outside production', () => {
    expect(resolveMailTransport({})).toBe('console');
    expect(resolveMailTransport({ NODE_ENV: 'development' })).toBe('console');
    expect(resolveMailTransport({ RESEND_API_KEY: '' })).toBe('console');
  });

  test('refuses to fall back to the console in production', () => {
    expect(resolveMailTransport({ NODE_ENV: 'production' })).toBe('unconfigured');
    expect(resolveMailTransport({ RESEND_API_KEY: '', NODE_ENV: 'production' })).toBe('unconfigured');
  });
});
