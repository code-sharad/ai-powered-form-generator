import { api } from '@/lib/api';
import type {
  AuthResponse,
  LoginCredentials,
  MagicLinkRequest,
  MagicLinkResponse,
  SignupCredentials,
  User
} from '@/types';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Signup
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', credentials);
    return response.data;
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return response.data.data.user;
  },

  // Request a magic-link email
  async requestMagicLink(payload: MagicLinkRequest): Promise<MagicLinkResponse> {
    const response = await api.post<MagicLinkResponse>('/auth/magic-link', payload, { suppressErrorToast: true });
    return response.data;
  },

  // Verify a magic-link token
  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/magic-link/verify', { token }, { suppressErrorToast: true });
    return response.data;
  },

  // Logout (client-side only for JWT)
  logout(): void {
    // Token removal is handled in authStore
  },
};
