'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { FormPreviewModal } from '@/components/forms/FormPreviewModal';
import { Brand } from '@/components/layout/Brand';
import { Form, Submission } from '@/types';
import { formService } from '@/services/formService';
import { submissionService } from '@/services/submissionService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Loader2, Share2, Radio, FileText, Download, MessageSquare, MessagesSquare, Clock, ListChecks, Rows3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FormBuilderPage() {
  const params = useParams();
  const formId = params.formId as string;
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState(false);
  const [isSavingMode, setIsSavingMode] = useState(false);

  const loadForm = useCallback(async () => {
    try { setForm(await formService.getFormById(formId)); }
    catch { toast.error('Form couldn’t be loaded.'); }
    finally { setIsLoading(false); }
  }, [formId]);

  useEffect(() => { loadForm(); }, [loadForm]);

  async function handleSave(updatedForm: Partial<Form>) {
    const updated = await formService.updateForm(formId, updatedForm);
    setForm(updated);
  }

  async function loadSubmissions() {
    setIsLoadingSubmissions(true);
    setSubmissionsError(false);
    try { setSubmissions(await submissionService.getFormSubmissions(formId)); }
    catch { setSubmissionsError(true); }
    finally { setIsLoadingSubmissions(false); }
  }

  async function setPresentation(presentation: 'classic' | 'conversational') {
    if (!form || isSavingMode || (form.presentation ?? 'classic') === presentation) return;
    setIsSavingMode(true);
    try {
      setForm(await formService.updateForm(formId, { presentation }));
      toast.success(presentation === 'conversational' ? 'Conversational mode on — respondents get one question at a time.' : 'Classic mode on — all questions on one page.');
    } catch { toast.error('Presentation mode couldn’t be saved. Try again.'); }
    finally { setIsSavingMode(false); }
  }

  async function togglePublish() {
    if (!form || isPublishing) return;
    setIsPublishing(true);
    try { await formService.publishForm(formId); toast.success(form.sharing?.isPublic ? 'Form unpublished' : 'Form published'); await loadForm(); }
    catch { toast.error('Publishing status couldn’t be updated. Try again.'); }
    finally { setIsPublishing(false); }
  }

  async function shareForm() {
    if (!form?.sharing?.isPublic) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/forms/${form.slug}`); toast.success('Form link copied'); }
    catch { toast.error('Couldn’t copy the link. Please try again.'); }
  }

  function formatValue(value: unknown) {
    if (Array.isArray(value)) return value.join(', ');
    if (value && typeof value === 'object') return 'File attached';
    return value === undefined || value === null ? '—' : String(value);
  }

  const latestResponse = submissions.length ? new Date(Math.max(...submissions.map(item => new Date(item.submittedAt).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

  return <ProtectedRoute><div className="min-h-screen bg-background">
    <header className="workspace-header"><div className="workspace-header-inner page-width"><Brand /><Link href="/dashboard" className="text-link"><ArrowLeft size={15} /> All forms</Link></div></header>
    <main className="workspace-main page-width">
      {isLoading ? <div className="empty-state" role="status"><Loader2 className="animate-spin" size={25} /><p>Opening your form…</p></div> : !form ? <div className="empty-state"><FileText size={30} /><h2>We couldn’t open this form.</h2><p>It may have been removed, or your connection may have been interrupted.</p><button className="action-button small" onClick={loadForm}>Try again</button></div> : <>
        <div className="editor-heading"><div className="min-w-0"><span className="text-xs text-muted-foreground">Your form workspace</span><h1 className="text-2xl sm:text-3xl mt-2 break-words">{form.formName}</h1></div><div className="flex items-center gap-2 shrink-0"><div className="presentation-toggle" role="group" aria-label="Presentation mode"><button type="button" aria-pressed={(form.presentation ?? 'classic') === 'classic'} disabled={isSavingMode} onClick={() => setPresentation('classic')}><Rows3 size={13} /> Classic</button><button type="button" aria-pressed={form.presentation === 'conversational'} disabled={isSavingMode} onClick={() => setPresentation('conversational')}><MessagesSquare size={13} /> Conversational</button></div><button className="action-button secondary small" disabled={isPublishing} onClick={togglePublish}>{isPublishing ? <Loader2 className="animate-spin" size={14} /> : <Radio size={14} />}{form.sharing?.isPublic ? 'Unpublish' : 'Publish'}</button><button className="action-button small" disabled={!form.sharing?.isPublic} onClick={shareForm}><Share2 size={14} /> Copy link</button></div></div>
        <Tabs defaultValue="questions" onValueChange={value => { if (value !== 'questions') loadSubmissions(); }}>
          <TabsList className="h-11 mb-7 bg-white border p-1"><TabsTrigger value="questions" className="px-4 text-xs data-[state=active]:bg-accent data-[state=active]:text-primary data-[state=active]:shadow-none">Questions</TabsTrigger><TabsTrigger value="responses" className="px-4 text-xs data-[state=active]:bg-accent data-[state=active]:text-primary data-[state=active]:shadow-none">Responses</TabsTrigger><TabsTrigger value="analytics" className="px-4 text-xs data-[state=active]:bg-accent data-[state=active]:text-primary data-[state=active]:shadow-none">Analytics</TabsTrigger></TabsList>
          <TabsContent value="questions"><FormBuilder initialForm={form} onSave={handleSave} onPreview={() => setShowPreview(true)} /></TabsContent>
          <TabsContent value="responses">{isLoadingSubmissions ? <div className="empty-state" role="status"><Loader2 size={24} className="animate-spin" /><p>Loading responses…</p></div> : submissionsError ? <div className="workspace-alert" role="alert"><span>Responses couldn’t be loaded.</span><button onClick={loadSubmissions}>Try again</button></div> : !submissions.length ? <div className="empty-state"><MessageSquare size={30} /><h2>Your next conversation starts here.</h2><p>Publish your form and share the link. Every response will appear in this space.</p></div> : <Accordion type="single" collapsible className="space-y-3">{submissions.map((submission, index) => <AccordionItem key={submission._id} value={submission._id} className="border rounded-lg bg-white px-4 sm:px-6"><AccordionTrigger className="hover:no-underline"><span className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-left"><span className="text-sm font-medium">Response {index + 1}</span><span className="text-xs text-muted-foreground break-all">{submission.submitterEmail || 'Anonymous response'}</span><span className="text-[11px] text-muted-foreground">{new Date(submission.submittedAt).toLocaleString()}</span></span></AccordionTrigger><AccordionContent><dl className="divide-y">{Object.entries(submission.responses).map(([fieldId, value]) => { const field = form.fields.find(item => item.fieldId === fieldId); return field ? <div className="grid sm:grid-cols-[200px_1fr] gap-2 py-4" key={fieldId}><dt className="text-xs text-muted-foreground">{field.displayName}</dt><dd className="text-sm break-words">{formatValue(value)}</dd></div> : null; })}</dl>{submission.uploadedImages?.map((image, index) => <a key={image.cloudinaryPublicId} href={image.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs mr-2 mt-3 text-primary"><Download size={14} /> View file {index + 1}</a>)}</AccordionContent></AccordionItem>)}</Accordion>}</TabsContent>
          <TabsContent value="analytics">{isLoadingSubmissions ? <div className="empty-state" role="status"><Loader2 className="animate-spin" size={24} /><p>Loading activity…</p></div> : submissionsError ? <div className="workspace-alert" role="alert"><span>Activity couldn’t be loaded.</span><button onClick={loadSubmissions}>Try again</button></div> : <><div className="workspace-stats"><div className="workspace-stat"><span>Total responses <MessageSquare size={16} /></span><strong>{submissions.length}</strong></div><div className="workspace-stat"><span>Questions <ListChecks size={16} /></span><strong>{form.fields.length}</strong></div><div className="workspace-stat"><span>Latest response <Clock size={16} /></span><strong>{latestResponse}</strong></div></div><section className="border rounded-xl bg-white p-5 sm:p-7"><h2 className="text-lg mb-2">Answers at a glance</h2><p className="text-xs text-muted-foreground mb-7">How often each question was answered across submitted forms.</p>{!submissions.length ? <p className="text-sm text-muted-foreground py-8 text-center">Share your form to start collecting responses.</p> : <div className="space-y-6">{form.fields.map(field => { const count = submissions.filter(item => { const value = item.responses[field.fieldId]; return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0); }).length; const percent = Math.round(count / submissions.length * 100); return <div key={field.fieldId}><div className="flex justify-between gap-4 mb-2"><span className="text-xs">{field.displayName}</span><span className="text-xs text-muted-foreground shrink-0">{count} / {submissions.length} ({percent}%)</span></div><div role="progressbar" aria-label={`${field.displayName} response rate`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} /></div></div>; })}</div>}</section></>}</TabsContent>
        </Tabs><FormPreviewModal form={form} isOpen={showPreview} onClose={() => setShowPreview(false)} />
      </>}
    </main>
  </div></ProtectedRoute>;
}
