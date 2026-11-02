import { createHash, randomBytes } from 'node:crypto';

export function generateMagicLinkToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashMagicLinkToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function buildMagicLinkUrl(frontendBaseUrl: string, token: string): string {
  const base = frontendBaseUrl.replace(/\/+$/, '');
  return `${base}/auth/verify?token=${encodeURIComponent(token)}`;
}

export function resolveFrontendBaseUrl(env: { frontendUrl?: string; nodeEnv: string }): string {
  if (env.frontendUrl) return env.frontendUrl;
  if (env.nodeEnv === 'production') {
    throw new Error('FRONTEND_URL is required in production');
  }
  return 'http://localhost:3000';
}
