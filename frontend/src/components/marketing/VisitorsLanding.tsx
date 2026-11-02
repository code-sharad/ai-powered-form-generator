'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Check, Menu, Plus, Sparkles, Star, X,
} from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  AnalyticsPanel, CopyLink, DraftMock, FieldTypeGrid, HeroMedia,
  InsightMock, PublishMock, ShapeMock,
} from '@/components/marketing/landing-previews';

const useCases = [
  'Feedback', 'Sign-ups', 'Applications', 'Surveys', 'RSVPs',
  'Orders', 'Appointments', 'Research', 'Waitlists', 'Bug reports',
];

const steps: [string, string, string][] = [
  ['01', 'Describe it.', 'One sentence is enough. AI drafts the title, description, and the right question types.'],
  ['02', 'Shape it.', 'Drag fields into order, mark the required ones, add choices, validation, and help text.'],
  ['03', 'Share it.', 'Publish, copy the link, and watch responses collect in your dashboard.'],
];

const faqs: [string, string][] = [
  ['What can I build with Formora?', 'Registration forms, feedback surveys, job applications, order forms, appointment requests, and anything else you can describe in a sentence. The AI drafts the questions; you keep full editorial control.'],
  ['Which field types are available?', 'Fourteen: short and long answer, name, email, phone, address, date, dropdown, radio, checkbox, multiple choice, grid, rating, and file upload.'],
  ['Can I change what the AI generates?', 'Yes — the generated form is a first draft. Rename questions, drag them into a new order, mark fields required, add validation, or add and remove fields entirely.'],
  ['How do I share a form?', 'Publish it from your workspace and copy the public link. Share it anywhere. You can unpublish at any time, and the link stops accepting responses immediately.'],
  ['Where do responses go?', 'Into your dashboard. Review individual submissions, or open Analytics to chart responses by day, month, or year. Uploaded files are stored with each submission.'],
  ['Is the product view on this page real?', 'It is an illustration, not a live account. Create one to generate a form, publish its link, and collect real responses.'],
];

const navLinks = [
  { href: '#product', label: 'Product' },
  { href: '#fields', label: 'Field types' },
  { href: '#responses', label: 'Responses' },
  { href: '#faq', label: 'FAQ' },
];

