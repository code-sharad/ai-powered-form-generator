'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, MailCheck, Sparkles } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/arc/input/input';
import { PasswordField } from '@/components/arc/password-field/password-field';
import { PasswordStrength, createPasswordRules } from '@/components/arc/password-strength/password-strength';
import SegmentedControl from '@/components/arc/segmented-control/segmented-control';
import { Button } from '@/components/arc/button/button';
import { Alert } from '@/components/arc/alert/alert';
import { EmptyState } from '@/components/arc/empty-state/empty-state';

type AuthMethod = 'password' | 'email-link';

const signupRules = createPasswordRules({ minLength: 8 });

export function AuthScreen({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const { login, signup, requestMagicLink } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [method, setMethod] = useState<AuthMethod>('password');
  const [sentTo, setSentTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEmailLink = method === 'email-link';

  function switchMethod(next: string) {
    setMethod(next as AuthMethod);
    setError('');
  }

  function resetSent() {
    setSentTo('');
    setError('');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (isEmailLink) {
      setIsLoading(true);
      try {
        const result = await requestMagicLink(isSignup ? { name, email } : { email });
        if (result.success) {
          setSentTo(email);
        } else {
          setError(result.error || 'Unable to continue. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (isSignup && password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    if (isSignup && password !== confirmPassword) { setError('Your passwords don’t match. Check both fields and try again.'); return; }
    setIsLoading(true);
    try {
      const result = isSignup ? await signup({ name, email, password }) : await login({ email, password });
      if (!result.success) setError(result.error || 'Unable to continue. Please try again.');
    } finally { setIsLoading(false); }
  }

  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-copy">
          <div className="section-icon"><Sparkles size={21} /></div>
          <h2>A good question<br />is the start of<br />something great.</h2>
          <p>From your first idea to your next response. A little help from AI, a lot more room to create.</p>
          <div className="auth-story-steps">
            <span><Check size={17} /> Describe your idea in your own words</span>
            <span><Check size={17} /> Make every question your own</span>
            <span><Check size={17} /> Share a link. Bring answers together.</span>
          </div>
        </div>
        <p className="auth-story-footer">Less setup. More finding out.</p>
      </aside>

      <section className="auth-content">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><Brand /></div>

          {sentTo ? (
            <EmptyState
              icon={<MailCheck size={24} />}
              title="Check your inbox"
              description={`We sent a sign-in link to ${sentTo}. The link expires in 15 minutes.`}
              action={<Button variant="secondary" onClick={resetSent}>Use a different email</Button>}
            />
          ) : (
            <>
              <h1>{isSignup ? 'Your next idea starts here.' : 'Good to see you again.'}</h1>
              <p>{isSignup ? 'Create an account and make your first form.' : 'Log in to your forms, ideas, and responses.'}</p>

              <SegmentedControl
                label="Sign-in method"
                className="auth-method"
                value={method}
                onValueChange={switchMethod}
                options={[
                  { value: 'password', label: 'Password' },
                  { value: 'email-link', label: 'Email link' },
                ]}
              />

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {error && <Alert tone="danger" title={error} onDismiss={() => setError('')} />}

                {isSignup && (
                  <Input
                    label="Your name"
                    name="name"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                )}

                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />

                {!isEmailLink && (isSignup ? (
                  <PasswordStrength
                    label="Password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onValueChange={value => setPassword(value)}
                    rules={signupRules}
                    shortLength={8}
                    required
                    disabled={isLoading}
                  />
                ) : (
                  <PasswordField
                    label="Password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                ))}

                {!isEmailLink && isSignup && (
                  <PasswordField
                    label="Confirm password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    description="Both passwords must match."
                    required
                    disabled={isLoading}
                  />
                )}

                <Button type="submit" size="lg" loading={isLoading} className="auth-submit">
                  {isEmailLink ? 'Email me a link' : isSignup ? 'Create account' : 'Log in'}
                </Button>
              </form>

              <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New around here?'}{' '}<Link href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create an account'}</Link></p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
