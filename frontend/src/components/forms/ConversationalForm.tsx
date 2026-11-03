'use client';

import { useEffect, useRef, useState } from 'react';
import { Form } from '@/types';
import { DynamicField } from './DynamicField';
import { useFormResponses, isAnswered } from './useFormResponses';
import { Button } from '@/components/arc/button/button';
import { Progress } from '@/components/arc/progress/progress';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface ConversationalFormProps {
  form: Form;
  onSubmit: (responses: Record<string, unknown>) => Promise<void>;
}

const AUTO_ADVANCE_TYPES = new Set(['RADIO', 'RATING']);

export function ConversationalForm({ form, onSubmit }: ConversationalFormProps) {
  const {
    responses, errors, isSubmitting, draftRestored,
    totalCount, setFieldValue, validateOne, clear, submit,
  } = useFormResponses(form, onSubmit);
  const [step, setStep] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const focusedStep = useRef(step);
  const autoAdvanceTimer = useRef<number | null>(null);

  const clearAutoAdvance = () => {
    if (autoAdvanceTimer.current !== null) {
      window.clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  };

  useEffect(() => () => {
    if (autoAdvanceTimer.current !== null) window.clearTimeout(autoAdvanceTimer.current);
  }, []);

  // Moving to another question should put the caret back in the respondent's way.
  useEffect(() => {
    if (focusedStep.current === step) return;
    focusedStep.current = step;
    const control = stageRef.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([type="file"]), textarea, button[role="combobox"], button[aria-haspopup="dialog"], [role="radio"], [role="checkbox"]'
    );
    control?.focus({ preventScroll: true });
  }, [step]);

  // A restored draft resumes at the first unanswered question.
  useEffect(() => {
    if (!draftRestored) return;
    const firstOpen = form.fields.findIndex((field) => !isAnswered(responses[field.fieldId]));
    if (firstOpen > 0) setStep(firstOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftRestored]);

  const field = form.fields[Math.min(step, totalCount - 1)];
  const isLast = step === totalCount - 1;
  const stepProgress = totalCount === 0 ? 0 : Math.round(((step + (isAnswered(responses[field.fieldId]) ? 1 : 0)) / totalCount) * 100);

  const advance = () => {
    clearAutoAdvance();
    if (!validateOne(field)) return;
    if (!isLast) setStep((s) => s + 1);
  };

  const goBack = () => {
    clearAutoAdvance();
    setStep((s) => Math.max(0, s - 1));
  };

  const handleChange = (value: unknown) => {
    setFieldValue(field.fieldId, value);
    if (AUTO_ADVANCE_TYPES.has(field.type) && !isLast) {
      clearAutoAdvance();
      // The selection itself satisfies validation; advance from the new value
      // rather than the response snapshot captured before this update.
      autoAdvanceTimer.current = window.setTimeout(() => {
        autoAdvanceTimer.current = null;
        setStep((s) => s + 1);
      }, 280);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA') {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        advance();
      }
      return;
    }
    if (e.key === 'Enter' && target.tagName !== 'BUTTON' && target.getAttribute('role') !== 'combobox') {
      e.preventDefault();
      advance();
    }
  };

  const handleSubmitClick = async () => {
    if (!validateOne(field)) return;
    await submit();
  };

  if (!field) return null;

  return (
    <div className="pfc" onKeyDown={handleKeyDown}>
      <header className="pfc-top">
        <span className="pfc-form-name">{form.formName}</span>
      </header>
      <Progress
        className="pfc-progress"
        value={stepProgress}
        label={`${step + 1} of ${totalCount}`}
        showValue
        aria-live="polite"
      />

      {draftRestored && (
        <p className="pf-draft-note pfc-draft">
          Picked up where you left off.
          <button type="button" onClick={() => { clear(); setStep(0); }}>
            <RotateCcw size={11} /> Start over
          </button>
        </p>
      )}

      <div className="pfc-stage" key={field.fieldId} ref={stageRef}>
        <DynamicField
          field={field}
          value={responses[field.fieldId]}
          onChange={handleChange}
          error={errors[field.fieldId]}
        />
      </div>

      <div className="pfc-actions">
        <Button
          type="button"
          variant="ghost"
          className="pf-clear"
          onClick={goBack}
          disabled={step === 0 || isSubmitting}
        >
          <ArrowLeft size={14} /> Back
        </Button>
        <span className="pfc-hint">
          {field.type === 'MULTI_LINE' || field.type === 'ADDRESS' ? '⌘ + Enter to continue' : 'Enter ↵ to continue'}
        </span>
        {isLast ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="pf-submit pfc-next"
            onClick={handleSubmitClick}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Submit response <ArrowRight size={15} />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="pf-submit pfc-next"
            onClick={advance}
            disabled={isSubmitting}
          >
            Continue <ArrowRight size={15} />
          </Button>
        )}
      </div>
    </div>
  );
}
