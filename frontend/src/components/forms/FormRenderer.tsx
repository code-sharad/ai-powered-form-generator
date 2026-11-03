'use client';

import { Form, FormField } from '@/types';
import { DynamicField } from './DynamicField';
import { ConversationalForm } from './ConversationalForm';
import { useFormResponses } from './useFormResponses';
import { Button } from '@/components/arc/button/button';
import { Progress } from '@/components/arc/progress/progress';
import { ArrowRight } from 'lucide-react';

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
        <Progress
          className="pf-progress"
          value={progress}
          label={totalCount === 0 ? 'No questions yet' : `${answeredCount} of ${totalCount} answered`}
          showValue
          aria-live="polite"
        />
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
          <Button
            type="button"
            variant="ghost"
            className="pf-clear"
            onClick={clear}
            disabled={isSubmitting}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="pf-submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Submit response <ArrowRight size={15} />
          </Button>
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
