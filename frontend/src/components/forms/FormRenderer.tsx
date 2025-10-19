'use client';

import { useState } from 'react';
import { Form, FormField } from '@/types';
import { DynamicField } from './DynamicField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface FormRendererProps {
  form: Form;
  onSubmit: (responses: Record<string, unknown>) => Promise<void>;
}

export function FormRenderer({ form, onSubmit }: FormRendererProps) {
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    form.fields.forEach((field: FormField) => {
      if (field.mand && !responses[field.fieldId]) {
        newErrors[field.fieldId] = `${field.displayName} is required`;
      }

      // Email validation
      if (field.type === 'EMAIL' && responses[field.fieldId]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(responses[field.fieldId] as string)) {
          newErrors[field.fieldId] = 'Invalid email address';
        }
      }

      // Phone validation (basic)
      if (field.type === 'PHONE' && responses[field.fieldId]) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(responses[field.fieldId] as string)) {
          newErrors[field.fieldId] = 'Invalid phone number';
        }
      }

      // Custom validation
      if (field.validation) {
        const value = responses[field.fieldId] as string;
        if (value) {
          if (field.validation.minLength && value.length < field.validation.minLength) {
            newErrors[field.fieldId] = `Minimum ${field.validation.minLength} characters required`;
          }
          if (field.validation.maxLength && value.length > field.validation.maxLength) {
            newErrors[field.fieldId] = `Maximum ${field.validation.maxLength} characters allowed`;
          }
          if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
            newErrors[field.fieldId] = 'Invalid format';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(responses);
      toast.success('Form submitted successfully!');
      // Reset form
      setResponses({});
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">{form.formName}</CardTitle>
        {form.description && (
          <CardDescription className="text-base">{form.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-12">
          {form.fields.map((field: FormField) => (
            <DynamicField
              key={field.fieldId}
              field={field}
              value={responses[field.fieldId]}
              onChange={(value) => handleFieldChange(field.fieldId, value)}
              error={errors[field.fieldId]}
            />
          ))}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResponses({})}
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
