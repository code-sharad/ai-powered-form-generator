'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { FormPreviewModal } from '@/components/forms/FormPreviewModal';
import { Brand } from '@/components/layout/Brand';
import { Form, FormAnalytics, FormField, Pagination, Submission } from '@/types';
import { formService } from '@/services/formService';
import { submissionService } from '@/services/submissionService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/arc/tabs/tabs';
import { Button } from '@/components/arc/button/button';
import SegmentedControl from '@/components/arc/segmented-control/segmented-control';
import { Badge } from '@/components/arc/badge/badge';
import { Alert } from '@/components/arc/alert/alert';
import { EmptyState } from '@/components/arc/empty-state/empty-state';
import { Skeleton } from '@/components/arc/skeleton/skeleton';
import { MetricCard } from '@/components/arc/metric-card/metric-card';
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog';
import { ResponseChart } from '@/components/dashboard/ResponseChart';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, MessageSquare, Share2, Radio, Rows3, MessagesSquare } from 'lucide-react';
import { toast } from '@/lib/toast';
import '@/app/builder.css';
import '@/app/response-chart.css';

const PAGE_SIZE = 10;

function initials(name: string) {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  return `${(parts[0]?.[0] ?? '?').toUpperCase()}${(parts[1]?.[0] ?? '').toUpperCase()}`;
}

function answeredCount(responses: Record<string, unknown>) {
  return Object.values(responses).filter(value =>
    value !== undefined
    && value !== null
    && value !== ''
    && (!Array.isArray(value) || value.length > 0)
  ).length;
}

