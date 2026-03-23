import { apiClient } from './client';
import type { AnalyticsOverview, CompletionRate, QuizAnalytics } from '@/types/api';

export const analyticsApi = {
  overview: () => apiClient.get<AnalyticsOverview>('/api/analytics/overview'),
  completion: () => apiClient.get<CompletionRate[]>('/api/analytics/completion'),
  dropoff: () => apiClient.get<CompletionRate[]>('/api/analytics/dropoff'),
  quizResults: () => apiClient.get<QuizAnalytics[]>('/api/analytics/quiz-results'),
};
