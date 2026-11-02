import { config } from '@/config';
import { AppError } from '@/middlewares/errorHandler';

export type MailTransport = 'resend' | 'console' | 'unconfigured';

export function resolveMailTransport(env: { RESEND_API_KEY?: string; NODE_ENV?: string }): MailTransport {
  if (env.RESEND_API_KEY) return 'resend';
  return env.NODE_ENV === 'production' ? 'unconfigured' : 'console';
}

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail({ to, subject, text, html }: SendMailInput): Promise<void> {
  const transport = resolveMailTransport({
    RESEND_API_KEY: config.mail.resendApiKey,
    NODE_ENV: config.nodeEnv,
  });

  if (transport === 'unconfigured') {
    throw new AppError(503, 'Email delivery is not configured');
  }

  if (transport === 'console') {
    console.log(`[mailer] to=${to} subject=${subject}\n${text}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.mail.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      from: config.mail.from,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    console.error(`[mailer] resend rejected the send: ${response.status} ${detail}`);
    throw new AppError(502, 'Could not send email');
  }

  const sent = (await response.json().catch(() => undefined)) as { id?: string } | undefined;
  console.log(`[mailer] resend accepted id=${sent?.id ?? 'unknown'} to=${to}`);
}

interface SendMagicLinkEmailInput {
  to: string;
  url: string;
  expiresInMinutes: number;
}

export async function sendMagicLinkEmail({ to, url, expiresInMinutes }: SendMagicLinkEmailInput): Promise<void> {
  const text = [
    'Your Formora sign-in link',
    '',
    `Open this link to sign in: ${url}`,
    '',
    `This link expires in ${expiresInMinutes} minutes. If you did not request it, you can ignore this email.`,
  ].join('\n');

  const html = [
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#17243b">',
    '<h2 style="margin:0 0 12px;font-size:20px">Your Formora sign-in link</h2>',
    '<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#526077">Click the button below to sign in. It expires in ',
    String(expiresInMinutes),
    ' minutes.</p>',
    `<a href="${url}" style="display:inline-block;background:#245bea;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">Sign in to Formora</a>`,
    '<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#657187">If the button does not work, copy and paste this link into your browser:</p>',
    `<p style="margin:8px 0 0;font-size:12px;color:#245bea;word-break:break-all">${url}</p>`,
    '</div>',
  ].join('');

  await sendMail({ to, subject: 'Your Formora sign-in link', text, html });
}
