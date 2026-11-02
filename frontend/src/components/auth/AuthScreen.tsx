'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { useAuth } from '@/hooks/useAuth';

type AuthMethod = 'password' | 'email-link';

export function AuthScreen({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const { login, signup, requestMagicLink } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [method, setMethod] = useState<AuthMethod>('password');
  const [sentTo, setSentTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEmailLink = method === 'email-link';

  function switchMethod(next: AuthMethod) {
    setMethod(next);
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
      <aside className="auth-story"><Brand /><div className="auth-story-copy"><div className="section-icon"><Sparkles size={21} /></div><h2>A good question<br />is the start of<br />something great.</h2><p>From your first idea to your next response. A little help from AI, a lot more room to create.</p><div className="auth-story-steps"><span><Check size={17} /> Describe your idea in your own words</span><span><Check size={17} /> Make every question your own</span><span><Check size={17} /> Share a link. Bring answers together.</span></div></div><p className="auth-story-footer">Less setup. More finding out.</p></aside>
      <section className="auth-content"><div className="auth-form-wrap"><div className="auth-mobile-brand"><Brand /></div>
        {sentTo ? (
          <div className="auth-sent">
            <h1>Check your inbox</h1>
            <p className="auth-sent-copy">We sent a sign-in link to <strong>{sentTo}</strong>.</p>
            <p className="auth-sent-note">The link expires in 15 minutes.</p>
            <button type="button" className="auth-sent-change" onClick={resetSent}>Use a different email</button>
          </div>
        ) : (
          <>
            <h1>{isSignup ? 'Your next idea starts here.' : 'Good to see you again.'}</h1>
            <p>{isSignup ? 'Create an account and make your first form.' : 'Log in to your forms, ideas, and responses.'}</p>
            <div className="auth-method" role="group" aria-label="Sign-in method">
              <button type="button" aria-pressed={method === 'password'} className={method === 'password' ? 'is-active' : ''} onClick={() => switchMethod('password')}>Password</button>
              <button type="button" aria-pressed={method === 'email-link'} className={method === 'email-link' ? 'is-active' : ''} onClick={() => switchMethod('email-link')}>Email link</button>
            </div>
            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div id="auth-error" role="alert" className="auth-error">{error}</div>}
              {isSignup && <div><label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name" placeholder="Alex Morgan" value={name} onChange={e => setName(e.target.value)} required disabled={isLoading} /></div>}
              <div><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} /></div>
              {!isEmailLink && <div><label htmlFor="password">Password</label><div className="password-input"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder={isSignup ? 'Create a password' : 'Enter your password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={isSignup ? 8 : undefined} disabled={isLoading} aria-describedby={isSignup ? 'password-help' : undefined} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{isSignup && <small id="password-help">Use at least 8 characters.</small>}</div>}
              {!isEmailLink && isSignup && <div><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter your password again" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={isLoading} /></div>}
              <button type="submit" className="action-button" disabled={isLoading}>{isLoading ? <><Loader2 size={17} className="animate-spin" />{isEmailLink ? 'Sending your link…' : isSignup ? 'Creating your account…' : 'Logging in…'}</> : <>{isEmailLink ? 'Email me a link' : isSignup ? 'Create account' : 'Log in'}<ArrowRight size={16} /></>}</button>
            </form>
            <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New around here?'}{' '}<Link href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create an account'}</Link></p>
          </>
        )}
      </div></section>
    </main>
  );
}
