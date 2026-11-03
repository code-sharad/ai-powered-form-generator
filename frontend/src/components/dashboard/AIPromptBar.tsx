'use client';

import { useId, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { formService, type GenerationRequestError } from '@/services/formService';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Textarea } from '@/components/arc/textarea/textarea';
import { Button } from '@/components/arc/button/button';
import { Alert } from '@/components/arc/alert/alert';
import type { AlertTone } from '@/components/arc/alert/alert';
import { toast } from '@/lib/toast';

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

type Notice = { tone: AlertTone; message: string };

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

  const notice: Notice | null = isOffline
    ? { tone: 'warning', message: 'You’re offline. Keep writing; you can generate when you’re back online.' }
    : isGenerating
      ? { tone: 'info', message: 'Creating your form. This may take a moment.' }
      : connectionStatus === 'reconnected'
        ? { tone: 'success', message: 'You’re back online. Review your prompt and generate when you’re ready.' }
        : generation.status === 'failed'
          ? { tone: 'danger', message: failureMessages[generation.reason] }
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
    acknowledgeReconnect();

    if (result.ok) {
      setGeneration({ status: 'succeeded' });
      setPrompt('');
      toast.success('Form generated');
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
    <section className={`prompt-panel prompt-field ${compact ? 'prompt-panel-compact' : ''}`} id="create-form" aria-labelledby="prompt-title">
      <h2 className={compact ? 'sr-only' : 'prompt-panel-heading'} id="prompt-title"><Sparkles size={19} aria-hidden="true" /> What would you like to create?</h2>
      <form onSubmit={handleSubmit}>
        <Textarea
          ref={textareaRef}
          label="Describe your form"
          id="form-prompt"
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
        <div className="prompt-notice-slot" id={noticeId}>
          {notice && (notice.tone === 'danger'
            ? <Alert tone="danger" title={notice.message} />
            : <p className="prompt-notice" role="status">{notice.message}</p>)}
        </div>
        <div className="prompt-panel-footer">
          {!compact && <span>Describe your idea. AI takes care of the first draft.</span>}
          <Button type="submit" size="sm" loading={isGenerating} disabled={isOffline}>
            Generate form
          </Button>
        </div>
      </form>
    </section>
  );
}
