// ============================================
// ТИПЫ ДАННЫХ ДЛЯ ПЛАТФОРМЫ ОБУЧЕНИЯ
// Соответствуют Django моделям (backend API)
// ============================================

// --- ПОЛЬЗОВАТЕЛЬ ---
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin';
  group?: string; // учебная группа
  yearOfStudy?: number; // курс
  createdAt: string;
}

// --- ПРОГРЕСС ОБУЧЕНИЯ ---
export interface UserProgress {
  userId: number;
  courseId: string;
  completedLessons: string[]; // IDs уроков
  completedExercises: string[]; // IDs упражнений
  quizResults: QuizResult[];
  totalProgress: number; // 0-100
  lastAccessedAt: string;
  certificates: Certificate[];
}

export interface QuizResult {
  quizId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  attempts: number;
  completedAt: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  issuedAt: string;
  pdfUrl: string;
}

// --- СТРУКТУРА КУРСА ---
export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  instructor: Instructor;
  modules: Module[];
  totalLessons: number;
  totalExercises: number;
  duration: string; // общее время
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  id: number;
  name: string;
  title: string;
  avatar: string;
  bio: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  isLocked: boolean;
  prerequisites?: string[]; // IDs модулей
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  type: 'theory' | 'practice' | 'mixed';
  duration: number; // минуты
  content: LessonContent;
  exercises: Exercise[];
  quiz?: Quiz;
  isCompleted?: boolean;
  resources: Resource[];
}

export interface LessonContent {
  theory: TheoryBlock[];
  practice?: PracticeBlock;
}

export interface TheoryBlock {
  id: string;
  type: 'text' | 'video' | 'image' | 'audio' | 'mindmap' | 'infographic';
  title: string;
  content: string;
  mediaUrl?: string;
  caption?: string;
}

export interface PracticeBlock {
  id: string;
  title: string;
  description: string;
  scenarios: Scenario[];
  instructions: string;
}

// --- УПРАЖНЕНИЯ И СЦЕНАРИИ ---
export interface Exercise {
  id: string;
  lessonId: string;
  type: 'scenario' | 'quiz' | 'simulation' | 'matching' | 'ordering';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  data: ExerciseData;
}

export type ExerciseData = 
  | ScenarioExercise 
  | QuizExercise 
  | MatchingExercise 
  | OrderingExercise;

export interface Scenario {
  id: string;
  title: string;
  patient: PatientProfile;
  situation: string;
  goal: string;
  options: ScenarioOption[];
  correctOptionId: string;
  explanation: string;
  hints: string[];
}

export interface ScenarioOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface ScenarioExercise {
  scenarios: Scenario[];
}

export interface PatientProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  temperament: 'choleric' | 'sanguine' | 'phlegmatic' | 'melancholic';
  complaint: string;
  history: string;
  behavior: string;
  avatar?: string;
}

// --- ТЕСТЫ (QUIZ) ---
export interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit?: number; // минуты
  passingScore: number; // процент
  maxAttempts: number;
  questions: Question[];
}

export type Question = 
  | SingleChoiceQuestion 
  | MultipleChoiceQuestion 
  | TextQuestion;

export interface BaseQuestion {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'text';
  text: string;
  explanation: string;
  points: number;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single_choice';
  options: Option[];
  correctOptionId: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: Option[];
  correctOptionIds: string[];
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  correctAnswer: string;
  acceptableAnswers: string[];
}

export interface Option {
  id: string;
  text: string;
}

export interface QuizExercise {
  questions: Question[];
}

// --- MATCHING / ORDERING ---
export interface MatchingExercise {
  pairs: MatchingPair[];
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface OrderingExercise {
  items: OrderingItem[];
}

export interface OrderingItem {
  id: string;
  text: string;
  correctPosition: number;
}

// --- РЕСУРСЫ ---
export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'presentation';
  url: string;
  size?: string;
}

// --- ДОСТИЖЕНИЯ ---
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
  unlockedAt?: string;
}

// --- УВЕДОМЛЕНИЯ ---
export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

// --- API RESPONSE TYPES ---
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}
