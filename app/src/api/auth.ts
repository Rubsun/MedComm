import { apiClient } from './client';
import type { UserOut, TokenResponse } from '@/types/api';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>('/api/auth/login', { email, password }),

  register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    apiClient.post<UserOut>('/api/auth/register', data),

  me: () => apiClient.get<UserOut>('/api/auth/me'),

  logout: () => apiClient.post('/api/auth/logout'),

  refresh: () => apiClient.post<TokenResponse>('/api/auth/refresh'),
};
