'use client';

import { Form, FormField } from '@/types';
import { DynamicField } from './DynamicField';
import { ConversationalForm } from './ConversationalForm';
import { useFormResponses } from './useFormResponses';
import { ArrowRight, Loader2 } from 'lucide-react';

interface FormRendererProps {
  form: Form;
  onSubmit: (responses: Record<string, unknown>) => Promise<void>;
}

function ClassicForm({ form, onSubmit }: FormRendererProps) {
  const {
    responses, errors, isSubmitting, draftRestored,
    answeredCount, totalCount, progress,
    setFieldValue, clear, submit,
  } = useFormResponses(form, onSubmit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit();
    if (!ok) {
      const firstErrorId = form.fields.find((field) => errors[field.fieldId])?.fieldId;
      if (firstErrorId) {
        document.getElementById(firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="pf-form">
      <header className="pf-form-head">
        {form.category && form.category !== 'custom' && <p className="pf-kicker">{form.category}</p>}
        <h1>{form.formName}</h1>
        {form.description && <p>{form.description}</p>}
        <div className="pf-progress-meta">
          <span>{totalCount} {totalCount === 1 ? 'question' : 'questions'}</span>
          <span aria-live="polite">{answeredCount} answered</span>
        </div>
        <div className="pf-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Form completion">
          <span style={{ width: `${progress}%` }} />
        </div>
        {draftRestored && <p className="pf-draft-note">Picked up where you left off.</p>}
      </header>

      <form onSubmit={handleSubmit} className="pf-fields" noValidate>
        {form.fields.map((field: FormField) => (
          <DynamicField
            key={field.fieldId}
            field={field}
            value={responses[field.fieldId]}
            onChange={(value) => setFieldValue(field.fieldId, value)}
            error={errors[field.fieldId]}
          />
        ))}

        <div className="pf-actions">
          <button type="button" className="pf-clear" onClick={clear} disabled={isSubmitting}>
            Clear
          </button>
          <button type="submit" className="pf-submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting…</>
            ) : (
              <>Submit response <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function FormRenderer({ form, onSubmit }: FormRendererProps) {
  if (form.presentation === 'conversational') {
    return <ConversationalForm form={form} onSubmit={onSubmit} />;
  }
  return <ClassicForm form={form} onSubmit={onSubmit} />;
}
