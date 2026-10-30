'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, FileText, GripVertical, LayoutGrid, ListChecks, MessageSquare, Plus, Sparkles } from 'lucide-react';

const samples = [
  { label: 'Event registration', title: 'Design community meetup', description: 'Good people. New perspectives. Save your place at our next meetup.', question: 'What would you like to explore?', options: ['Product design', 'Creative coding', 'A bit of everything'] },
  { label: 'Customer feedback', title: 'Help shape what’s next.', description: 'Tell us what’s working and where we can make things better.', question: 'How was your experience?', options: ['Excellent', 'Good', 'Could be better'] },
  { label: 'Job application', title: 'Build something meaningful.', description: 'We’d love to learn a little about you and the way you work.', question: 'Your preferred way to work?', options: ['Remote', 'Hybrid', 'In the office'] },
];

export function ProductPreview() {
  const [active, setActive] = useState(0);
  const [selection, setSelection] = useState('');
  const sample = samples[active];

  return (
    <div className="product-stage">
      <div className="product-frame">
        <aside className="preview-sidebar" aria-label="Example templates">
          <div className="preview-workspace"><span className="preview-workspace-icon">s</span> Studio workspace <ChevronDown size={12} /></div>
          <span className="preview-nav-item"><LayoutGrid size={14} /> Overview</span>
          <span className="preview-nav-item current"><FileText size={14} /> All forms <span>3</span></span>
          <span className="preview-nav-item"><MessageSquare size={14} /> Responses</span>
          <div className="preview-sidebar-label">Explore a form</div>
          {samples.map((item, index) => <button type="button" key={item.label} className={`preview-nav-item ${active === index ? 'selected' : ''}`} aria-pressed={active === index} onClick={() => { setActive(index); setSelection(''); }}><span className={`template-dot dot-${index}`} />{item.label}</button>)}
          <Link href="/signup" className="preview-new"><Plus size={14} /> Create a form</Link>
          <div className="preview-account"><span className="preview-avatar">S</span><div>Studio workspace<small>Personal workspace</small></div></div>
        </aside>
        <div className="preview-workbench">
          <div className="workbench-top"><span>All forms <span className="breadcrumb-slash">/</span> <strong>{sample.label}</strong></span><span className="preview-saved"><Check size={12} /> Example form</span></div>
          <div className="workbench-toolbar"><span><ListChecks size={14} /> Form editor</span><span className="workbench-mode">Interactive preview</span><Link href="/signup" className="preview-publish">Create your own <ArrowRight size={12} /></Link></div>
          <div className="workbench-canvas">
            <div className="preview-ai-message"><span className="preview-ai-icon"><Sparkles size={15} /></span><p>A form for your next big idea.<span>Start with a prompt. Make every detail yours.</span></p><Check size={14} /></div>
            <div className="product-form" key={sample.label}>
              <span className="product-form-symbol"><ListChecks size={23} strokeWidth={1.5} /></span>
              <h2>{sample.title}</h2><p>{sample.description}</p>
              <div className="product-form-fields"><label htmlFor="hero-name">Full name <span>*</span></label><input id="hero-name" placeholder="Alex Morgan" autoComplete="off" /><label htmlFor="hero-email">Email address <span>*</span></label><input id="hero-email" type="email" placeholder="alex@studio.com" autoComplete="off" /><fieldset><legend>{sample.question}</legend><div className="product-options">{sample.options.map(option => <label key={option}><input type="radio" name="hero-interest" checked={selection === option} onChange={() => setSelection(option)} /><span>{option}</span></label>)}</div></fieldset></div>
              <Link href="/signup" className="product-form-cta">Make a form like this <ArrowRight size={13} /></Link>
              <span className="product-form-note">Interactive example · No responses are collected</span>
              <span className="preview-field-handle" aria-hidden="true"><GripVertical size={14} /></span>
            </div>
          </div>
        </div>
      </div>
      <div className="product-caption"><span><span className="status-dot" /> From a few words to a form that works.</span><span>Made for your next question.</span></div>
    </div>
  );
}
