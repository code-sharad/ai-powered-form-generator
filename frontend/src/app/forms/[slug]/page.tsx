'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form } from '@/types';
import { formService } from '@/services/formService';
import { submissionService } from '@/services/submissionService';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicFormPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadForm = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await formService.getPublicForm(slug);

      if (!data.sharing?.isPublic) {
        setError('This form is not publicly available');
        return;
      }

      setForm(data);
    } catch (err: unknown) {
      console.error('Failed to load form:', err);
      setError('Form not found or no longer available');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleSubmit = async (responses: Record<string, unknown>) => {
    if (!form) return;

    try {
      const uploadedImages: Array<{
        fieldId: string;
        cloudinaryPublicId: string;
        url: string;
      }> = [];

      Object.entries(responses).forEach(([fieldId, value]) => {
        if (value && typeof value === 'object' && 'cloudinaryPublicId' in value) {
          const fileData = value as {
            cloudinaryPublicId: string;
            url: string;
          };
          uploadedImages.push({
            fieldId,
            cloudinaryPublicId: fileData.cloudinaryPublicId,
            url: fileData.url,
          });
        }
      });

      await submissionService.submitForm(form._id, {
        responses,
        submitterEmail: responses.email as string | undefined,
        uploadedImages: uploadedImages.length > 0 ? uploadedImages : undefined,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      toast.error('Failed to submit form. Please try again.');
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="pf pf-center" role="status" aria-label="Loading form">
        <div>
          <span className="pf-spinner" aria-hidden="true" />
          <p className="pf-loading-label">Loading form…</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="pf pf-center">
        <div className="pf-enter">
          <span className="pf-state-icon error"><AlertCircle size={26} /></span>
          <h1>This form isn’t available.</h1>
          <p>{error || 'The form you are looking for does not exist or is no longer available.'}</p>
          <div className="pf-state-actions">
            <button type="button" className="pf-button pf-button-quiet" onClick={() => router.push('/')}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="pf pf-center">
        <div className="pf-enter pf-success">
          <span className="pf-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</span>
          <span className="pf-success-check">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4.5 12.5l5 5 10-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1>Response submitted.</h1>
          <p>Thank you — your answers have been recorded.</p>
          <div className="pf-state-actions">
            <button type="button" className="pf-button" onClick={() => setIsSubmitted(false)}>
              Submit another response
            </button>
            <button type="button" className="pf-button pf-button-quiet" onClick={() => router.push('/')}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf pf-page">
      <div className="pf-column pf-enter">
        <FormRenderer form={form} onSubmit={handleSubmit} />
        <p className="pf-footer">Made with <Link href="/">Formora</Link></p>
      </div>
    </div>
  );
}
