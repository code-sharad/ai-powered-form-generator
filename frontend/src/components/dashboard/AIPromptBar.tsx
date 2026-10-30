'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { formService } from '@/services/formService';
import toast from 'react-hot-toast';

type AIPromptBarProps = {
  onGenerated?: () => void;
  compact?: boolean;
};

export function AIPromptBar({ onGenerated, compact = false }: AIPromptBarProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    if (!prompt.trim()) {
      toast.error('Please describe the form you want to create');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await formService.generateForm({ query: prompt });

      if (response.success && response.data) {
        toast.success('Form generated successfully!');
        setPrompt('');
        // Notify parent to refresh forms list
        onGenerated?.();
      } else {
        toast.error('Failed to generate form');
      }
    } catch (error) {
      console.error('Form generation error:', error);
      toast.error('Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
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
      <h2 className={compact ? 'sr-only' : 'prompt-panel-heading'} id="prompt-title"><Sparkles size={19} /> What would you like to create?</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="form-prompt" className="sr-only">Describe your form</label>
          <textarea
            id="form-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={compact ? 'Describe the form you want to create…' : 'A registration form for a design workshop, with name, email, and experience level…'}
            rows={compact ? 2 : 3}
            disabled={isGenerating}
          />
          <div className="prompt-panel-footer">{!compact && <span>Describe your idea. AI takes care of the first draft.</span>}<button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="action-button small"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate form <ArrowRight size={15} />
              </>
            )}
          </button></div>
        </form>
        {!compact && <div className="prompt-examples" role="group" aria-label="Suggested prompts">{[
          ['Event registration', 'Create an event registration form with name, email, and dietary preferences.'],
          ['Customer feedback', 'Create a customer feedback form with name, email, a satisfaction rating, and comments.'],
          ['Job application', 'Create a job application form with full name, email, experience, and a resume upload.'],
        ].map(([label, value]) => <button key={label} type="button" disabled={isGenerating} onClick={() => { setPrompt(value); document.getElementById('form-prompt')?.focus(); }}>{label}</button>)}</div>}
    </section>
  );
}
