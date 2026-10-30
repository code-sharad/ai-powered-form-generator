'use client';

import { useEffect, useRef, useState } from 'react';
import { Form, FormField } from '@/types';

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function draftKey(formId: string) {
  return `form-ai:draft:${formId}`;
}

function readDraft(form: Form): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(draftKey(form._id));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { savedAt?: unknown; responses?: unknown };
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > DRAFT_TTL_MS) return {};
    if (!parsed.responses || typeof parsed.responses !== 'object') return {};
    // Restore best-effort: keep only keys that still exist on the form.
    const validIds = new Set(form.fields.map((field) => field.fieldId));
    const restored: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.responses as Record<string, unknown>)) {
      if (validIds.has(key)) restored[key] = value;
    }
    return restored;
  } catch {
    return {};
  }
}

function writeDraft(formId: string, responses: Record<string, unknown>) {
  try {
    if (Object.keys(responses).length === 0) {
      window.localStorage.removeItem(draftKey(formId));
      return;
    }
    window.localStorage.setItem(draftKey(formId), JSON.stringify({ savedAt: Date.now(), responses }));
  } catch {
    // Storage can be unavailable (private mode) or full — drafts are a bonus, never a blocker.
  }
}

export function validateField(field: FormField, value: unknown): string | null {
  if (field.mand && !isAnswered(value)) {
    return `${field.displayName} is required`;
  }

  if (field.type === 'EMAIL' && value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
      return 'Enter a valid email address';
    }
  }

  if (field.type === 'PHONE' && value) {
    if (!/^[\d\s\-\+\(\)]+$/.test(value as string)) {
      return 'Enter a valid phone number';
    }
  }

  if (field.validation && typeof value === 'string' && value) {
    if (field.validation.minLength && value.length < field.validation.minLength) {
      return `Minimum ${field.validation.minLength} characters required`;
    }
    if (field.validation.maxLength && value.length > field.validation.maxLength) {
      return `Maximum ${field.validation.maxLength} characters allowed`;
    }
    if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
      return 'Invalid format';
    }
  }

  return null;
}

export function useFormResponses(form: Form, onSubmit: (responses: Record<string, unknown>) => Promise<void>) {
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const draft = readDraft(form);
    if (Object.keys(draft).length > 0) {
      setResponses(draft);
      setDraftRestored(true);
    }
  }, [form]);

  const answeredCount = form.fields.filter((field) => isAnswered(responses[field.fieldId])).length;
  const totalCount = form.fields.length;
  const progress = totalCount === 0 ? 0 : Math.round((answeredCount / totalCount) * 100);

  const setFieldValue = (fieldId: string, value: unknown) => {
    setResponses((prev) => {
      const next = { ...prev, [fieldId]: value };
      writeDraft(form._id, next);
      return next;
    });
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateAll = (): boolean => {
    const next: Record<string, string> = {};
    for (const field of form.fields) {
      const error = validateField(field, responses[field.fieldId]);
      if (error) next[field.fieldId] = error;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateOne = (field: FormField): boolean => {
    const error = validateField(field, responses[field.fieldId]);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[field.fieldId] = error;
      else delete next[field.fieldId];
      return next;
    });
    return !error;
  };

  const clear = () => {
    setResponses({});
    setErrors({});
    setDraftRestored(false);
    writeDraft(form._id, {});
  };

  const submit = async (): Promise<boolean> => {
    if (!validateAll()) return false;
    setIsSubmitting(true);
    try {
      await onSubmit(responses);
      setResponses({});
      writeDraft(form._id, {});
      return true;
    } catch (error) {
      // The parent surface owns error reporting (toast, inline state).
      console.error('Form submission error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    responses,
    errors,
    isSubmitting,
    draftRestored,
    answeredCount,
    totalCount,
    progress,
    setFieldValue,
    validateOne,
    clear,
    submit,
  };
}
