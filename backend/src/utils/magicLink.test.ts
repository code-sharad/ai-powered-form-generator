import { describe, expect, test } from 'bun:test';
import { buildMagicLinkUrl, generateMagicLinkToken, hashMagicLinkToken, resolveFrontendBaseUrl } from './magicLink';

describe('magic link tokens', () => {
  test('generates two distinct tokens', () => {
    expect(generateMagicLinkToken()).not.toBe(generateMagicLinkToken());
  });

  test('hash is deterministic and 64 hex chars', () => {
    const raw = generateMagicLinkToken();
    expect(hashMagicLinkToken(raw)).toBe(hashMagicLinkToken(raw));
    expect(hashMagicLinkToken(raw)).toMatch(/^[0-9a-f]{64}$/);
  });

  test('hash differs from the raw token', () => {
    const raw = generateMagicLinkToken();
    expect(hashMagicLinkToken(raw)).not.toBe(raw);
  });

  test('buildMagicLinkUrl encodes the token and normalises trailing slashes', () => {
    const token = 'a b+c/d?e=f';
    expect(buildMagicLinkUrl('http://localhost:3000/', token)).toBe(
      `http://localhost:3000/auth/verify?token=${encodeURIComponent(token)}`
    );
    expect(buildMagicLinkUrl('http://localhost:3000///', 'tok')).toBe(
      'http://localhost:3000/auth/verify?token=tok'
    );
  });

  test('uses the configured frontend url when there is one', () => {
    expect(resolveFrontendBaseUrl({ frontendUrl: 'https://formora.app', nodeEnv: 'production' })).toBe(
      'https://formora.app'
    );
  });

  test('falls back to localhost only outside production', () => {
    expect(resolveFrontendBaseUrl({ nodeEnv: 'development' })).toBe('http://localhost:3000');
    expect(() => resolveFrontendBaseUrl({ nodeEnv: 'production' })).toThrow('FRONTEND_URL');
  });
});
