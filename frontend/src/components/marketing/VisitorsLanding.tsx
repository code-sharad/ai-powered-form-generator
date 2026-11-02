'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Check, ChevronDown, Copy, GripVertical,
  Menu, Plus, Sparkles, Star, Upload, X,
} from 'lucide-react';
import { Brand } from '@/components/layout/Brand';

/* Product media. Drop a file in PRODUCT_VIDEO_SRC and the still is replaced. */
const PRODUCT_VIDEO_SRC = '';
const PRODUCT_VIDEO_POSTER = '';

const heroFields = [
  { label: 'Full name', type: 'Short answer', required: true },
  { label: 'Email address', type: 'Email', required: true },
  { label: 'What brings you?', type: 'Multiple choice' },
  { label: 'Dietary preferences', type: 'Dropdown' },
];

function Sparkline() {
  return (
    <svg viewBox="0 0 700 145" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="lp-chart-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".16" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 110 C48 110 62 68 116 75 S186 115 233 98 S300 35 350 47 S420 95 466 73 S535 23 583 32 S650 8 700 8 L700 145 L0 145Z" fill="url(#lp-chart-fill)" />
      <path d="M0 110 C48 110 62 68 116 75 S186 115 233 98 S300 35 350 47 S420 95 466 73 S535 23 583 32 S650 8 700 8" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

function HeroMedia() {
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    setCanPlay(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (PRODUCT_VIDEO_SRC) {
    return (
      <figure className="lp-media">
        <video
          className="lp-media-video"
          src={PRODUCT_VIDEO_SRC}
          poster={PRODUCT_VIDEO_POSTER || undefined}
          autoPlay={canPlay}
          muted
          loop
          playsInline
          controls
          aria-label="A short look at building a form, publishing its link, and reading responses in Formora"
        />
      </figure>
    );
  }

  return (
    <figure className="lp-media">
      <div className="lp-media-stage">
        <div className="lp-media-left">
          <div className="lp-media-prompt">
            <span>A registration form for our design community meetup</span>
            <span className="lp-media-generate"><Sparkles size={12} aria-hidden="true" /> Generate</span>
          </div>
          {heroFields.map((field) => (
            <div key={field.label} className="lp-demo-field">
              <GripVertical size={13} aria-hidden="true" />
              <span className="lp-demo-field-label">
                {field.label}
                {field.required && <span className="lp-req" aria-label="required">*</span>}
              </span>
              <span className="lp-demo-field-type">{field.type}</span>
            </div>
          ))}
          <div className="lp-demo-field lp-demo-add">
            <Plus size={13} aria-hidden="true" /> Add a question
          </div>
        </div>
        <div className="lp-media-right">
          <div className="lp-publish-row">
            <span className="lp-live-dot" aria-hidden="true" />
            <span className="lp-publish-status">Published</span>
            <span className="lp-publish-link">/forms/design-meetup</span>
          </div>
          <div className="lp-media-chart">
            <div className="lp-media-chart-head">
              <span>Responses</span>
              <span className="lp-sample-tag">Sample data</span>
            </div>
            <Sparkline />
            <div className="lp-media-chart-days">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */

function RatingPreview() {
  const [value, setValue] = useState(4);
  return (
    <div className="lp-ft-stars" role="radiogroup" aria-label="Sample rating field">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`Rate ${n} out of 5`} aria-pressed={n <= value} onClick={() => setValue(n)}>
          <Star size={15} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

function FieldTypeGrid() {
  return (
    <>
      <div className="lp-ft-grid">
        <div className="lp-ft"><span className="lp-ft-name">Short answer</span><span className="lp-ft-input">Alex Morgan</span></div>
        <div className="lp-ft"><span className="lp-ft-name">Long answer</span><span className="lp-ft-input lp-ft-area"><i /><i /><i /></span></div>
        <div className="lp-ft"><span className="lp-ft-name">Email</span><span className="lp-ft-input">alex@studio.com</span></div>
        <div className="lp-ft"><span className="lp-ft-name">Dropdown</span><span className="lp-ft-input">Choose one <ChevronDown size={13} /></span></div>
        <div className="lp-ft"><span className="lp-ft-name">Multiple choice</span><span className="lp-ft-pills"><span className="on">Design</span><span>Code</span><span>Both</span></span></div>
        <div className="lp-ft"><span className="lp-ft-name">Rating</span><RatingPreview /></div>
        <div className="lp-ft"><span className="lp-ft-name">File upload</span><span className="lp-ft-drop"><Upload size={13} /> Drop a file</span></div>
        <div className="lp-ft"><span className="lp-ft-name">Grid</span><span className="lp-ft-matrix">{Array.from({ length: 9 }, (_, n) => <i key={n} className={n === 4 ? 'on' : ''} />)}</span></div>
      </div>
      <p className="lp-ft-note">Also: name, phone, address, date, radio, checkbox.</p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Publish + responses mocks.                                        */
/* ------------------------------------------------------------------ */

function PublishMock() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText('https://your-domain.com/forms/design-meetup');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="lp-publish-mock">
      <div className="lp-publish-row">
        <span className="lp-live-dot" aria-hidden="true" />
        <span className="lp-publish-status">Published</span>
        <span className="lp-publish-link">/forms/design-meetup</span>
        <button type="button" onClick={copy} aria-label="Copy form link">
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <ul className="lp-publish-where">
        <li><Check size={13} /> Paste it in an email or a chat</li>
        <li><Check size={13} /> Add it to a bio, a deck, or a QR code</li>
        <li><Check size={13} /> Unpublish anytime and the link stops accepting answers</li>
      </ul>
      <p className="lp-publish-foot">Links never expire. Unpublish whenever you want.</p>
    </div>
  );
}

function AnalyticsMock() {
  return (
    <div className="lp-analytics">
      <div className="lp-analytics-head">
        <span>Responses</span>
        <span className="lp-sample-tag">Sample data</span>
      </div>
      <div className="lp-analytics-metrics">
        <div><span>Total</span><strong>128</strong></div>
        <div><span>This week</span><strong>29</strong></div>
        <div><span>Questions</span><strong>4</strong></div>
      </div>
      <div className="lp-analytics-chart" role="img" aria-label="Illustrative chart of responses over seven days: 8, 16, 11, 22, 17, 25, and 29.">
        <Sparkline />
        <div>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
      </div>
      <p className="lp-analytics-note">Slice by day, month, or year in the real dashboard. Uploaded files arrive alongside each response.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const faqs: [string, string][] = [
  ['What can I build with Formora?', 'Registration forms, feedback surveys, job applications, order forms, appointment requests, and anything else you can describe in a sentence. The AI drafts the questions; you keep full editorial control.'],
  ['Which field types are available?', 'Fourteen: short and long answer, name, email, phone, address, date, dropdown, radio, checkbox, multiple choice, grid, rating, and file upload.'],
  ['Can I change what the AI generates?', 'Yes — the generated form is a first draft. Rename questions, drag them into a new order, mark fields required, add validation, or add and remove fields entirely.'],
  ['How do I share a form?', 'Publish it from your workspace and copy the public link. Share it anywhere. You can unpublish at any time, and the link stops accepting responses immediately.'],
  ['Where do responses go?', 'Into your dashboard. Review individual submissions, or open Analytics to chart responses by day, month, or year. Uploaded files are stored with each submission.'],
  ['Is the product view on this page real?', 'It is a still of the product, not a live account. Create one to generate a form, publish its link, and collect real responses.'],
];

const steps: [string, string, string][] = [
  ['01', 'Describe it.', 'One sentence is enough. AI drafts the title, description, and questions.'],
  ['02', 'Shape it.', 'Edit every field in the visual builder — reorder, require, validate.'],
  ['03', 'Share it.', 'Publish, copy the link, and watch responses collect in your dashboard.'],
];

export function VisitorsLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="visitors-site lp">
      <a href="#main" className="skip-link">Skip to content</a>

      <header className="lp-header">
        <div className="lp-nav">
          <Brand />
          <nav aria-label="Main navigation">
            <a href="#field-types">Field types</a>
            <a href="#builder">Builder</a>
            <a href="#responses">Responses</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="lp-nav-actions">
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="lp-nav-cta">Get started</Link>
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
            <a href="#field-types" onClick={() => setMenuOpen(false)}>Field types</a>
            <a href="#builder" onClick={() => setMenuOpen(false)}>Builder</a>
            <a href="#responses" onClick={() => setMenuOpen(false)}>Responses</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Get started</Link>
          </nav>
        )}
      </header>

      <main id="main">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <h1>A form builder that starts with a sentence.</h1>
            <p className="lp-hero-sub">
              Describe what you need to ask. Formora drafts the questions —
              then you refine every field, publish a link, and watch the answers come in.
            </p>
            <div className="lp-hero-actions">
              <Link className="lp-button" href="/signup">Create your first form <ArrowRight size={14} /></Link>
              <a className="lp-button lp-button-quiet" href="#how-it-works">See how it works</a>
            </div>
            <p className="lp-hero-note"><Check size={13} /> No code. Your words are the setup.</p>
          </div>
          <HeroMedia />
        </section>

        <div className="lp-usecases" aria-label="What you can create">
          <span className="lp-usecases-label">One builder, every kind of ask</span>
          <div>
            {['Feedback', 'Sign-ups', 'Applications', 'Surveys', 'Orders', 'Appointments'].map((item) => (
              <span key={item} className="lp-chip"><Check size={12} /> {item}</span>
            ))}
          </div>
        </div>

        <section id="field-types" className="lp-section">
          <div className="lp-section-head">
            <h2>Fourteen ways to ask.</h2>
            <p>From a one-line answer to a file upload, every type below ships in the builder today.</p>
          </div>
          <FieldTypeGrid />
        </section>

        <section id="builder" className="lp-section lp-split">
          <div className="lp-split-copy">
            <h2>The draft is yours to shape.</h2>
            <p>
              AI gets you past the blank page. After that, everything is editable:
              rename questions, drag them into order, mark them required, add
              validation, or drop in new fields.
            </p>
            <ul className="lp-checklist">
              <li><Check size={14} /> Drag-and-drop reordering</li>
              <li><Check size={14} /> Required fields and validation rules</li>
              <li><Check size={14} /> Placeholders, choices, and grid options</li>
            </ul>
          </div>
          <div className="lp-builder-mock" aria-hidden="true">
            <div className="lp-builder-fields">
              {['Full name', 'Email address', 'What brings you?'].map((label, index) => (
                <div key={label} className={index === 1 ? 'lp-lifted' : ''}>
                  <GripVertical size={13} />
                  <span>{label}{index < 2 && <span className="lp-req">*</span>}</span>
                </div>
              ))}
              <span className="lp-builder-add"><Plus size={12} /> Add a question</span>
            </div>
            <div className="lp-builder-settings">
              <span className="lp-label">Field settings</span>
              <span className="lp-set-row"><span>Label</span><span className="lp-set-input">Email address</span></span>
              <span className="lp-set-row"><span>Type</span><span className="lp-set-input">Email <ChevronDown size={12} /></span></span>
              <span className="lp-set-row"><span>Required</span><span className="lp-toggle on"><i /></span></span>
              <span className="lp-set-row"><span>Validation</span><span className="lp-set-input">Must contain @</span></span>
            </div>
          </div>
        </section>

        <section id="responses" className="lp-section">
          <div className="lp-section-head">
            <h2>One link. Then answers.</h2>
            <p>
              Publish and copy the public link. Send it anywhere. Every submission
              lands in one workspace, charted by day, month, or year.
            </p>
          </div>
          <div className="lp-pair">
            <PublishMock />
            <AnalyticsMock />
          </div>
        </section>

        <section id="how-it-works" className="lp-section">
          <div className="lp-section-head">
            <h2>Three steps between you and your next form.</h2>
          </div>
          <div className="lp-steps">
            {steps.map(([number, title, body]) => (
              <article key={number}>
                <span className="lp-step-number">{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="lp-section lp-faq">
          <div className="lp-section-head">
            <h2>Straight answers.</h2>
          </div>
          <div className="lp-faq-list">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}<Plus size={15} aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-closing">
          <div className="lp-closing-inner">
            <h2>Ready to ask your first one?</h2>
            <p>Sign up, describe your form, and have a link to share within the minute.</p>
            <div className="lp-hero-actions">
              <Link href="/signup" className="lp-button lp-button-big">Create your first form <ArrowRight size={15} /></Link>
              <a className="lp-button lp-button-quiet" href="#field-types">See what you can build</a>
            </div>
            <p className="lp-closing-note"><Check size={13} /> Free to start · No card · Publish in a minute</p>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <Brand />
          <p>Describe, refine, publish, learn.<br />A simpler way to ask.</p>
        </div>
        <div>
          <h2>Product</h2>
          <a href="#field-types">Field types</a>
          <a href="#builder">Builder</a>
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
      </footer>
    </div>
  );
}