export function VisitorsLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="visitors-site lp">
      <a href="#main" className="skip-link">Skip to content</a>

      <header className="lp-header">
        <div className="lp-nav">
          <Brand />
          <nav className="lp-nav-links" aria-label="Main navigation">
            {navLinks.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </nav>
          <div className="lp-nav-actions">
            <ThemeToggle />
            <Link href="/login" className="lp-login">Log in</Link>
            <Link href="/signup" className="lp-btn lp-btn--small">Start free <ArrowRight size={14} /></Link>
          </div>
          <button
            type="button"
            className="lp-menu-button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="lp-mobile-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {menuOpen && (
          <nav id="lp-mobile-nav" className="lp-mobile-nav" aria-label="Mobile navigation">
            {navLinks.map((link) => <a key={link.href} href={link.href} onClick={closeMenu}>{link.label}</a>)}
            <Link href="/login" onClick={closeMenu}>Log in</Link>
            <Link href="/signup" className="lp-btn" onClick={closeMenu}>Start free <ArrowRight size={14} /></Link>
          </nav>
        )}
      </header>

      <main id="main">
        <section className="lp-hero">
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-hero-inner">
            <p className="lp-eyebrow"><Sparkles size={12} /> Drafted by AI, finished by you</p>
            <h1>Start with a sentence.<br /><em className="lp-em">Ship a form.</em></h1>
            <p className="lp-hero-sub">
              Describe what you need to ask. Formora drafts the questions, you polish
              every field, then publish one link and watch the answers arrive.
            </p>
            <div className="lp-hero-actions">
              <Link className="lp-btn" href="/signup">Create your first form <ArrowRight size={15} /></Link>
              <a className="lp-btn lp-btn--ghost" href="#product">See how it works</a>
            </div>
            <p className="lp-hero-note">
              <span><Check size={12} /> No code</span>
              <span><Check size={12} /> No card</span>
              <span><Check size={12} /> First form in a minute</span>
            </p>
          </div>
          <HeroMedia />
        </section>

        <div className="lp-marquee" aria-label="What you can create">
          <p className="lp-marquee-label">One builder, every kind of ask</p>
          <div className="lp-marquee-track">
            {[0, 1].map((copy) => (
              <div className="lp-marquee-group" key={copy} aria-hidden={copy === 1}>
                {useCases.map((item) => (
                  <span className="lp-marquee-item" key={`${copy}-${item}`}>
                    {item}<i aria-hidden="true">✳</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section id="product" className="lp-section">
          <div className="lp-head">
            <p className="lp-kicker">One flow</p>
            <h2>From first draft to <em className="lp-em">final answer.</em></h2>
            <p>Four pieces that usually live in four tools. Here they sit in one warm workspace.</p>
          </div>
          <div className="lp-bento">
            <article className="lp-bento-card lp-bento-card--draft lp-bento-card--wide">
              <div className="lp-bento-copy">
                <span className="lp-card-kicker"><i>01</i> Draft</span>
                <h3>Nothing starts <em className="lp-em">blank.</em></h3>
                <p>Type one sentence and get a titled form with the right questions, types, and required flags. Edit anything — the draft is yours.</p>
              </div>
              <DraftMock />
            </article>

            <article className="lp-bento-card lp-bento-card--shape">
              <div className="lp-bento-copy">
                <span className="lp-card-kicker"><i>02</i> Shape</span>
                <h3>Drag, rename, <em className="lp-em">refine.</em></h3>
                <p>Reorder fields, add validation, toggle required. The builder keeps up with every change.</p>
              </div>
              <ShapeMock />
            </article>

            <article className="lp-bento-card lp-bento-card--publish">
              <div className="lp-bento-copy">
                <span className="lp-card-kicker"><i>03</i> Publish</span>
                <h3>One link, <em className="lp-em">no ceremony.</em></h3>
                <p>Publish and copy the public link. Put it anywhere you already talk to people.</p>
              </div>
              <PublishMock />
            </article>

            <article className="lp-bento-card lp-bento-card--insight lp-bento-card--wide">
              <div className="lp-bento-copy">
                <span className="lp-card-kicker"><i>04</i> Understand</span>
                <h3>Answers, not <em className="lp-em">spreadsheets.</em></h3>
                <p>Every submission lands in one dashboard, charted by day, month, or year. Uploaded files arrive with their response.</p>
              </div>
              <InsightMock />
            </article>
          </div>
        </section>

        <section id="fields" className="lp-section lp-section--fields">
          <div className="lp-head">
            <p className="lp-kicker">Field library</p>
            <h2>Fourteen ways to <em className="lp-em">ask.</em></h2>
            <p>A one-line answer, a five-star rating, a file upload — every type below ships in the builder today.</p>
          </div>
          <FieldTypeGrid />
        </section>

        <section id="responses" className="lp-band">
          <div className="lp-band-inner">
            <div className="lp-band-copy">
              <p className="lp-kicker">After you publish</p>
              <h2>One link. <em className="lp-em">Then answers.</em></h2>
              <p>Publish and copy the public link. Send it anywhere. Every submission lands in one workspace, alongside the files people upload.</p>
              <CopyLink label="Copy sample form link" />
              <ul className="lp-checklist">
                <li><Check size={14} /> Responses charted by day, month, or year</li>
                <li><Check size={14} /> Uploaded files stored with their submission</li>
                <li><Check size={14} /> Unpublish anytime and the link stops accepting</li>
              </ul>
            </div>
            <AnalyticsPanel />
          </div>
        </section>

        <section id="how" className="lp-section">
          <div className="lp-head">
            <p className="lp-kicker">How it works</p>
            <h2>Three steps to <em className="lp-em">your first form.</em></h2>
            <p>Most forms go from a sentence to a shareable link in about a minute.</p>
          </div>
          <div className="lp-steps">
            {steps.map(([number, title, body]) => (
              <article className="lp-step" key={number}>
                <span className="lp-step-number">{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="lp-section lp-faq-section">
          <div className="lp-head">
            <p className="lp-kicker">FAQ</p>
            <h2>Straight <em className="lp-em">answers.</em></h2>
          </div>
          <div className="lp-faq">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}<Plus size={15} aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-cta-section">
          <div className="lp-cta">
            <span className="lp-cta-chip lp-cta-chip--a" aria-hidden="true"><Star size={12} fill="currentColor" /> Rating</span>
            <span className="lp-cta-chip lp-cta-chip--b" aria-hidden="true">File upload</span>
            <span className="lp-cta-chip lp-cta-chip--c" aria-hidden="true"><Check size={12} /> Published</span>
            <p className="lp-kicker">Start here</p>
            <h2>Your next form is one <em className="lp-em">sentence</em> away.</h2>
            <p>Sign up free, describe what you need, and share your link in a minute.</p>
            <div className="lp-hero-actions">
              <Link href="/signup" className="lp-btn lp-btn--big">Create your first form <ArrowRight size={15} /></Link>
              <a href="#fields" className="lp-btn lp-btn--ghost">See what you can build</a>
            </div>
            <p className="lp-hero-note">
              <span><Check size={12} /> Free to start</span>
              <span><Check size={12} /> No card</span>
              <span><Check size={12} /> Publish in a minute</span>
            </p>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <Brand />
            <p>Describe, refine, publish, learn.<br />A simpler way to ask.</p>
          </div>
          <div>
            <h2>Product</h2>
            <a href="#fields">Field types</a>
            <a href="#product">Builder</a>
            <a href="#responses">Responses</a>
          </div>
          <div>
            <h2>Workspace</h2>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Create an account</Link>
            <Link href="/dashboard">Open dashboard</Link>
          </div>
          <div>
            <h2>Help</h2>
            <a href="#faq">Common questions</a>
            <a href="#main">Back to top</a>
          </div>
        </div>
        <div className="lp-footer-base">
          <span>© {new Date().getFullYear()} Formora</span>
          <span>Made for people with questions.</span>
        </div>
        <div className="lp-wordmark" aria-hidden="true"><span>Formora</span></div>
      </footer>
    </div>
  );
}
