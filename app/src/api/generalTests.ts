import { apiClient } from './client';
import type {
  GeneralTestAnswer,
  GeneralTestAttemptOut,
  GeneralTestCreateInput,
  GeneralTestKind,
  GeneralTestListItem,
  GeneralTestOut,
  GeneralTestResultsOut,
  GeneralTestUpdateInput,
} from '@/types/api';

export const generalTestsApi = {
  list: (kind?: GeneralTestKind) =>
    apiClient.get<GeneralTestListItem[]>('/api/general-tests', {
      params: kind ? { kind } : undefined,
    }),
  get: (id: number) => apiClient.get<GeneralTestOut>(`/api/general-tests/${id}`),

  // admin
  create: (data: GeneralTestCreateInput) =>
    apiClient.post<GeneralTestOut>('/api/general-tests', data),
  update: (id: number, data: GeneralTestUpdateInput) =>
    apiClient.put<GeneralTestOut>(`/api/general-tests/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/general-tests/${id}`),
  publish: (id: number) =>
    apiClient.patch<GeneralTestOut>(`/api/general-tests/${id}/publish`),
  results: (id: number, limit = 10) =>
    apiClient.get<GeneralTestResultsOut>(`/api/general-tests/${id}/results`, {
      params: { limit },
    }),

  // student attempts
  startAttempt: (testId: number) =>
    apiClient.get<GeneralTestAttemptOut>(`/api/general-tests/${testId}/attempt`),
  saveAnswers: (testId: number, answers: Record<string, GeneralTestAnswer>) =>
    apiClient.put<GeneralTestAttemptOut>(`/api/general-tests/${testId}/attempt`, { answers }),
  completeAttempt: (testId: number, answers: Record<string, GeneralTestAnswer>) =>
    apiClient.post<GeneralTestAttemptOut>(`/api/general-tests/${testId}/attempt/complete`, {
      answers,
    }),
  myAttempts: () =>
    apiClient.get<GeneralTestAttemptOut[]>('/api/general-tests/me/attempts'),
};
