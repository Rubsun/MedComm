import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  User, 
  UserProgress, 
  Course, 
  Lesson, 
  Module,
  Notification,
  Achievement 
} from '@/types';

// ============================================
// STATE MANAGEMENT (Zustand)
// Аналог Redux Store для Django интеграции
// ============================================

interface AppState {
  // --- USER ---
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;

  // --- PROGRESS ---
  progress: UserProgress | null;
  setProgress: (progress: UserProgress) => void;
  completeLesson: (lessonId: string) => void;
  completeExercise: (exerciseId: string) => void;
  updateQuizResult: (quizId: string, score: number, passed: boolean) => void;
  getModuleProgress: (moduleId: string) => number;
  getCourseProgress: () => number;

  // --- COURSE NAVIGATION ---
  currentCourse: Course | null;
  currentModule: Module | null;
  currentLesson: Lesson | null;
  setCurrentCourse: (course: Course | null) => void;
  setCurrentModule: (module: Module | null) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  navigateToNextLesson: () => boolean;
  navigateToPreviousLesson: () => boolean;

  // --- UI STATE ---
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: 'theory' | 'practice' | 'resources';
  setActiveTab: (tab: 'theory' | 'practice' | 'resources') => void;

  // --- NOTIFICATIONS ---
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  // --- ACHIEVEMENTS ---
  achievements: Achievement[];
  unlockAchievement: (achievement: Achievement) => void;

  // --- PRACTICE STATE ---
  currentScenarioIndex: number;
  scenarioResults: Record<string, boolean>;
  setCurrentScenarioIndex: (index: number) => void;
  recordScenarioResult: (scenarioId: string, isCorrect: boolean) => void;
  resetPractice: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- USER ---
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        progress: null,
        currentCourse: null,
        currentModule: null,
        currentLesson: null
      }),

      // --- PROGRESS ---
      progress: null,
      setProgress: (progress) => set({ progress }),
      
      completeLesson: (lessonId) => {
        const { progress } = get();
        if (!progress) return;
        
        if (!progress.completedLessons.includes(lessonId)) {
          set({
            progress: {
              ...progress,
              completedLessons: [...progress.completedLessons, lessonId],
              lastAccessedAt: new Date().toISOString()
            }
          });
        }
      },

      completeExercise: (exerciseId) => {
        const { progress } = get();
        if (!progress) return;
        
        if (!progress.completedExercises.includes(exerciseId)) {
          set({
            progress: {
              ...progress,
              completedExercises: [...progress.completedExercises, exerciseId],
              lastAccessedAt: new Date().toISOString()
            }
          });
        }
      },

      updateQuizResult: (quizId, score, passed) => {
        const { progress } = get();
        if (!progress) return;

        const existingResult = progress.quizResults.find(r => r.quizId === quizId);
        const newResult = {
          quizId,
          score,
          maxScore: 100,
          passed,
          attempts: (existingResult?.attempts || 0) + 1,
          completedAt: new Date().toISOString()
        };

        set({
          progress: {
            ...progress,
            quizResults: [
              ...progress.quizResults.filter(r => r.quizId !== quizId),
              newResult
            ],
            lastAccessedAt: new Date().toISOString()
          }
        });
      },

      getModuleProgress: (moduleId) => {
        const { progress, currentCourse } = get();
        if (!progress || !currentCourse) return 0;

        const module = currentCourse.modules.find(m => m.id === moduleId);
        if (!module) return 0;

        const completedInModule = module.lessons.filter(
          l => progress.completedLessons.includes(l.id)
        ).length;

        return Math.round((completedInModule / module.lessons.length) * 100);
      },

      getCourseProgress: () => {
        const { progress, currentCourse } = get();
        if (!progress || !currentCourse) return 0;

        const totalLessons = currentCourse.modules.reduce(
          (acc, m) => acc + m.lessons.length, 0
        );
        
        return Math.round((progress.completedLessons.length / totalLessons) * 100);
      },

      // --- COURSE NAVIGATION ---
      currentCourse: null,
      currentModule: null,
      currentLesson: null,
      
      setCurrentCourse: (course) => set({ currentCourse: course }),
      setCurrentModule: (module) => set({ currentModule: module }),
      setCurrentLesson: (lesson) => set({ currentLesson: lesson }),

      navigateToNextLesson: () => {
        const { currentCourse, currentModule, currentLesson } = get();
        if (!currentCourse || !currentModule || !currentLesson) return false;

        const lessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
        
        // Если есть следующий урок в модуле
        if (lessonIndex < currentModule.lessons.length - 1) {
          set({ currentLesson: currentModule.lessons[lessonIndex + 1] });
          return true;
        }

        // Ищем следующий модуль
        const moduleIndex = currentCourse.modules.findIndex(m => m.id === currentModule.id);
        if (moduleIndex < currentCourse.modules.length - 1) {
          const nextModule = currentCourse.modules[moduleIndex + 1];
          set({ 
            currentModule: nextModule,
            currentLesson: nextModule.lessons[0] 
          });
          return true;
        }

        return false; // Курс завершен
      },

      navigateToPreviousLesson: () => {
        const { currentCourse, currentModule, currentLesson } = get();
        if (!currentCourse || !currentModule || !currentLesson) return false;

        const lessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
        
        // Если есть предыдущий урок в модуле
        if (lessonIndex > 0) {
          set({ currentLesson: currentModule.lessons[lessonIndex - 1] });
          return true;
        }

        // Ищем предыдущий модуль
        const moduleIndex = currentCourse.modules.findIndex(m => m.id === currentModule.id);
        if (moduleIndex > 0) {
          const prevModule = currentCourse.modules[moduleIndex - 1];
          set({ 
            currentModule: prevModule,
            currentLesson: prevModule.lessons[prevModule.lessons.length - 1] 
          });
          return true;
        }

        return false;
      },

      // --- UI STATE ---
      sidebarOpen: true,
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      activeTab: 'theory',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // --- NOTIFICATIONS ---
      notifications: [],
      addNotification: (notification) => set(state => ({
        notifications: [{
          ...notification,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        }, ...state.notifications]
      })),
      markNotificationAsRead: (id) => set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        )
      })),
      clearNotifications: () => set({ notifications: [] }),

      // --- ACHIEVEMENTS ---
      achievements: [],
      unlockAchievement: (achievement) => set(state => ({
        achievements: [...state.achievements, achievement]
      })),

      // --- PRACTICE STATE ---
      currentScenarioIndex: 0,
      scenarioResults: {},
      setCurrentScenarioIndex: (index) => set({ currentScenarioIndex: index }),
      recordScenarioResult: (scenarioId, isCorrect) => set(state => ({
        scenarioResults: { ...state.scenarioResults, [scenarioId]: isCorrect }
      })),
      resetPractice: () => set({ 
        currentScenarioIndex: 0, 
        scenarioResults: {} 
      })
    }),
    {
      name: 'medcomm-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        progress: state.progress,
        achievements: state.achievements
      })
    }
  )
);
