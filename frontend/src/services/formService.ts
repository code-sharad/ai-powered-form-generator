import { api } from '@/lib/api';
import type {
  Form,
  FormGenerationRequest,
  FormGenerationResponse,
  ApiResponse
} from '@/types';

export const formService = {
  // Generate form with AI
  async generateForm(query: FormGenerationRequest): Promise<FormGenerationResponse> {
    const response = await api.post<FormGenerationResponse>('/form/generate', query);
    return response.data;
  },

  // Get all user forms
  async getUserForms(): Promise<Form[]> {
    const response = await api.get<ApiResponse<Form[]>>('/form');
    return response.data.data || [];
  },

  // Get single form by ID
  async getFormById(formId: string): Promise<Form> {
    const response = await api.get<Form>(`/form/${formId}`);
    return response.data;
  },

  // Get public form (no auth required)
  async getPublicForm(formId: string): Promise<Form> {
    const response = await api.get<Form>(`/form/public/${formId}`);
    return response.data;
  },

  // Update form
  async updateForm(formId: string, data: Partial<Form>): Promise<Form> {
    const response = await api.post<{ form: Form }>(`/form/${formId}`, data);
    return response.data.form;
  },

  // Publish form
  async publishForm(formId: string): Promise<{ publicLink: string }> {
    const response = await api.patch<{ message: string; publicLink: string }>(
      `/form/${formId}/publish`
    );
    return { publicLink: response.data.publicLink };
  },

  // Delete form
  async deleteForm(formId: string): Promise<void> {
    await api.delete(`/form/${formId}`);
  },

  // Get submission analytics
  async getSubmissionAnalytics(days: number = 30): Promise<{
    submissions: Array<{ date: string; count: number; label: string }>;
    totalSubmissions: number;
    periodDays: number;
  }> {
    const response = await api.get<ApiResponse<{
      submissions: Array<{ date: string; count: number; label: string }>;
      totalSubmissions: number;
      periodDays: number;
    }>>(`/submission/analytics/submissions-over-time?days=${days}`);
    return response.data.data || { submissions: [], totalSubmissions: 0, periodDays: days };
  },
};
