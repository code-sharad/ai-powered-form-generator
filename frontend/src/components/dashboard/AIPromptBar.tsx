'use client';

import { useId, useRef, useState } from 'react';
import { ArrowRight, CircleAlert, Sparkles, Loader2, Wifi, WifiOff } from 'lucide-react';
import { formService, type GenerationRequestError } from '@/services/formService';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import toast from 'react-hot-toast';

type AIPromptBarProps = {
  onGenerated?: () => void;
  compact?: boolean;
};

type GenerationState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'succeeded' }
  | { status: 'failed'; reason: 'validation' | Exclude<GenerationRequestError, 'session'> };

const failureMessages = {
  validation: 'Please describe the form you want to create.',
  network: 'Couldn’t reach the server. Your prompt is still here. Check your connection and try again.',
  timeout: 'This is taking longer than expected. Your form may already exist. Check your forms list before trying again.',
  request: 'Couldn’t generate your form. Your prompt is still here. Please try again.',
};

export function AIPromptBar({ onGenerated, compact = false }: AIPromptBarProps) {
  const [prompt, setPrompt] = useState('');
  const [generation, setGeneration] = useState<GenerationState>({ status: 'idle' });
  const submissionLock = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noticeId = useId();
  const { connectionStatus, acknowledgeReconnect } = useConnectionStatus();
  const isGenerating = generation.status === 'pending';
  const isOffline = connectionStatus === 'offline';
  const isInvalid = generation.status === 'failed' && generation.reason === 'validation';
  const notice = isOffline
    ? { role: 'status', message: 'You’re offline. Keep writing; you can generate when you’re back online.', Icon: WifiOff }
    : isGenerating
      ? { role: 'status', message: 'Creating your form. This may take a moment.', Icon: Sparkles }
      : connectionStatus === 'reconnected'
        ? { role: 'status', message: 'You’re back online. Review your prompt and generate when you’re ready.', Icon: Wifi }
        : generation.status === 'failed'
          ? { role: 'alert', message: failureMessages[generation.reason], Icon: CircleAlert }
          : null;

  function editPrompt(value: string) {
    setPrompt(value);
    setGeneration({ status: 'idle' });
    acknowledgeReconnect();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submissionLock.current || isOffline || !navigator.onLine) return;

    acknowledgeReconnect();
    if (!prompt.trim()) {
      setGeneration({ status: 'failed', reason: 'validation' });
      textareaRef.current?.focus();
      return;
    }

    submissionLock.current = true;
    setGeneration({ status: 'pending' });
    const result = await formService.generateForm({ query: prompt });
    submissionLock.current = false;

    if (result.ok) {
      setGeneration({ status: 'succeeded' });
      setPrompt('');
      toast.success('Form generated successfully!');
      onGenerated?.();
    } else if (result.error === 'session') {
      setGeneration({ status: 'idle' });
    } else {
      setGeneration({ status: 'failed', reason: result.error });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section className={`prompt-panel ${compact ? 'prompt-panel-compact' : ''}`} id="create-form" aria-labelledby="prompt-title">
      <h2 className={compact ? 'sr-only' : 'prompt-panel-heading'} id="prompt-title"><Sparkles size={19} aria-hidden="true" /> What would you like to create?</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="form-prompt" className="sr-only">Describe your form</label>
          <textarea
            id="form-prompt"
            ref={textareaRef}
            value={prompt}
            onChange={(e) => editPrompt(e.target.value)}
            aria-describedby={noticeId}
            aria-invalid={isInvalid}
            aria-busy={isGenerating}
            onKeyDown={handleKeyDown}
            placeholder={compact ? 'Describe the form you want to create…' : 'A registration form for a design workshop, with name, email, and experience level…'}
            rows={compact ? 2 : 3}
            readOnly={isGenerating}
          />
          <div id={noticeId} className="prompt-notice" role={notice?.role ?? 'status'} aria-atomic="true">{notice && <><notice.Icon size={15} aria-hidden="true" /><span>{notice.message}</span></>}</div>
          <div className="prompt-panel-footer">{!compact && <span>Describe your idea. AI takes care of the first draft.</span>}<button
            type="submit"
            disabled={isGenerating || isOffline}
            className="action-button small"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Generating...
              </>
            ) : (
              <>
                Generate form <ArrowRight size={15} aria-hidden="true" />
              </>
            )}
          </button></div>
        </form>
        {!compact && <div className="prompt-examples" role="group" aria-label="Suggested prompts">{[
          ['Event registration', 'Create an event registration form with name, email, and dietary preferences.'],
          ['Customer feedback', 'Create a customer feedback form with name, email, a satisfaction rating, and comments.'],
          ['Job application', 'Create a job application form with full name, email, experience, and a resume upload.'],
        ].map(([label, value]) => <button key={label} type="button" disabled={isGenerating} onClick={() => { editPrompt(value); textareaRef.current?.focus(); }}>{label}</button>)}</div>}
    </section>
  );
}
