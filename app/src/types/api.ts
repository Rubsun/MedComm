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
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  is_published: boolean;
  sort_order: number;
}

export interface CourseOut {
  id: number;
  slug: string;
  program_id: number;
  title: string;
  description: string;
  is_published: boolean;
  sort_order: number;
}

export interface ModuleOut {
  id: number;
  slug: string;
  course_id: number;
  title: string;
  description: string;
  is_locked: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface LessonOut {
  id: number;
  slug: string;
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
  id?: number;
  lesson_block_id: number;
  selected_option_ids: string[];
  is_correct: boolean;
  completed_at: string;
}

export interface QuizResultOut {
  id?: number;
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
  active_students_last_30_days: number;
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
  created_at?: string;
}

export interface StudentProgress {
  enrollments: { course_id: number; enrolled_at: string }[];
  completed_lessons: { lesson_id: number; completed_at: string }[];
}

export interface MyProgress {
  enrollments: { course_id: number; enrolled_at: string }[];
  completed_lessons: { lesson_id: number; completed_at: string }[];
  quiz_results: {
    lesson_block_id: number;
    score: number;
    best_score: number;
    max_score: number;
    passed: boolean;
    attempts: number;
    completed_at: string;
  }[];
  practice_results: {
    lesson_block_id: number;
    selected_option_ids: string[];
    is_correct: boolean;
    completed_at: string;
  }[];
}

export type AchievementMetric =
  | 'lessons_completed'
  | 'courses_completed'
  | 'streak_days'
  | 'perfect_quizzes'
  | 'practice_count';

export type AchievementOp = '>=' | '>' | '==';

export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface AchievementOut {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string | null;
  tier: AchievementTier;
  metric: AchievementMetric;
  op: AchievementOp;
  threshold: number;
  xp: number;
  is_published: boolean;
  sort_order: number;
}

export interface AchievementWithStatus extends AchievementOut {
  unlocked: boolean;
  unlocked_at: string | null;
  current_value: number;
}

export interface StreakOut {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

// ── General tests ────────────────────────────────────────────────

export type GeneralTestKind = 'entry' | 'final';
export type GeneralTestQuestionType = 'yesno' | 'likert4' | 'scale10';

export interface GeneralTestScale {
  key: string;
  name: string;
  yes?: number[];
  no?: number[];
  direct?: number[];
  reverse?: number[];
  inverse?: number[];
  avg?: boolean;
}

export interface GeneralTestInterpretation {
  min: number;
  max: number;
  level: string;
  short: string;
  text: string;
}

export interface GeneralTestQuestionOut {
  id: number;
  sort_order: number;
  text: string;
}

export interface GeneralTestListItem {
  id: number;
  slug: string;
  kind: GeneralTestKind;
  title: string;
  method: string;
  description: string;
  question_type: GeneralTestQuestionType;
  duration: string;
  is_published: boolean;
  sort_order: number;
  questions_count: number;
  scales_count: number;
  interpretations_count: number;
}

export interface GeneralTestOut {
  id: number;
  slug: string;
  kind: GeneralTestKind;
  title: string;
  method: string;
  description: string;
  question_type: GeneralTestQuestionType;
  duration: string;
  likert_labels: string[] | null;
  scales: GeneralTestScale[];
  interpretations: GeneralTestInterpretation[];
  is_published: boolean;
  sort_order: number;
  questions: GeneralTestQuestionOut[];
}

export interface GeneralTestCreateInput {
  slug?: string;
  kind: GeneralTestKind;
  title: string;
  method?: string;
  description?: string;
  question_type: GeneralTestQuestionType;
  duration?: string;
  likert_labels?: string[] | null;
  scales?: GeneralTestScale[];
  interpretations?: GeneralTestInterpretation[];
  questions?: string[];
}

export interface GeneralTestUpdateInput {
  kind?: GeneralTestKind;
  title?: string;
  method?: string;
  description?: string;
  duration?: string;
  likert_labels?: string[] | null;
  scales?: GeneralTestScale[];
  interpretations?: GeneralTestInterpretation[];
  questions?: string[];
}

export type GeneralTestAnswer = 'yes' | 'no' | number;

export interface GeneralTestScoreBreakdownItem {
  key: string;
  name: string;
  value: number;
  max: number;
}

export interface GeneralTestScore {
  total: number;
  max: number;
  breakdown: GeneralTestScoreBreakdownItem[];
}

export interface GeneralTestInterpretationOut {
  level: string;
  short: string;
  text: string;
  min: number;
  max: number;
}

export interface GeneralTestAttemptOut {
  id: number;
  test_id: number;
  answers: Record<string, GeneralTestAnswer>;
  score: GeneralTestScore | null;
  interpretation: GeneralTestInterpretationOut | null;
  is_completed: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface GeneralTestDistributionItem {
  level: string;
  short: string;
  min: number;
  max: number;
  count: number;
}

export interface GeneralTestRecentAttempt {
  user_id: number;
  user_name: string;
  score_total: number;
  level: string;
  completed_at: string;
}

export interface GeneralTestResultsOut {
  responses: number;
  completed: number;
  avg_score: number;
  distribution: GeneralTestDistributionItem[];
  recent: GeneralTestRecentAttempt[];
}
