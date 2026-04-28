import { apiClient } from './client';
import type {
  EnrollmentOut,
  MyProgress,
  PracticeResultOut,
  QuizResultOut,
} from '@/types/api';

export const progressApi = {
  me: () => apiClient.get<MyProgress>('/api/progress/me'),

  enroll: (courseId: number) =>
    apiClient.post<EnrollmentOut>('/api/progress/enroll', { course_id: courseId }),

  completeLesson: (lessonId: number) =>
    apiClient.post('/api/progress/complete-lesson', { lesson_id: lessonId }),

  submitPractice: (lessonBlockId: number, selectedOptionIds: string[]) =>
    apiClient.post<PracticeResultOut>('/api/progress/submit-practice', {
      lesson_block_id: lessonBlockId,
      selected_option_ids: selectedOptionIds,
    }),

  submitQuiz: (lessonBlockId: number, score: number, maxScore: number) =>
    apiClient.post<QuizResultOut>('/api/progress/submit-quiz', {
      lesson_block_id: lessonBlockId,
      score,
      max_score: maxScore,
    }),
};
