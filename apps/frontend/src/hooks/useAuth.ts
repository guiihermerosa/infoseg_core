'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setToken, removeToken, isAuthenticated, getUserRole, getToken, getTokenPayload } from '@/lib/auth';
import type { LoginDto, LoginResponseDto } from '@infoseg/shared';

interface AuthError {
  message: string;
  retryAfter?: number; // seconds remaining for rate limit
}

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const login = useCallback(async (credentials: LoginDto) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<LoginResponseDto>('/auth/login', credentials);
      setToken(data.access_token);
      const role = getUserRole();
      if (role === 'support') {
        router.push('/concierge/settings');
      } else if (role === 'concierge') {
        router.push('/concierge/cameras');
      } else {
        router.push('/resident/dashboard');
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string };
          headers?: Record<string, string>;
        };
      };

      const status = axiosErr.response?.status;

      if (status === 429) {
        const retryAfterHeader = axiosErr.response?.headers?.['retry-after'];
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
        setError({
          message: axiosErr.response?.data?.message || 'Muitas tentativas. Tente novamente mais tarde.',
          retryAfter,
        });
      } else if (status === 401) {
        setError({
          message: 'E-mail ou senha incorretos.',
        });
      } else {
        setError({
          message: 'Erro ao fazer login. Tente novamente.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    removeToken();
    router.push('/login');
  }, [router]);

  const checkAuth = useCallback(() => {
    return isAuthenticated();
  }, []);

  return {
    login,
    logout,
    loading,
    error,
    isAuthenticated: checkAuth,
    role: getUserRole(),
    userId: getToken() ? getTokenPayload(getToken()!)?.sub : null,
  };
}
