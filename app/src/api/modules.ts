import { apiClient } from './client';
import type { ModuleOut } from '@/types/api';

export const modulesApi = {
  list: (courseId: number) =>
    apiClient.get<ModuleOut[]>('/api/modules', { params: { course_id: courseId } }),
  get: (id: number) => apiClient.get<ModuleOut>(`/api/modules/${id}`),
  create: (data: { course_id: number; title: string; description: string }) =>
    apiClient.post<ModuleOut>('/api/modules', data),
  update: (id: number, data: Partial<{ title: string; description: string }>) =>
    apiClient.put<ModuleOut>(`/api/modules/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/modules/${id}`),
  lock: (id: number) => apiClient.patch<ModuleOut>(`/api/modules/${id}/lock`),
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiClient.patch('/api/modules/reorder', items),
};
