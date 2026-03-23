import { apiClient } from './client';
import type { LessonOut, LessonBlockOut } from '@/types/api';

export const lessonsApi = {
  list: (moduleId: number) =>
    apiClient.get<LessonOut[]>('/api/lessons', { params: { module_id: moduleId } }),
  get: (id: number) => apiClient.get<LessonOut>(`/api/lessons/${id}`),
  create: (data: { module_id: number; title: string; description: string; type: string; duration_min: number }) =>
    apiClient.post<LessonOut>('/api/lessons', data),
  update: (id: number, data: Partial<LessonOut>) =>
    apiClient.put<LessonOut>(`/api/lessons/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/lessons/${id}`),
  publish: (id: number) => apiClient.patch<LessonOut>(`/api/lessons/${id}/publish`),
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiClient.patch('/api/lessons/reorder', items),

  getBlocks: (lessonId: number) =>
    apiClient.get<LessonBlockOut[]>(`/api/lessons/${lessonId}/blocks`),
  createBlock: (lessonId: number, data: { type: string; sort_order: number; data: object }) =>
    apiClient.post<LessonBlockOut>(`/api/lessons/${lessonId}/blocks`, data),
  updateBlock: (lessonId: number, blockId: number, data: { sort_order?: number; data?: object }) =>
    apiClient.put<LessonBlockOut>(`/api/lessons/${lessonId}/blocks/${blockId}`, data),
  deleteBlock: (lessonId: number, blockId: number) =>
    apiClient.delete(`/api/lessons/${lessonId}/blocks/${blockId}`),
};