function identityFor(fields: FormField[], submission: Submission) {
  const nameField = fields.find(field => field.type === 'NAME');
  const emailField = fields.find(field => field.type === 'EMAIL');
  const nameAnswer = nameField ? submission.responses[nameField.fieldId] : undefined;
  const emailAnswer = emailField ? submission.responses[emailField.fieldId] : undefined;
  const email = submission.submitterEmail || (typeof emailAnswer === 'string' ? emailAnswer : '');
  const name = typeof nameAnswer === 'string' && nameAnswer.trim()
    ? nameAnswer.trim()
    : email || 'Anonymous';
  return { name, email };
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.join(' · ');
  if (value && typeof value === 'object') return 'File attached';
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function FormBuilderPage() {
  const params = useParams();
  const formId = params.formId as string;
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');

  const [responsePage, setResponsePage] = useState(1);
  const [pageResult, setPageResult] = useState<{ submissions: Submission[]; pagination: Pagination } | null>(null);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [responsesError, setResponsesError] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<Submission | null>(null);

  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(false);

  const loadForm = useCallback(async () => {
    try { setForm(await formService.getFormById(formId)); }
    catch { toast.error('Form couldn’t be loaded', 'Check your connection and try again.'); }
    finally { setIsLoading(false); }
  }, [formId]);

  useEffect(() => { loadForm(); }, [loadForm]);

  async function handleSave(updatedForm: Partial<Form>) {
    const updated = await formService.updateForm(formId, updatedForm);
    setForm(updated);
    // Questions may have changed, so the next visit to Analytics should refetch.
    setAnalytics(null);
  }

  const loadResponses = useCallback(async (nextPage: number) => {
    setIsLoadingResponses(true);
    setResponsesError(false);
    try {
      const result = await submissionService.getFormSubmissions(formId, nextPage, PAGE_SIZE);
      setPageResult(result);
      setResponsePage(nextPage);
      setSelectedResponse(null);
    } catch { setResponsesError(true); }
    finally { setIsLoadingResponses(false); }
  }, [formId]);

  const loadAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(false);
    try { setAnalytics(await submissionService.getFormAnalytics(formId)); }
    catch { setAnalyticsError(true); }
    finally { setIsLoadingAnalytics(false); }
  }, [formId]);

  function openTab(value: string) {
    setActiveTab(value);
    if (value === 'responses' && !pageResult) void loadResponses(1);
    if (value === 'analytics' && !analytics) void loadAnalytics();
  }

  async function setPresentation(presentation: 'classic' | 'conversational') {
    if (!form || isSavingMode || (form.presentation ?? 'classic') === presentation) return;
    setIsSavingMode(true);
    try {
      setForm(await formService.updateForm(formId, { presentation }));
      toast.success(presentation === 'conversational' ? 'Conversational mode on' : 'Classic mode on', presentation === 'conversational' ? 'Respondents get one question at a time.' : 'All questions appear on one page.');
    } catch { toast.error('Presentation mode couldn’t be saved', 'Try again.'); }
    finally { setIsSavingMode(false); }
  }

  async function togglePublish() {
    if (!form || isPublishing) return;
    setIsPublishing(true);
    try { await formService.publishForm(formId); toast.success(form.sharing?.isPublic ? 'Form unpublished' : 'Form published'); await loadForm(); }
    catch { toast.error('Publishing status couldn’t be updated', 'Try again.'); }
    finally { setIsPublishing(false); }
  }

  async function shareForm() {
    if (!form?.sharing?.isPublic) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/forms/${form.slug}`); toast.success('Form link copied'); }
    catch { toast.error('Couldn’t copy the link', 'Please try again.'); }
  }

  const total = pageResult?.pagination.total ?? analytics?.total ?? 0;
  const totalPages = pageResult?.pagination.totalPages ?? 1;
  const firstOnPage = total === 0 ? 0 : (responsePage - 1) * PAGE_SIZE + 1;
  const lastOnPage = pageResult ? Math.min(responsePage * PAGE_SIZE, total) : 0;
  const completion = analytics && analytics.total > 0 && form?.fields.length
    ? Math.round(form.fields.reduce((sum, field) => sum + (analytics.answerCounts[field.fieldId] ?? 0), 0) / (analytics.total * form.fields.length) * 100)
    : 0;

  return <ProtectedRoute><div className="min-h-screen bg-background">
    <header className="workspace-header"><div className="workspace-header-inner page-width"><Brand /><Link href="/dashboard" className="text-link"><ArrowLeft size={15} /> All forms</Link></div></header>
    <main className="workspace-main page-width">
      <h1 className="sr-only">{form?.formName ?? 'Form'}</h1>
      {isLoading
        ? <Skeleton label="Opening your form" lines={6} />
        : !form
          ? <EmptyState
              icon={<FileText size={24} />}
              title="We couldn’t open this form."
              description="It may have been removed, or your connection may have been interrupted."
              action={<Button variant="secondary" onClick={loadForm}>Try again</Button>}
            />
          : <>
            <div className="editor-heading">
              <div className="editor-kicker">
                <Badge tone={form.sharing?.isPublic ? 'success' : 'neutral'} dot pill>{form.sharing?.isPublic ? 'Live' : 'Draft'}</Badge>
              </div>
              <div className="editor-actions">
                <SegmentedControl
                  label="Presentation mode"
                  value={form.presentation ?? 'classic'}
                  onValueChange={value => { void setPresentation(value as 'classic' | 'conversational'); }}
                  options={[
                    { value: 'classic', label: 'Classic', accessory: <Rows3 size={13} aria-hidden="true" /> },
                    { value: 'conversational', label: 'Conversational', accessory: <MessagesSquare size={13} aria-hidden="true" /> },
                  ]}
                />
                <div className="editor-actions-buttons">
                  <Button variant="secondary" size="sm" loading={isPublishing} onClick={togglePublish}>
                    {!isPublishing && <Radio size={14} />}{form.sharing?.isPublic ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" disabled={!form.sharing?.isPublic} onClick={shareForm}>
                    <Share2 size={14} /> Copy link
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="questions" onValueChange={openTab}>
              <TabsList aria-label="Form workspace">
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="responses">Responses</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {activeTab !== 'questions' && <section className="form-identity form-identity-static" aria-label="Form details">
                <span className="form-identity-mark" aria-hidden="true">{form.formName.trim().charAt(0).toUpperCase() || 'F'}</span>
                <div className="form-identity-fields">
                  <p className="form-identity-name">{form.formName}</p>
                  {form.description && <p className="form-identity-description">{form.description}</p>}
                </div>
              </section>}

              <TabsContent value="questions">
                <FormBuilder initialForm={form} onSave={handleSave} onPreview={() => setShowPreview(true)} />
              </TabsContent>

              <TabsContent value="responses">
                {isLoadingResponses && !pageResult
                  ? <Skeleton label="Loading responses" lines={4} />
                  : responsesError
                    ? <Alert tone="danger" title="Responses couldn’t be loaded." onDismiss={() => setResponsesError(false)}>
                        <Button variant="secondary" size="sm" onClick={() => { void loadResponses(responsePage); }}>Try again</Button>
                      </Alert>
                    : !pageResult || pageResult.pagination.total === 0
                      ? <EmptyState
                          icon={<MessageSquare size={24} />}
                          title="Your next conversation starts here."
                          description="Publish your form and share the link. Every response will appear in this space."
                          action={form.sharing?.isPublic
                            ? <Button variant="secondary" onClick={shareForm}>Copy the form link</Button>
                            : <Button variant="secondary" onClick={togglePublish}>Publish this form</Button>}
                        />
                      : <div className="responses-view">
                          <div className="responses-head">
                            <div>
                              <h2>Responses</h2>
                              <p>{pageResult.pagination.total.toLocaleString()} total</p>
                            </div>
                            <span className="responses-range">Showing {firstOnPage}–{lastOnPage} of {pageResult.pagination.total.toLocaleString()}</span>
                          </div>

                          <ol className="response-list" aria-busy={isLoadingResponses}>
                            {pageResult.submissions.map((submission, index) => {
                              const { name, email } = identityFor(form.fields, submission);
                              return <li key={submission._id}>
                                <button type="button" className="response-row" onClick={() => setSelectedResponse(submission)}>
                                  <span className="response-index">#{firstOnPage + index}</span>
                                  <span className="response-avatar" aria-hidden="true">{initials(name)}</span>
                                  <span className="response-copy">
                                    <span className="response-name">{name}</span>
                                    <span className="response-meta">{email || 'No email'} · {answeredCount(submission.responses)} of {form.fields.length} answered</span>
                                  </span>
                                  <span className="response-date">{formatDateTime(submission.submittedAt)}</span>
                                  <ChevronRight className="response-chevron" size={16} aria-hidden="true" />
                                </button>
                              </li>;
                            })}
                          </ol>

                          <div className="responses-pager">
                            <Button variant="secondary" size="sm" disabled={responsePage <= 1 || isLoadingResponses} onClick={() => { void loadResponses(responsePage - 1); }}>
                              <ChevronLeft size={14} /> Previous
                            </Button>
                            <span>Page {responsePage} of {totalPages}</span>
                            <Button variant="secondary" size="sm" disabled={responsePage >= totalPages || isLoadingResponses} onClick={() => { void loadResponses(responsePage + 1); }}>
                              Next <ChevronRight size={14} />
                            </Button>
                          </div>
                        </div>}
              </TabsContent>

              <TabsContent value="analytics">
                {isLoadingAnalytics
                  ? <Skeleton label="Loading activity" lines={5} />
                  : analyticsError
                    ? <Alert tone="danger" title="Activity couldn’t be loaded." onDismiss={() => setAnalyticsError(false)}>
                        <Button variant="secondary" size="sm" onClick={() => { void loadAnalytics(); }}>Try again</Button>
                      </Alert>
                    : analytics && <>
                      <div className="analytics-view">
                        <div className="workspace-metrics">
                          <MetricCard label="Total responses" value={analytics.total} context={analytics.latestSubmittedAt ? `latest ${formatDateTime(analytics.latestSubmittedAt)}` : 'none yet'} />
                          <MetricCard label="Completion" value={completion} suffix="%" context="of questions answered" />
                          <MetricCard label="Questions" value={form.fields.length} context="in the current version" />
                        </div>

                        <section className="workspace-panel analytics-timeline" aria-labelledby="timeline-heading">
                          <div className="panel-heading">
                            <div>
                              <h2 id="timeline-heading">Responses over time</h2>
                              <p>Daily totals for the last 30 days, in UTC.</p>
                            </div>
                          </div>
                          {analytics.series.some(point => point.count > 0)
                            ? <ResponseChart data={analytics.series} periodLabel="the last 30 days" bucket="day" />
                            : <p className="panel-empty">No responses in the last 30 days.</p>}
                        </section>

                        <section className="workspace-panel" aria-labelledby="questions-heading">
                          <div className="panel-heading">
                            <div>
                              <h2 id="questions-heading">Questions</h2>
                              <p>How often each question was answered, and which choices people made.</p>
                            </div>
                          </div>
                          {form.fields.length === 0
                            ? <p className="panel-empty">Add a question to see its insights.</p>
                            : <div className="question-grid">
                                {form.fields.map(field => {
                                  const answered = analytics.answerCounts[field.fieldId] ?? 0;
                                  const percent = analytics.total > 0 ? Math.round(answered / analytics.total * 100) : 0;
                                  const distribution = Object.entries(analytics.valueCounts[field.fieldId] ?? {}).sort((a, b) => b[1] - a[1]);
                                  return <article className="question-card" key={field.fieldId}>
                                    <header>
                                      <h3>{field.displayName}</h3>
                                      <span>{percent}%</span>
                                    </header>
                                    <p>{answered.toLocaleString()} of {analytics.total.toLocaleString()} answered</p>
                                    <div className="question-meter" role="progressbar" aria-label={`${field.displayName} answer rate`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div>
                                    {distribution.length > 0 && <ul className="question-distribution" aria-label={`${field.displayName} choices`}>
                                      {distribution.slice(0, 4).map(([choice, count]) => {
                                        const share = answered > 0 ? Math.round(count / answered * 100) : 0;
                                        return <li key={choice}>
                                          <span className="distribution-label">{choice || '—'}</span>
                                          <span className="distribution-count">{count.toLocaleString()} · {share}%</span>
                                          <span className="distribution-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
                                        </li>;
                                      })}
                                      {distribution.length > 4 && <li className="distribution-more">+{distribution.length - 4} more choices</li>}
                                    </ul>}
                                  </article>;
                                })}
                              </div>}
                        </section>
                      </div>
                    </>}
              </TabsContent>
            </Tabs>

            {selectedResponse && (() => {
              const { name, email } = identityFor(form.fields, selectedResponse);
              return <Dialog open onOpenChange={open => { if (!open) setSelectedResponse(null); }}>
                <DialogContent
                  title={name}
                  description={[email, formatDateTime(selectedResponse.submittedAt)].filter(Boolean).join(' · ')}
                  className="response-dialog"
                >
                  <dl className="response-detail">
                    {form.fields.map(field => <div className="response-answer" key={field.fieldId}>
                      <dt>{field.displayName}</dt>
                      <dd>{formatValue(selectedResponse.responses[field.fieldId])}</dd>
                    </div>)}
                  </dl>
                  {selectedResponse.uploadedImages?.length ? <div className="response-files">
                    {selectedResponse.uploadedImages.map((image, index) => <a key={image.cloudinaryPublicId} href={image.url} target="_blank" rel="noopener noreferrer">
                      <Download size={13} /> File {index + 1}
                    </a>)}
                  </div> : null}
                </DialogContent>
              </Dialog>;
            })()}

            <FormPreviewModal form={form} isOpen={showPreview} onClose={() => setShowPreview(false)} />
          </>}
    </main>
  </div></ProtectedRoute>;
}
