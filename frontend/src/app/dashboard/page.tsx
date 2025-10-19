'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { formService } from '@/services/formService';
import { AIPromptBar } from '@/components/dashboard/AIPromptBar';
import {
  Copy,
  MoreVertical,
  Loader2,
  FileText,
  TrendingUp,
  Plus,
  ExternalLink,
  Calendar,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import type { Form } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionData, setSubmissionData] = useState<Array<{ date: string; count: number; label: string }>>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  useEffect(() => {
    loadForms();
    loadSubmissionAnalytics();
  }, []);

  const loadForms = async () => {
    try {
      const data = await formService.getUserForms();
      setForms(data);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubmissionAnalytics = async () => {
    try {
      const analytics = await formService.getSubmissionAnalytics(30);
      setSubmissionData(analytics.submissions);
      setTotalSubmissions(analytics.totalSubmissions);
    } catch (error) {
      console.error('Failed to load submission analytics:', error);
    }
  };

  const handleCopyUrl = (slug: string) => {
    const url = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  const handleEdit = (formId: string) => {
    router.push(`/dashboard/forms/${formId}`);
  };

  const handleDelete = async (formId: string, formName: string) => {
    if (!confirm(`Are you sure you want to delete "${formName}"?`)) {
      return;
    }

    try {
      await formService.deleteForm(formId);
      toast.success('Form deleted successfully');
      loadForms();
    } catch (error) {
      console.error('Failed to delete form:', error);
      toast.error('Failed to delete form');
    }
  };

  const handlePublish = async (formId: string) => {
    try {
      await formService.publishForm(formId);
      toast.success('Form published successfully!');
      loadForms();
    } catch (error) {
      console.error('Failed to publish form:', error);
      toast.error('Failed to publish form');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Use submission data from API
  const chartData = submissionData;

  const chartConfig = {
    count: {
      label: 'Submissions',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#000000] text-white pb-[200px]">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-[#333333] bg-[#000000]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-sm font-semibold tracking-tight text-white">AI Form Builder</h1>

            </div>
            <div className="flex items-center gap-3">

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-8 px-3 text-[13px] text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a]"
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-6 w-6 animate-spin text-[#a1a1a1]" />
            </div>
          ) : forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-6 rounded-full bg-[#1a1a1a] p-6">
                <FileText className="h-8 w-8 text-[#a1a1a1]" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">No forms yet</h2>
              <p className="text-[13px] text-[#a1a1a1] text-center max-w-sm mb-8">
                Create your first AI-powered form using the prompt below or click the button above.
              </p>
              <Button
                className="h-9 px-4 text-[13px] bg-white text-black hover:bg-[#fafafa] border-0 rounded-md font-medium"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Form
              </Button>
            </div>
          ) : (
            <div className="space-y-8">


              {/* Activity Chart */}
              <Card className="bg-[#0a0a0a] border border-[#333333] rounded-lg overflow-hidden">
                <div className="p-6 border-b border-[#333333]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold mb-1 text-white">
                        Submissions Activity
                      </h3>
                      <p className="text-[13px] text-[#a1a1a1]">
                        Daily submissions over the last 30 days
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1a1a1a] border border-[#333333]">
                      <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-[13px] font-medium text-white">{totalSubmissions} submissions</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ChartContainer config={chartConfig} className="h-[240px] w-full">
                    <AreaChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="hsl(217, 91%, 60%)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(217, 91%, 60%)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#333333"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        minTickGap={32}
                        tick={{ fill: '#a1a1a1', fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fill: '#a1a1a1', fontSize: 12 }}
                      />
                      <ChartTooltip
                        cursor={{ stroke: '#333333', strokeWidth: 1 }}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(217, 91%, 60%)"
                        strokeWidth={2}
                        fill="url(#fillCount)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </Card>

              {/* Forms List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Your Forms</h3>
                  <span className="text-[13px] text-[#a1a1a1]">
                    {forms.length} {forms.length === 1 ? 'form' : 'forms'}
                  </span>
                </div>
                <div className="space-y-3">
                  {forms.map((form) => (
                    <Card
                      key={form._id}
                      className="bg-[#0a0a0a] border border-[#333333] rounded-lg hover:border-[#444444] transition-all cursor-pointer group overflow-hidden"
                      onClick={() => router.push(`/dashboard/forms/${form._id}`)}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-[15px] font-semibold text-white group-hover:text-white transition-colors truncate">
                                {form.formName}
                              </h3>
                              {form.sharing?.isPublic && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-medium shrink-0">
                                  <ExternalLink className="h-3 w-3" />
                                  Published
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-6 text-[13px] text-[#a1a1a1]">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(form.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Activity className="h-3.5 w-3.5" />
                                <span>{form.submissionStats?.count || 0} submissions</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {form.sharing?.isPublic && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyUrl(form.slug)}
                                className="h-8 px-3 text-[13px] text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a] border border-[#333333]"
                              >
                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                Copy Link
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-[#a1a1a1] hover:text-white hover:bg-[#1a1a1a] border border-[#333333]"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-[#0a0a0a] border-[#333333] text-white min-w-[160px]"
                              >
                                <DropdownMenuItem
                                  onClick={() => handleEdit(form._id)}
                                  className="hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] cursor-pointer text-[13px]"
                                >
                                  Edit Form
                                </DropdownMenuItem>
                                {!form.sharing?.isPublic && (
                                  <DropdownMenuItem
                                    onClick={() => handlePublish(form._id)}
                                    className="hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] cursor-pointer text-[13px]"
                                  >
                                    Publish Form
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-[#333333]" />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(form._id, form.formName)}
                                  className="hover:bg-[#1a1a1a] focus:bg-[#1a1a1a] cursor-pointer text-red-400 focus:text-red-400 text-[13px]"
                                >
                                  Delete Form
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* AI Prompt Bar - Sticky at bottom */}
        <AIPromptBar />
      </div>
    </ProtectedRoute>
  );
}
