import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { LoginCredentials, SignupCredentials } from '@/types';

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);

      if (response.success && response.data.user && response.token) {
        setAuth(response.data.user, response.token);
        toast.success('Login successful!');
        router.push('/dashboard');
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      const response = await authService.signup(credentials);

      if (response.success) {
        toast.success('Account created successfully! Please login.');
        router.push('/login');
        return { success: true };
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Signup failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    storeLogout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    login,
    signup,
    logout,
  };
}
