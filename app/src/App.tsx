import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import LessonPage from '@/pages/LessonPage';
import Profile from '@/pages/Profile';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProgramPage from '@/pages/ProgramPage';
import AboutPage from '@/pages/AboutPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage';
import ProgramsPage from '@/pages/admin/ProgramsPage';
import CoursesPage from '@/pages/admin/CoursesPage';
import LessonsPage from '@/pages/admin/LessonsPage';
import LessonEditorPage from '@/pages/admin/LessonEditorPage';
import StudentsPage from '@/pages/admin/StudentsPage';
import StudentProgressPage from '@/pages/admin/StudentProgressPage';
import AnalyticsPage from '@/pages/admin/AnalyticsPage';
import AchievementsAdminPage from '@/pages/admin/AchievementsAdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--ink-500)',
        fontSize: 13,
      }}
    >
      Загрузка…
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="program" element={<ProgramPage />} />
            <Route path="program/:programId" element={<ProgramPage />} />
            <Route path="lesson/:lessonId" element={<LessonPage />} />
            <Route path="profile" element={<Profile />} />
            <Route path="achievements" element={<Profile />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="programs/:programId/courses" element={<CoursesPage />} />
            <Route path="courses/:courseId/lessons" element={<LessonsPage />} />
            <Route path="lessons/:lessonId/editor" element={<LessonEditorPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:studentId" element={<StudentProgressPage />} />
            <Route path="achievements" element={<AchievementsAdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
