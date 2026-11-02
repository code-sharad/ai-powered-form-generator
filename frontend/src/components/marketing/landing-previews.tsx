'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  Check, ChevronDown, Copy, GripVertical, Lock, Pause, Play, Sparkles, Star, Upload,
} from 'lucide-react';

/* Hero demo. The rendered demo film is the hero media — there is no illustrated
   fallback and no typewriter animation any more. `formora-demo.mp4` is 16:10
   (1280 × 800), which is what `.lp-video` expects, so it fills without cropping;
   if it ever fails to load, the poster still is shown instead of an empty frame. */
const PRODUCT_VIDEO_SRC = '/landing/formora-demo.mp4';
const PRODUCT_VIDEO_POSTER = '/landing/formora-demo.jpg';

function useAnimated() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setAnimated(!query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return animated;
}

export function Sparkline({ className }: { className?: string }) {
  const rawId = useId();
  const fillId = `lp-chart-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg className={className} viewBox="0 0 320 90" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 70 C20 70 32 40 54 46 S84 76 104 60 S132 22 154 30 S182 58 204 44 S236 10 258 16 S292 6 320 6 L320 90 L0 90Z"
        fill={`url(#${fillId})`}
      />
      <path
        d="M0 70 C20 70 32 40 54 46 S84 76 104 60 S132 22 154 30 S182 58 204 44 S236 10 258 16 S292 6 320 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function HeroMedia() {
  return (
    <div className="lp-hero-media">
      <div className="lp-window">
        <div className="lp-window-bar" aria-hidden="true">
          <span className="lp-dots"><i /><i /><i /></span>
          <span className="lp-window-url">
            <Lock size={10} />
            <span className="lp-window-url-text">formora.app/demo</span>
          </span>
          <span className="lp-window-live is-demo"><i /> Demo</span>
        </div>
        <HeroVideo />
      </div>

      <p className="lp-media-caption">
        <span className="lp-live-dot" aria-hidden="true" />
        Product demo · plays muted
      </p>
    </div>
  );
}

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animated = useAnimated();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!animated) {
      video.pause();
      return;
    }
    const attempt = video.play();
    if (attempt) attempt.catch(() => setPlaying(false));
  }, [animated]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setPlaying(false));
      return;
    }
    video.pause();
  };

  if (failed) {
    return (
      <div className="lp-video-frame">
        <img
          className="lp-video"
          src={PRODUCT_VIDEO_POSTER}
          alt="Formora product demo: a form drafted from one sentence, published as a link, and answering 128 times."
        />
      </div>
    );
  }

  return (
    <div className="lp-video-frame">
      <video
        ref={videoRef}
        className="lp-video"
        src={PRODUCT_VIDEO_SRC}
        poster={PRODUCT_VIDEO_POSTER || undefined}
        autoPlay={animated}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Formora product demo"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      {playing ? (
        <button type="button" className="lp-video-toggle" onClick={toggle} aria-label="Pause the product demo">
          <Pause size={12} /> Pause
        </button>
      ) : (
        <button type="button" className="lp-video-play" onClick={toggle} aria-label="Play the product demo">
          <span className="lp-video-play-icon"><Play size={18} fill="currentColor" /></span>
          <span className="lp-video-play-label">Play demo</span>
        </button>
      )}
    </div>
  );
}

export function DraftMock() {
  return (
    <div className="lp-mock lp-draft-mock" aria-hidden="true">
      <div className="lp-mini-prompt">
        <Sparkles size={13} />
        <span>A signup form for a pottery workshop</span>
        <span className="lp-mini-generate">Draft</span>
      </div>
      {[
        { label: 'Full name', type: 'Short answer', required: true },
        { label: 'Email address', type: 'Email', required: true },
        { label: 'Preferred session', type: 'Dropdown', required: false },
      ].map(({ label, type, required }, index) => (
        <div key={label} className={`lp-mini-field${index === 0 ? ' is-active' : ''}`}>
          <GripVertical size={12} />
          <span>{label}{required && <i>*</i>}</span>
          <em>{type}</em>
        </div>
      ))}
    </div>
  );
}

export function ShapeMock() {
  return (
    <div className="lp-shape" aria-hidden="true">
      <div className="lp-shape-row"><GripVertical size={12} /> Full name</div>
      <div className="lp-shape-row is-lifted"><GripVertical size={12} /> Email address <span>Required</span></div>
      <div className="lp-shape-row"><GripVertical size={12} /> What brings you?</div>
      <div className="lp-shape-setting"><span>Required field</span><span className="lp-toggle on"><i /></span></div>
    </div>
  );
}

