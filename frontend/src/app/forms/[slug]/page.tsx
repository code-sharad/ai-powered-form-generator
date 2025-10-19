'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/types';
import { formService } from '@/services/formService';
import { submissionService } from '@/services/submissionService';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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

      // Try to get public form by slug
      const data = await formService.getPublicForm(slug);

      // Check if form is published
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
      // Extract uploaded files from responses
      const uploadedImages: Array<{
        fieldId: string;
        cloudinaryPublicId: string;
        url: string;
      }> = [];

      // Find all file upload fields and extract their data
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

      toast.success('Form submitted successfully!');
      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      toast.error('Failed to submit form. Please try again.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen  dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Loading form...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center text-2xl">Form Not Found</CardTitle>
            <CardDescription className="text-center">
              {error || 'The form you are looking for does not exist or is no longer available.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center text-3xl">Thank You!</CardTitle>
            <CardDescription className="text-center text-lg mt-2">
              Your response has been successfully submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-center text-muted-foreground">
              We appreciate you taking the time to fill out this form.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setIsSubmitted(false)} variant="outline">
                Submit Another Response
              </Button>
              <Button onClick={() => router.push('/')}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form submission page
  return (
    <div className="min-h-screen  dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="border-none shadow-none">
          <CardHeader className="space-y-3 pb-8">
            {/* <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-center">
                {form.formName}
              </CardTitle>
              {form.description && (
                <CardDescription className="text-center text-base">
                  {form.description}
                </CardDescription>
              )}
            </div> */}

            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-700" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {form.fields.length} {form.fields.length === 1 ? 'Question' : 'Questions'}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-700" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <FormRenderer
              form={form}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Powered by AI Form Builder</p>
        </div>
      </div>
    </div>
  );
}
