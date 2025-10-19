'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { FormPreviewModal } from '@/components/forms/FormPreviewModal';
import { Form, Submission } from '@/types';
import { formService } from '@/services/formService';
import { submissionService } from '@/services/submissionService';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Loader2, Share2, Eye, Mail, Calendar, FileText, Download, BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const loadForm = useCallback(async () => {
    try {
      const data = await formService.getFormById(formId);
      setForm(data);
    } catch (error) {
      console.error('Failed to load form:', error);
      toast.error('Failed to load form');
      router.push('/dashboard/forms');
    } finally {
      setIsLoading(false);
    }
  }, [formId, router]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleSave = async (updatedForm: Partial<Form>) => {
    try {
      const updated = await formService.updateForm(formId, updatedForm);
      setForm(updated);
      toast.success('Form updated successfully!');
    } catch (error) {
      console.error('Failed to save form:', error);
      throw error;
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const loadSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const data = await submissionService.getFormSubmissions(formId);
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!form) return;

    try {
      if (form.sharing?.isPublic) {
        // Unpublish
        await formService.publishForm(formId);
        toast.success('Form unpublished');
      } else {
        // Publish
        await formService.publishForm(formId);
        toast.success('Form published!');
      }
      await loadForm();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      toast.error('Failed to update form');
    }
  };

  const handleShareForm = () => {
    if (!form) return;

    if (!form.sharing?.isPublic) {
      toast.error('Please publish the form first');
      return;
    }
    const url = `${window.location.origin}/forms/${form.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Form link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#000000] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#a1a1a1]" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!form) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#000000] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Form not found</h2>
            <p className="text-[13px] text-[#a1a1a1] mb-6">The form you&apos;re looking for doesn&apos;t exist</p>
            <Link href="/dashboard">
              <Button className="h-9 px-4 text-[13px] bg-white text-black hover:bg-[#fafafa]">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#000000]">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[#333333] bg-[#000000]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-[13px] text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a]"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back
                  </Button>
                </Link>
                <div className="h-4 w-px bg-[#333333]" />
                <div>
                  <h1 className="text-sm font-semibold text-white">{form.formName}</h1>
                  <p className="text-[11px] text-[#a1a1a1]">Form Editor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePublishToggle}
                  className={`h-8 px-3 text-[13px] font-medium ${form.sharing?.isPublic
                      ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
                      : "text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a] border border-[#333333]"
                    }`}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  {form.sharing?.isPublic ? "Published" : "Publish"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShareForm}
                  disabled={!form.sharing?.isPublic}
                  className="h-8 px-3 text-[13px] text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a] border border-[#333333] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0a0a0a] p-1 mb-8 border border-[#333333]">
              <TabsTrigger
                value="questions"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#a1a1a1] hover:text-white"
              >
                Questions
              </TabsTrigger>
              <TabsTrigger
                value="responses"
                onClick={loadSubmissions}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#a1a1a1] hover:text-white"
              >
                Responses
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                onClick={loadSubmissions}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#a1a1a1] hover:text-white"
              >
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions">
              <FormBuilder
                initialForm={form}
                onSave={handleSave}
                onPreview={handlePreview}
              />
            </TabsContent>

            <TabsContent value="responses">
              {isLoadingSubmissions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#a1a1a1]" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#333333] mb-4">
                    <FileText className="h-7 w-7 text-[#a1a1a1]" />
                  </div>
                  <p className="text-white text-base font-medium">No responses yet</p>
                  <p className="text-[#a1a1a1] text-[13px] mt-1.5">Responses will appear here once users submit the form</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-3">
                  {submissions.map((submission, index) => (
                    <AccordionItem
                      key={submission._id}
                      value={submission._id}
                      className="border border-[#333333] rounded-lg overflow-hidden hover:border-[#444444] transition-colors bg-[#0a0a0a]"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-[#333333]">
                        <div className="flex items-center justify-between w-full pr-3">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] font-semibold text-white tracking-tight">
                                Response #{index + 1}
                              </span>
                            </div>
                            {submission.submitterEmail && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-[#666666]" />
                                <span className="text-[13px] text-[#a1a1a1]">{submission.submitterEmail}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-[#666666]" />
                              <span className="text-[13px] text-[#888888]">
                                {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-6 pb-5 pt-4">
                        <div className="space-y-0 divide-y divide-[#333333]">
                          {Object.entries(submission.responses).map(([fieldId, value]) => {
                            const field = form.fields.find(f => f.fieldId === fieldId);
                            if (!field) return null;

                            return (
                              <div key={fieldId} className="py-4 first:pt-0 last:pb-0">
                                <div className="flex items-start gap-8">
                                  <div className="min-w-[180px]">
                                    <p className="text-[13px] font-medium text-[#a1a1a1] tracking-tight">
                                      {field.displayName}
                                    </p>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[13px] text-white leading-relaxed">
                                      {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {submission.uploadedImages && submission.uploadedImages.length > 0 && (
                            <div className="py-4">
                              <div className="flex items-start gap-8">
                                <div className="min-w-[180px]">
                                  <p className="text-[13px] font-medium text-[#a1a1a1] tracking-tight">
                                    Uploaded Files
                                  </p>
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap gap-2">
                                    {submission.uploadedImages.map((image, idx) => (
                                      <a
                                        key={image.cloudinaryPublicId}
                                        href={image.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 border border-[#333333] rounded-md text-[13px] text-[#a1a1a1] hover:border-[#444444] hover:bg-[#1a1a1a] hover:text-white transition-all"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        <span>File {idx + 1}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              {isLoadingSubmissions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#a1a1a1]" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Responses */}
                    <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6 hover:border-[#444444] transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <BarChart3 className="h-4 w-4 text-blue-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{submissions.length}</p>
                        <p className="text-[13px] text-[#a1a1a1] mt-1">Total Responses</p>
                      </div>
                    </div>

                    {/* Total Views */}
                    <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6 hover:border-[#444444] transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Users className="h-4 w-4 text-purple-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {form.submissionStats?.count || 0}
                        </p>
                        <p className="text-[13px] text-[#a1a1a1] mt-1">Form Views</p>
                      </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6 hover:border-[#444444] transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {submissions.length > 0 ? '100%' : '0%'}
                        </p>
                        <p className="text-[13px] text-[#a1a1a1] mt-1">Completion Rate</p>
                      </div>
                    </div>

                    {/* Last Response */}
                    <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6 hover:border-[#444444] transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                            <Clock className="h-4 w-4 text-orange-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {submissions.length > 0
                            ? new Date(submissions[0].submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '-'
                          }
                        </p>
                        <p className="text-[13px] text-[#a1a1a1] mt-1">Last Response</p>
                      </div>
                    </div>
                  </div>



                  {/* Field Response Distribution */}
                  <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6">
                    <h3 className="text-base font-semibold text-white mb-4">
                      Field Response Distribution
                    </h3>
                    {submissions.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-[#333333] mx-auto mb-3" />
                        <p className="text-[#a1a1a1] text-[13px]">
                          No responses to analyze
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {form.fields.slice(0, 5).map((field) => {
                          const responseCount = submissions.filter(
                            (sub) => sub.responses[field.fieldId]
                          ).length;
                          const percentage = Math.round((responseCount / submissions.length) * 100);

                          return (
                            <div key={field.fieldId} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[13px] font-medium text-white">
                                  {field.displayName}
                                </p>
                                <span className="text-[11px] text-[#a1a1a1]">
                                  {responseCount}/{submissions.length} ({percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-[#1a1a1a] rounded-full h-2 border border-[#333333]">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Preview Modal */}
        <FormPreviewModal
          form={form}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
