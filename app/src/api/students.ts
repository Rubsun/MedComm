import { apiClient } from './client';
import type { StudentOut, StudentProgress } from '@/types/api';

export const studentsApi = {
  list: (search?: string) =>
    apiClient.get<StudentOut[]>('/api/students', { params: search ? { search } : {} }),
  deactivate: (id: number) => apiClient.patch<StudentOut>(`/api/students/${id}/deactivate`),
  progress: (id: number) => apiClient.get<StudentProgress>(`/api/students/${id}/progress`),
};
