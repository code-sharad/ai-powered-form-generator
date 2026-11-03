import { api } from '@/lib/api';
import type { Submission, ApiResponse, Pagination, FormAnalytics } from '@/types';

export const submissionService = {
  // Submit form response (public - no auth required)
  async submitForm(formId: string, data: {
    responses: Record<string, unknown>;
    submitterEmail?: string;
    uploadedImages?: Array<{
      fieldId: string;
      cloudinaryPublicId: string;
      url: string;
    }>;
  }): Promise<Submission> {
    const response = await api.post<ApiResponse<Submission>>(
      `/submission/${formId}`,
      data
    );
    return response.data.data!;
  },

  // Get one page of a form's submissions, newest first (auth required)
  async getFormSubmissions(formId: string, page = 1, limit = 10): Promise<{ submissions: Submission[]; pagination: Pagination }> {
    const response = await api.get<ApiResponse<Submission[]> & { pagination?: Pagination }>(
      `/submission/${formId}/submissions`,
      { params: { page, limit } }
    );
    const total = response.data.pagination?.total ?? response.data.data?.length ?? 0;
    return {
      submissions: response.data.data || [],
      pagination: response.data.pagination ?? { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  // Aggregated answers, choice tallies, and a 30-day series for one form
  async getFormAnalytics(formId: string): Promise<FormAnalytics> {
    const response = await api.get<ApiResponse<FormAnalytics>>(
      `/submission/${formId}/analytics`
    );
    return response.data.data!;
  },

  // Get single submission (auth required)
  async getSubmission(submissionId: string): Promise<Submission> {
    const response = await api.get<ApiResponse<Submission>>(
      `/submission/${submissionId}`
    );
    return response.data.data!;
  },

  // Delete submission (auth required)
  async deleteSubmission(submissionId: string): Promise<void> {
    await api.delete(`/submission/${submissionId}`);
  },
};
