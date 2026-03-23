export interface UserOut {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'admin';
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ProgramOut {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  is_published: boolean;
  sort_order: number;
}

export interface CourseOut {
  id: number;
  program_id: number;
  title: string;
  description: string;
  is_published: boolean;
  sort_order: number;
}

export interface ModuleOut {
  id: number;
  course_id: number;
  title: string;
  description: string;
  is_locked: boolean;
  sort_order: number;
}

export interface LessonOut {
  id: number;
  module_id: number;
  title: string;
  description: string;
  type: 'theory' | 'practice' | 'mixed';
  duration_min: number;
  is_published: boolean;
  sort_order: number;
}

export interface LessonBlockOut {
  id: number;
  lesson_id: number;
  type: 'text' | 'image' | 'video' | 'practice' | 'quiz';
  sort_order: number;
  data: Record<string, unknown>;
}

export interface EnrollmentOut {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: string;
}

export interface PracticeResultOut {
  id: number;
  lesson_block_id: number;
  selected_option_ids: string[];
  is_correct: boolean;
  completed_at: string;
}

export interface QuizResultOut {
  id: number;
  lesson_block_id: number;
  score: number;
  best_score: number;
  max_score: number;
  passed: boolean;
  attempts: number;
  completed_at: string;
}

export interface AnalyticsOverview {
  total_students: number;
  enrollments_per_course: { course_id: number; course_title: string; enrollment_count: number }[];
}

export interface CompletionRate {
  lesson_id: number;
  lesson_title: string;
  completed_count: number;
}

export interface QuizAnalytics {
  lesson_block_id: number;
  avg_score_pct: number | null;
  attempt_count: number;
  passed_count: number;
}

export interface StudentOut {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentProgress {
  enrollments: { course_id: number; enrolled_at: string }[];
  completed_lessons: { lesson_id: number; completed_at: string }[];
}
