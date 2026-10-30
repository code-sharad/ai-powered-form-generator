'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Calendar, Check, ChevronDown, CircleCheck, Copy, GripVertical,
  Menu, PenLine, Plus, RotateCcw, Sparkles, Star, Upload, X,
} from 'lucide-react';
import { Brand } from '@/components/layout/Brand';

/* ------------------------------------------------------------------ */
/*  Hero demo: a scripted prompt-to-form generation, all client-side. */
/* ------------------------------------------------------------------ */

type DemoField = { label: string; type: string; required?: boolean };
type Scenario = { chip: string; prompt: string; fields: DemoField[] };

const scenarios: Scenario[] = [
  {
    chip: 'Meetup registration',
    prompt: 'A registration form for our design community meetup',
    fields: [
      { label: 'Full name', type: 'Short answer', required: true },
      { label: 'Email address', type: 'Email', required: true },
      { label: 'What brings you?', type: 'Multiple choice' },
      { label: 'Dietary preferences', type: 'Dropdown' },
    ],
  },
  {
    chip: 'Job application',
    prompt: 'A job application for a frontend developer role',
    fields: [
      { label: 'Full name', type: 'Short answer', required: true },
      { label: 'Email address', type: 'Email', required: true },
      { label: 'Résumé', type: 'File upload', required: true },
      { label: 'Why this role?', type: 'Long answer' },
    ],
  },
  {
    chip: 'App feedback',
    prompt: 'A feedback survey for our mobile app',
    fields: [
      { label: 'Overall rating', type: 'Rating', required: true },
      { label: 'What went well?', type: 'Long answer' },
      { label: 'Would you recommend us?', type: 'Radio' },
      { label: 'Email address', type: 'Email' },
    ],
  },
];

function HeroDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'generating' | 'done'>('typing');
  const [runId, setRunId] = useState(0);
  const skipRef = useRef(false);
  const scenario = scenarios[scenarioIndex];

  useEffect(() => {
    skipRef.current = false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedLength(scenario.prompt.length);
      setPhase('done');
      return;
    }
    setTypedLength(0);
    setPhase('typing');
    let cancelled = false;
    const timers: number[] = [];
    let i = 0;
    const step = () => {
      if (cancelled) return;
      if (skipRef.current) {
        setTypedLength(scenario.prompt.length);
        setPhase('done');
        return;
      }
      i += 1;
      setTypedLength(i);
      if (i < scenario.prompt.length) {
        timers.push(window.setTimeout(step, 26 + Math.random() * 34));
      } else {
        setPhase('generating');
        timers.push(window.setTimeout(() => { if (!cancelled) setPhase('done'); }, 1100));
      }
    };
    timers.push(window.setTimeout(step, 500));
    return () => { cancelled = true; timers.forEach(window.clearTimeout); };
  }, [scenario, runId]);

  const finishNow = () => {
    skipRef.current = true;
    setTypedLength(scenario.prompt.length);
    setPhase('done');
  };

  const statusText = phase === 'typing'
    ? 'Describe the form you need.'
    : phase === 'generating'
      ? 'AI is drafting your fields.'
      : `Draft ready: ${scenario.fields.length} fields, all editable.`;

  return (
    <div className="lp-demo" aria-label="Interactive demo: AI form generation">
      <div className="lp-demo-head">
        <span className="lp-demo-title">New form</span>
        <span className="lp-demo-note">Demo — nothing is saved</span>
      </div>
      <div className="lp-demo-chips" role="group" aria-label="Choose an example">
        {scenarios.map((item, index) => (
          <button
            key={item.chip}
            type="button"
            aria-pressed={index === scenarioIndex}
            onClick={() => { if (index === scenarioIndex) setRunId((id) => id + 1); else setScenarioIndex(index); }}
          >
            {item.chip}
          </button>
        ))}
      </div>
      <div className="lp-demo-prompt">
        <p>
          {scenario.prompt.slice(0, typedLength)}
          {phase === 'typing' && <span className="lp-caret" aria-hidden="true" />}
        </p>
        <button type="button" className="lp-demo-generate" onClick={finishNow} disabled={phase === 'done'}>
          <Sparkles size={13} /> {phase === 'done' ? 'Generated' : 'Generate'}
        </button>
      </div>
      <p className="lp-demo-status" aria-live="polite">
        {phase === 'generating' && <span className="lp-spinner" aria-hidden="true" />}
        {phase === 'done' && <CircleCheck size={13} aria-hidden="true" />}
        {statusText}
      </p>
      <div className="lp-demo-fields">
        {phase === 'generating' && [0, 1, 2].map((n) => <span key={n} className="lp-skeleton" style={{ animationDelay: `${n * 140}ms` }} />)}
        {phase === 'done' && scenario.fields.map((field, index) => (
          <div key={field.label} className="lp-demo-field" style={{ animationDelay: `${index * 110}ms` }}>
            <GripVertical size={13} aria-hidden="true" />
            <span className="lp-demo-field-label">
              {field.label}
              {field.required && <span className="lp-req" aria-label="required">*</span>}
            </span>
            <span className="lp-demo-field-type">{field.type}</span>
          </div>
        ))}
        {phase === 'done' && (
          <div className="lp-demo-field lp-demo-add" style={{ animationDelay: `${scenario.fields.length * 110}ms` }}>
            <Plus size={13} aria-hidden="true" /> Add a question
          </div>
        )}
      </div>
      <button type="button" className="lp-demo-replay" onClick={() => setRunId((id) => id + 1)}>
        <RotateCcw size={12} /> Replay
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field types: the fifteen real field types as literal previews.    */
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
    <div className="lp-ft-grid">
      <div className="lp-ft"><span className="lp-ft-name">Short answer</span><span className="lp-ft-input">Alex Morgan</span></div>
      <div className="lp-ft"><span className="lp-ft-name">Long answer</span><span className="lp-ft-input lp-ft-area"><i /><i /><i /></span></div>
      <div className="lp-ft"><span className="lp-ft-name">Email</span><span className="lp-ft-input">alex@studio.com</span></div>
      <div className="lp-ft"><span className="lp-ft-name">Phone</span><span className="lp-ft-input">+1 555 010 2244</span></div>
      <div className="lp-ft"><span className="lp-ft-name">Date</span><span className="lp-ft-input">12 June 2026 <Calendar size={13} /></span></div>
      <div className="lp-ft"><span className="lp-ft-name">Dropdown</span><span className="lp-ft-input">Choose one <ChevronDown size={13} /></span></div>
      <div className="lp-ft"><span className="lp-ft-name">Radio</span><span className="lp-ft-opts"><span className="lp-ft-radio on" /> Yes <span className="lp-ft-radio" /> No</span></div>
      <div className="lp-ft"><span className="lp-ft-name">Checkbox</span><span className="lp-ft-opts"><span className="lp-ft-check on"><Check size={10} /></span> Option A <span className="lp-ft-check" /> Option B</span></div>
      <div className="lp-ft"><span className="lp-ft-name">Multiple choice</span><span className="lp-ft-pills"><span className="on">Design</span><span>Code</span><span>Both</span></span></div>
      <div className="lp-ft"><span className="lp-ft-name">Grid</span><span className="lp-ft-matrix">{Array.from({ length: 9 }, (_, n) => <i key={n} className={n === 4 ? 'on' : ''} />)}</span></div>
      <div className="lp-ft"><span className="lp-ft-name">Rating</span><RatingPreview /></div>
      <div className="lp-ft"><span className="lp-ft-name">Signature</span><span className="lp-ft-sign"><PenLine size={13} /><svg viewBox="0 0 80 22" aria-hidden="true"><path d="M3 16 C14 3 20 21 30 10 S44 2 50 13 S66 20 77 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></span></div>
      <div className="lp-ft"><span className="lp-ft-name">File upload</span><span className="lp-ft-drop"><Upload size={13} /> Drop a file</span></div>
      <div className="lp-ft"><span className="lp-ft-name">Name</span><span className="lp-ft-input">First &nbsp;·&nbsp; Last</span></div>
      <div className="lp-ft"><span className="lp-ft-name">Address</span><span className="lp-ft-input lp-ft-area"><i /><i /></span></div>
    </div>
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
        <span className="lp-publish-link">your-domain.com/forms/design-meetup</span>
        <button type="button" onClick={copy} aria-label="Copy form link">
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="lp-publish-hint">Unpublish anytime from your workspace — the link stops accepting responses immediately.</p>
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
        <svg viewBox="0 0 700 145" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="lp-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#3056e3" stopOpacity=".18" />
              <stop offset="1" stopColor="#3056e3" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 110 C48 110 62 68 116 75 S186 115 233 98 S300 35 350 47 S420 95 466 73 S535 23 583 32 S650 8 700 8 L700 145 L0 145Z" fill="url(#lp-chart-fill)" />
          <path d="M0 110 C48 110 62 68 116 75 S186 115 233 98 S300 35 350 47 S420 95 466 73 S535 23 583 32 S650 8 700 8" fill="none" stroke="#3056e3" strokeWidth="2.5" />
        </svg>
        <div>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
      </div>
      <p className="lp-analytics-note">Slice by day, month, or year in the real dashboard. Uploaded files arrive alongside each response.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const faqs: [string, string][] = [
  ['What can I build with Formora?', 'Registration forms, feedback surveys, job applications, order forms, appointment requests, and anything else you can describe in a sentence. The AI drafts the questions; you keep full editorial control.'],
  ['Which field types are available?', 'Fifteen: short and long answer, name, email, phone, address, date, dropdown, radio, checkbox, multiple choice, grid, rating, signature, and file upload.'],
  ['Can I change what the AI generates?', 'Yes — the generated form is a first draft. Rename questions, drag them into a new order, mark fields required, add validation, or add and remove fields entirely.'],
  ['How do I share a form?', 'Publish it from your workspace and copy the public link. Share it anywhere. You can unpublish at any time, and the link stops accepting responses immediately.'],
  ['Where do responses go?', 'Into your dashboard. Review individual submissions, or open Analytics to chart responses by day, month, or year. Uploaded files are stored with each submission.'],
  ['Is the demo on this page live?', 'No. It runs entirely in your browser — nothing you type is sent or saved. Create an account to generate, publish, and collect responses to real forms.'],
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
            <p className="lp-label">AI form builder:</p>
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
          <HeroDemo />
        </section>

        <div className="lp-usecases" aria-label="What you can create">
          <span className="lp-label">One builder, every kind of ask:</span>
          <div>
            {['Feedback', 'Sign-ups', 'Applications', 'Surveys', 'Orders', 'Appointments'].map((item) => (
              <span key={item} className="lp-chip"><Check size={12} /> {item}</span>
            ))}
          </div>
        </div>

        <section id="field-types" className="lp-section">
          <div className="lp-section-head">
            <p className="lp-label">Field types:</p>
            <h2>Fifteen ways to ask.</h2>
            <p>From a one-line answer to a signature or a file upload — every field type below ships in the builder today.</p>
          </div>
          <FieldTypeGrid />
        </section>

        <section id="builder" className="lp-section lp-split">
          <div className="lp-split-copy">
            <p className="lp-label">The builder:</p>
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
              <span className="lp-label">Field settings:</span>
              <span className="lp-set-row"><span>Label</span><span className="lp-set-input">Email address</span></span>
              <span className="lp-set-row"><span>Type</span><span className="lp-set-input">Email <ChevronDown size={12} /></span></span>
              <span className="lp-set-row"><span>Required</span><span className="lp-toggle on"><i /></span></span>
              <span className="lp-set-row"><span>Validation</span><span className="lp-set-input">Must contain @</span></span>
            </div>
          </div>
        </section>

        <section id="publish" className="lp-section lp-split">
          <div className="lp-split-copy">
            <p className="lp-label">Sharing:</p>
            <h2>One link, ready when you are.</h2>
            <p>
              Publish from your workspace and copy the public link — send it in an
              email, drop it in a chat, or post it anywhere your audience is.
            </p>
          </div>
          <PublishMock />
        </section>

        <section id="responses" className="lp-section lp-split">
          <div className="lp-split-copy">
            <p className="lp-label">Responses:</p>
            <h2>Answers, not a mess.</h2>
            <p>
              Every submission lands in one workspace. Read the details response by
              response, or step back and chart the trend by day, month, or year.
            </p>
          </div>
          <AnalyticsMock />
        </section>

        <section id="how-it-works" className="lp-section">
          <div className="lp-section-head">
            <p className="lp-label">How it works:</p>
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
            <p className="lp-label">Questions:</p>
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
          <p className="lp-label">Last question:</p>
          <h2>Ready to ask your first one?</h2>
          <p>Sign up, describe your form, and have a link to share within the minute.</p>
          <Link href="/signup" className="lp-button lp-button-big">Create your first form <ArrowRight size={15} /></Link>
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
