import { apiClient } from './client';
import type { ProgramOut } from '@/types/api';

export const programsApi = {
  list: () => apiClient.get<ProgramOut[]>('/api/programs'),
  get: (id: number) => apiClient.get<ProgramOut>(`/api/programs/${id}`),
  create: (data: { title: string; description: string }) =>
    apiClient.post<ProgramOut>('/api/programs', data),
  update: (id: number, data: Partial<{ title: string; description: string; image_url: string }>) =>
    apiClient.put<ProgramOut>(`/api/programs/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/programs/${id}`),
  publish: (id: number) => apiClient.patch<ProgramOut>(`/api/programs/${id}/publish`),
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiClient.patch('/api/programs/reorder', items),
};
