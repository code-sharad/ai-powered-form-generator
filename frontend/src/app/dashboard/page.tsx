'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Brand } from '@/components/layout/Brand';
import { useAuth } from '@/hooks/useAuth';
import { formService } from '@/services/formService';
import { AIPromptBar } from '@/components/dashboard/AIPromptBar';
import { ResponseAnalytics } from '@/components/dashboard/ResponseAnalytics';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Copy, ExternalLink, FileText, Loader2, LogOut, MoreHorizontal, Pencil, Plus, Radio, Search, Sparkles, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import type { Form } from '@/types';
import './dashboard.css';

function FormActions({ form, pending, onCopy, onPublish, onDelete }: {
  form: Form;
  pending: boolean;
  onCopy: (slug: string) => void;
  onPublish: (id: string) => void;
  onDelete: (form: Form) => void;
}) {
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild><button type="button" className="icon-button" disabled={pending} aria-label={`Actions for ${form.formName}`}>{pending ? <Loader2 size={16} className="animate-spin" /> : <MoreHorizontal size={17} />}</button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem asChild><Link href={`/dashboard/forms/${form._id}`}><Pencil size={14} /> Edit form</Link></DropdownMenuItem>
      {form.sharing?.isPublic ? <>
        <DropdownMenuItem onClick={() => onCopy(form.slug)}><Copy size={14} /> Copy link</DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`/forms/${form.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Open public form</Link></DropdownMenuItem>
      </> : <DropdownMenuItem onClick={() => onPublish(form._id)}><Radio size={14} /> Publish form</DropdownMenuItem>}
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(form)}><Trash2 size={14} /> Delete form</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

function DashboardWorkspace() {
  const { user, logout } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [analyticsRefresh, setAnalyticsRefresh] = useState(0);

  const loadForms = useCallback(async () => {
    setError('');
    try { setForms(await formService.getUserForms()); }
    catch { setError('Your forms couldn’t be loaded. Check your connection and try again.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadForms(); }, [loadForms]);

  function focusPrompt() { document.getElementById('form-prompt')?.focus({ preventScroll: true }); }

  useEffect(() => {
    function syncHash() { if (window.location.hash === '#create-form') document.getElementById('form-prompt')?.focus({ preventScroll: true }); }
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  async function copyLink(slug: string) {
    try { await navigator.clipboard.writeText(`${window.location.origin}/forms/${slug}`); toast.success('Form link copied'); }
    catch { toast.error('Couldn’t copy the link. Try opening the public form instead.'); }
  }

  async function deleteForm(form: Form) {
    if (!confirm(`Delete “${form.formName}”? This can’t be undone.`)) return;
    setPendingId(form._id);
    try {
      await formService.deleteForm(form._id);
      toast.success('Form deleted');
      await loadForms();
      setAnalyticsRefresh(value => value + 1);
    } catch { toast.error('Form couldn’t be deleted. Please try again.'); }
    finally { setPendingId(null); }
  }

  async function publishForm(id: string) {
    setPendingId(id);
    try { await formService.publishForm(id); toast.success('Form published'); await loadForms(); }
    catch { toast.error('Form couldn’t be published. Please try again.'); }
    finally { setPendingId(null); }
  }

  const visibleForms = forms
    .filter(form => form.formName.toLowerCase().includes(search.trim().toLowerCase()) && (filter === 'all' || (filter === 'published' ? form.sharing?.isPublic : !form.sharing?.isPublic)))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const publishedCount = forms.filter(form => form.sharing?.isPublic).length;

  return <div className="simple-dashboard">
    <a href="#workspace" className="skip-link">Skip to workspace</a>
    <main id="workspace" className="simple-dashboard-main">
      <h1 className="sr-only">Form dashboard</h1>
      <div className="dashboard-utilities"><Brand /><div className="dashboard-utility-actions"><ThemeToggle /><button type="button" className="icon-button" aria-label="Log out" title="Log out" onClick={logout}><LogOut size={16} /></button></div></div>

      <ResponseAnalytics formCount={isLoading || error ? null : forms.length} publishedCount={isLoading || error ? null : publishedCount} refreshKey={analyticsRefresh} firstYear={user?.createdAt ? new Date(user.createdAt).getUTCFullYear() : undefined} />

      {error && <div role="alert" className="workspace-alert"><span>{error}</span><button type="button" onClick={loadForms}>Try again</button></div>}

      <section id="your-forms" aria-label="Your forms">
        <div className="simple-form-tools"><div className="simple-search"><Search size={14} /><label htmlFor="search-forms" className="sr-only">Search forms</label><input id="search-forms" type="search" placeholder="Search forms…" value={search} onChange={event => setSearch(event.target.value)} className="search-input" /></div><div className="simple-form-filters"><Select value={filter} onValueChange={setFilter}><SelectTrigger id="filter-forms" className="filter-select" aria-label="Filter by status"><SelectValue /></SelectTrigger><SelectContent className="dashboard-select-menu" position="popper" align="end" sideOffset={5}><SelectItem value="all">All forms</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Drafts</SelectItem></SelectContent></Select><button type="button" className="icon-button" aria-label="Create a new form" title="Create a new form" onClick={focusPrompt}><Plus size={17} /></button></div></div>

        {isLoading ? <div className="empty-state" role="status"><Loader2 size={22} className="animate-spin" /><p>Loading your forms…</p></div> : error ? null : visibleForms.length === 0 ? <div className="empty-state"><FileText size={27} /><h2>{forms.length === 0 ? 'Create your first form.' : 'No matching forms.'}</h2><p>{forms.length === 0 ? 'Describe what you need in the prompt below.' : 'Try another name or choose a different status.'}</p>{forms.length === 0 ? <button type="button" className="text-link" onClick={focusPrompt}>Start with a prompt <Sparkles size={14} /></button> : <button type="button" className="text-link" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button>}</div> : <table className="simple-form-table">
          <caption className="sr-only">Your forms, sorted by most recently updated</caption>
          <thead><tr><th scope="col">Name</th><th scope="col">Status</th><th scope="col">Responses</th><th scope="col">Updated</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{visibleForms.map(form => <tr key={form._id}>
            <td><Link href={`/dashboard/forms/${form._id}`} className="simple-form-name"><span className="simple-form-icon"><FileText size={17} /></span><span>{form.formName}<span className={`simple-mobile-status ${form.sharing?.isPublic ? 'is-published' : ''}`}>{form.sharing?.isPublic ? 'Published' : 'Draft'}</span></span></Link></td>
            <td><span className={`simple-status ${form.sharing?.isPublic ? 'is-published' : ''}`}><i />{form.sharing?.isPublic ? 'Published' : 'Draft'}</span></td>
            <td>{form.submissionStats?.count ?? 0}</td>
            <td>{new Date(form.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
            <td><FormActions form={form} pending={pendingId === form._id} onCopy={copyLink} onPublish={publishForm} onDelete={deleteForm} /></td>
          </tr>)}</tbody>
        </table>}
      </section>
    </main>
    <div className="dashboard-prompt-dock"><AIPromptBar compact onGenerated={loadForms} /></div>
  </div>;
}

export default function DashboardPage() {
  return <ProtectedRoute><DashboardWorkspace /></ProtectedRoute>;
}
