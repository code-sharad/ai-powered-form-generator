import axios from 'axios';
import { z } from 'zod';
import { api } from '@/lib/api';
import type {
  Form,
  FormGenerationRequest,
  ApiResponse
} from '@/types';

export type GenerationRequestError = 'network' | 'timeout' | 'request' | 'session';

export type GenerateFormResult =
  | { ok: true }
  | { ok: false; error: GenerationRequestError };

const generationSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({}),
});

export const formService = {
  // Generate form with AI
  async generateForm(query: FormGenerationRequest): Promise<GenerateFormResult> {
    try {
      const response = await api.post<unknown>('/form/generate', query, { suppressErrorToast: true });
      return generationSuccessSchema.safeParse(response.data).success
        ? { ok: true }
        : { ok: false, error: 'request' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) return { ok: false, error: 'session' };
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          return { ok: false, error: 'timeout' };
        }
        if (!error.response && (error.code === 'ERR_NETWORK' || error.request)) {
          return { ok: false, error: 'network' };
        }
      }
      return { ok: false, error: 'request' };
    }
  },

  // Get all user forms
  async getUserForms(): Promise<Form[]> {
    const response = await api.get<ApiResponse<Form[]>>('/form', { suppressErrorToast: true });
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
  async getSubmissionAnalytics(period: number | { startDate: string; endDate: string; groupBy: 'day' | 'month' } = 30): Promise<{
    submissions: Array<{ date: string; count: number; label: string }>;
    totalSubmissions: number;
    periodDays: number;
  }> {
    const params = typeof period === 'number' ? { days: period } : period;
    const response = await api.get<ApiResponse<{
      submissions: Array<{ date: string; count: number; label: string }>;
      totalSubmissions: number;
      periodDays: number;
    }>>('/submission/analytics/submissions-over-time', { params });
    return response.data.data || { submissions: [], totalSubmissions: 0, periodDays: typeof period === 'number' ? period : 0 };
  },
};
