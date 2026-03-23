import { apiClient } from './client';
import type { CourseOut } from '@/types/api';

export const coursesApi = {
  list: (programId?: number) =>
    apiClient.get<CourseOut[]>('/api/courses', { params: programId ? { program_id: programId } : {} }),
  get: (id: number) => apiClient.get<CourseOut>(`/api/courses/${id}`),
  create: (data: { program_id: number; title: string; description: string }) =>
    apiClient.post<CourseOut>('/api/courses', data),
  update: (id: number, data: Partial<{ title: string; description: string }>) =>
    apiClient.put<CourseOut>(`/api/courses/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/courses/${id}`),
  publish: (id: number) => apiClient.patch<CourseOut>(`/api/courses/${id}/publish`),
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiClient.patch('/api/courses/reorder', items),
};
