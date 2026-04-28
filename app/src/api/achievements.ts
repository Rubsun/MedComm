import { apiClient } from './client';
import type {
  AchievementOut,
  AchievementWithStatus,
  StreakOut,
} from '@/types/api';

export interface AchievementInput {
  title: string;
  description?: string;
  icon?: string;
  color?: string | null;
  tier?: 'bronze' | 'silver' | 'gold';
  metric:
    | 'lessons_completed'
    | 'courses_completed'
    | 'streak_days'
    | 'perfect_quizzes'
    | 'practice_count';
  op?: '>=' | '>' | '==';
  threshold: number;
  xp?: number;
}

export const achievementsApi = {
  // admin + student (filtered by published for non-admin)
  list: () => apiClient.get<AchievementOut[]>('/api/achievements'),
  get: (id: number) => apiClient.get<AchievementOut>(`/api/achievements/${id}`),

  // admin
  create: (data: AchievementInput) =>
    apiClient.post<AchievementOut>('/api/achievements', data),
  update: (id: number, data: Partial<AchievementInput>) =>
    apiClient.put<AchievementOut>(`/api/achievements/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/achievements/${id}`),
  publish: (id: number) =>
    apiClient.patch<AchievementOut>(`/api/achievements/${id}/publish`),
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiClient.patch('/api/achievements/reorder', items),

  // student-only convenience
  myList: () => apiClient.get<AchievementWithStatus[]>('/api/me/achievements'),
  myStreak: () => apiClient.get<StreakOut>('/api/me/streak'),
};
