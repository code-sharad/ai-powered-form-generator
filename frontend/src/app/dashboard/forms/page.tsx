'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/types';
import { formService } from '@/services/formService';
import { FileText, Edit, Trash2, Share2, BarChart, Plus, Loader2, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function FormsListPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const data = await formService.getUserForms();
      setForms(data);
    } catch (error) {
      console.error('Failed to load forms:', error);
      toast.error('Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (formId: string, formName: string) => {
    if (!confirm(`Are you sure you want to delete "${formName}"?`)) {
      return;
    }

    setDeletingId(formId);

    try {
      await formService.deleteForm(formId);
      toast.success('Form deleted successfully');
      setForms((prev) => prev.filter((f) => f._id !== formId));
    } catch (error) {
      console.error('Failed to delete form:', error);
      toast.error('Failed to delete form');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (formId: string) => {
    try {
      const { publicLink } = await formService.publishForm(formId);

      // Copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(publicLink);
        toast.success('Form published! Link copied to clipboard');
      } else {
        toast.success('Form published!');
      }

      loadForms(); // Refresh to show updated status
    } catch (error) {
      console.error('Failed to publish form:', error);
      toast.error('Failed to publish form');
    }
  };

  const handleCopyLink = (slug: string) => {
    const publicLink = `${window.location.origin}/forms/${slug}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicLink);
      toast.success('Link copied to clipboard!');
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleViewPublic = (slug: string) => {
    const publicLink = `${window.location.origin}/forms/${slug}`;
    window.open(publicLink, '_blank');
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">My Forms</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage and edit your forms
                </p>
              </div>
              <Link href="/dashboard/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Form
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {forms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No forms yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first form to get started
                </p>
                <Link href="/dashboard/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Form
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <Card key={form._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {form.formName}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {form.description || 'No description'}
                        </CardDescription>
                      </div>
                      {form.sharing?.isPublic && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span>{form.fields?.length} fields</span>
                      <span>•</span>
                      <span>{form.submissionStats?.count || 0} submissions</span>
                    </div>

                    {/* Show public link if published */}
                    {form.sharing?.isPublic && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                        <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                          Public Form Link:
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleCopyLink(form.slug)}
                          >
                            <Copy className="mr-1 h-3 w-3" />
                            Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPublic(form.slug)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/forms/${form._id}`)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/forms/${form._id}/submissions`)
                        }
                      >
                        <BarChart className="mr-1 h-3 w-3" />
                        Stats
                      </Button>
                      {!form.sharing?.isPublic && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublish(form._id)}
                        >
                          <Share2 className="mr-1 h-3 w-3" />
                          Publish
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(form._id, form.formName)}
                        disabled={deletingId === form._id}
                      >
                        {deletingId === form._id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1 h-3 w-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