export function CopyLink({ label = 'Copy sample form link' }: { label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText('https://formora.app/forms/design-meetup');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="lp-copylink">
      <span className="lp-copylink-dot" aria-hidden="true" />
      <span className="lp-copylink-url">formora.app/forms/design-meetup</span>
      <button type="button" onClick={copy} aria-label={label}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export function PublishMock() {
  return (
    <div className="lp-publish-mock">
      <CopyLink />
      <p className="lp-publish-note" aria-hidden="true">Paste it in an email, a chat, or a QR code.</p>
      <div className="lp-publish-meta" aria-hidden="true">
        <span className="lp-live-dot" /> Accepting responses
        <span>·</span>
        <span>Unpublish anytime</span>
      </div>
    </div>
  );
}

export function InsightMock() {
  return (
    <div className="lp-insight" aria-hidden="true">
      <div className="lp-insight-metrics">
        <div><span>Total</span><strong>128</strong></div>
        <div><span>This week</span><strong>29</strong></div>
        <div><span>Questions</span><strong>6</strong></div>
      </div>
      <div className="lp-insight-chart">
        <Sparkline />
      </div>
      <div className="lp-insight-days">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
      </div>
    </div>
  );
}

export function RatingPreview() {
  const [value, setValue] = useState(4);
  return (
    <div className="lp-rating" role="radiogroup" aria-label="Sample rating field">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`Rate ${n} out of 5`}
          onClick={() => setValue(n)}
        >
          <Star size={15} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export function FieldTypeGrid() {
  return (
    <>
      <div className="lp-fieldgrid">
        <div className="lp-fieldcard">
          <span className="lp-fieldcard-name">Short answer</span>
          <span className="lp-fieldcard-input">Alex Morgan</span>
        </div>
        <div className="lp-fieldcard">
          <span className="lp-fieldcard-name">Long answer</span>
          <span className="lp-fieldcard-input lp-fieldcard-area"><i /><i /><i /></span>
        </div>
        <div className="lp-fieldcard">
          <span className="lp-fieldcard-name">Email</span>
          <span className="lp-fieldcard-input">alex@studio.com</span>
        </div>
        <div className="lp-fieldcard">
          <span className="lp-fieldcard-name">Dropdown</span>
          <span className="lp-fieldcard-input">Choose one <ChevronDown size={13} /></span>
        </div>
        <div className="lp-fieldcard">
          <span className="lp-fieldcard-name">Multiple choice</span>
          <span className="lp-fieldcard-pills"><span className="on">Design</span><span>Code</span><span>Both</span></span>
        </div>
        <div className="lp-fieldcard">
          <span className="lp-fieldcard-name">Rating</span>
          <RatingPreview />
        </div>
        <div className="lp-fieldcard">
          <span className="lp-fieldcard-name">File upload</span>
          <span className="lp-fieldcard-drop"><Upload size={13} /> Drop a file</span>
        </div>
        <div className="lp-fieldcard">
          <span className="lp-fieldcard-name">Grid</span>
          <span className="lp-fieldcard-matrix">
            {Array.from({ length: 9 }, (_, n) => <i key={n} className={n === 4 ? 'on' : ''} />)}
          </span>
        </div>
      </div>
      <p className="lp-fieldgrid-note">Also: name, phone, address, date, radio, checkbox.</p>
    </>
  );
}

export function AnalyticsPanel() {
  return (
    <div className="lp-analytics" role="img" aria-label="Sample response dashboard: 128 responses, 29 this week, charted over seven days.">
      <div className="lp-analytics-head" aria-hidden="true">
        <span className="lp-mono">Responses</span>
        <span className="lp-sample">Sample data</span>
      </div>
      <div className="lp-analytics-total" aria-hidden="true">
        <strong>128</strong>
        <span className="lp-trend">+23 this week</span>
      </div>
      <div className="lp-analytics-chart" aria-hidden="true">
        <Sparkline />
      </div>
      <div className="lp-analytics-days" aria-hidden="true">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <ul className="lp-analytics-recent" aria-hidden="true">
        <li><span className="lp-avatar">A</span><span>Alex Morgan</span><span className="lp-when">2 min ago</span></li>
        <li><span className="lp-avatar">P</span><span>Priya Nair</span><span className="lp-when">18 min ago</span></li>
        <li><span className="lp-avatar">S</span><span>Sam Okafor</span><span className="lp-when">1 hr ago</span></li>
      </ul>
    </div>
  );
}
