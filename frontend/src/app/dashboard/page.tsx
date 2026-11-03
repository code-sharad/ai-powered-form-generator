'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Brand } from '@/components/layout/Brand';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/providers/ThemeProvider';
import { formService } from '@/services/formService';
import { AIPromptBar } from '@/components/dashboard/AIPromptBar';
import { ResponseAnalytics } from '@/components/dashboard/ResponseAnalytics';
import { Copy, ExternalLink, FileText, Radio, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/arc/button/button';
import { DropdownMenu } from '@/components/arc/dropdown-menu/dropdown-menu';
import { UserMenu } from '@/components/arc/user-menu/user-menu';
import { SearchField } from '@/components/arc/search-field/search-field';
import SegmentedControl from '@/components/arc/segmented-control/segmented-control';
import { Badge } from '@/components/arc/badge/badge';
import { Alert } from '@/components/arc/alert/alert';
import { EmptyState } from '@/components/arc/empty-state/empty-state';
import { Skeleton } from '@/components/arc/skeleton/skeleton';
import SortableDataTable, { type DataColumn } from '@/components/arc/sortable-data-table/sortable-data-table';
import { toast } from '@/lib/toast';
import type { Form } from '@/types';
import './dashboard.css';
import '@/app/response-chart.css';

type FormRow = {
  key: string;
  name: ReactNode;
  status: ReactNode;
  responses: number;
  updated: number;
  actions: ReactNode;
};

function buildRows(
  forms: Form[],
  pendingId: string | null,
  handlers: {
    copy: (slug: string) => void;
    publish: (id: string) => void;
    remove: (form: Form) => void;
  },
): FormRow[] {
  return forms.map(form => {
    const isPublished = Boolean(form.sharing?.isPublic);
    return {
      key: form._id,
      name: <Link href={`/dashboard/forms/${form._id}`} className="simple-form-name">
        <span className="simple-form-icon"><FileText size={17} /></span>
        <span>{form.formName}</span>
      </Link>,
      status: <Badge tone={isPublished ? 'success' : 'neutral'} dot pill>{isPublished ? 'Published' : 'Draft'}</Badge>,
      responses: form.submissionStats?.count ?? 0,
      updated: new Date(form.updatedAt).getTime(),
      actions: <DropdownMenu
        label="Actions"
        items={[
          { label: 'Edit form', icon: <Pencil size={14} />, onSelect: () => { window.location.assign(`/dashboard/forms/${form._id}`); } },
          ...(isPublished
            ? [
                { label: 'Copy link', icon: <Copy size={14} />, onSelect: () => handlers.copy(form.slug) },
                {
                  label: 'Open public form',
                  icon: <ExternalLink size={14} />,
                  onSelect: () => window.open(`/forms/${form.slug}`, '_blank', 'noopener,noreferrer'),
                },
              ]
            : [{ label: 'Publish form', icon: <Radio size={14} />, onSelect: () => handlers.publish(form._id), disabled: pendingId === form._id }]),
          { label: 'Delete form', icon: <Trash2 size={14} />, destructive: true, separatorBefore: true, onSelect: () => handlers.remove(form) },
        ]}
      />,
    };
  });
}

function DashboardWorkspace() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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
    catch { toast.error('Couldn’t copy the link', 'Try opening the public form instead.'); }
  }

  async function deleteForm(form: Form) {
    if (!confirm(`Delete “${form.formName}”? This can’t be undone.`)) return;
    setPendingId(form._id);
    try {
      await formService.deleteForm(form._id);
      toast.success('Form deleted');
      await loadForms();
      setAnalyticsRefresh(value => value + 1);
    } catch { toast.error('Form couldn’t be deleted', 'Please try again.'); }
    finally { setPendingId(null); }
  }

  async function publishForm(id: string) {
    setPendingId(id);
    try { await formService.publishForm(id); toast.success('Form published'); await loadForms(); }
    catch { toast.error('Form couldn’t be published', 'Please try again.'); }
    finally { setPendingId(null); }
  }

  const visibleForms = forms
    .filter(form => form.formName.toLowerCase().includes(search.trim().toLowerCase()) && (filter === 'all' || (filter === 'published' ? form.sharing?.isPublic : !form.sharing?.isPublic)))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const publishedCount = forms.filter(form => form.sharing?.isPublic).length;
  const earliestFormAt = forms.reduce<string | undefined>((earliest, form) => (!earliest || form.createdAt < earliest ? form.createdAt : earliest), undefined);
  const rows = buildRows(visibleForms, pendingId, { copy: copyLink, publish: publishForm, remove: deleteForm });

  const columns: DataColumn<FormRow>[] = [
    { key: 'name', label: 'Name', sortable: false, render: value => value as ReactNode },
    { key: 'status', label: 'Status', sortable: false, render: value => value as ReactNode },
    { key: 'responses', label: 'Responses', numeric: true },
    { key: 'updated', label: 'Updated', numeric: false, render: (_, row) => new Date(row.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
    { key: 'actions', label: 'Actions', sortable: false, render: value => value as ReactNode, width: '132px' },
  ];

  return <div className="simple-dashboard">
    <a href="#workspace" className="skip-link">Skip to workspace</a>
    <main id="workspace" className="simple-dashboard-main">
      <h1 className="sr-only">Form dashboard</h1>

      <div className="dashboard-utilities">
        <Brand />
        <div className="dashboard-utility-actions">
          <UserMenu
            user={{ name: user?.name ?? 'Your account', email: user?.email ?? '' }}
            theme={theme}
            onThemeChange={next => setTheme(next === 'light' || next === 'dark' ? next : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')}
            showName
            onSignOut={logout}
          />
        </div>
      </div>

      <ResponseAnalytics formCount={isLoading || error ? null : forms.length} publishedCount={isLoading || error ? null : publishedCount} refreshKey={analyticsRefresh} earliestAt={user?.createdAt ?? earliestFormAt} />

      {error && <Alert tone="danger" title={error} onDismiss={() => setError('')} className="workspace-alert">
        <Button variant="secondary" size="sm" onClick={loadForms}>Try again</Button>
      </Alert>}

      <section id="your-forms" aria-label="Your forms">
        <div className="simple-form-tools">
          <div className="simple-search">
            <SearchField label="Search forms" placeholder="Search forms…" value={search} onValueChange={setSearch} />
          </div>
          <div className="simple-form-filters">
            <SegmentedControl
              label="Filter by status"
              value={filter}
              onValueChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Drafts' },
              ]}
            />
          </div>
        </div>

        {isLoading
          ? <Skeleton label="Loading your forms" lines={5} />
          : error
            ? null
            : visibleForms.length === 0
              ? <EmptyState
                  icon={<FileText size={24} />}
                  title={forms.length === 0 ? 'Create your first form.' : 'No matching forms.'}
                  description={forms.length === 0 ? 'Describe what you need in the prompt below and AI drafts the questions.' : 'Try another name or choose a different status.'}
                  action={forms.length === 0
                    ? <Button variant="secondary" onClick={focusPrompt}>Start with a prompt <Sparkles size={14} /></Button>
                    : <Button variant="secondary" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</Button>}
                />
              : <SortableDataTable<FormRow>
                  rows={rows}
                  columns={columns}
                  rowKey="key"
                  caption="Your forms, sorted by most recently updated"
                  itemName={{ one: 'form', other: 'forms' }}
                />}
      </section>
    </main>
    <div className="dashboard-prompt-dock"><AIPromptBar compact onGenerated={loadForms} /></div>
  </div>;
}

export default function DashboardPage() {
  return <ProtectedRoute><DashboardWorkspace /></ProtectedRoute>;
}
