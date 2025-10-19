import { api } from '@/lib/api';
import type { Submission, ApiResponse } from '@/types';

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

  // Get all submissions for a form (auth required)
  async getFormSubmissions(formId: string): Promise<Submission[]> {
    const response = await api.get<ApiResponse<Submission[]>>(
      `/submission/${formId}/submissions`
    );
    return response.data.data || [];
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
