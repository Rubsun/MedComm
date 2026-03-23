import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import LessonPage from '@/pages/LessonPage';
import Profile from '@/pages/Profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, GraduationCap, Users, Award } from 'lucide-react';

// ============================================
// LOGIN PAGE
// ============================================
function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('student@test.com');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await login(email, password);
    } catch {
      setError('Неверный email или пароль');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        {/* Left Side - Info */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-3 rounded-xl">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">MedComm Platform</h1>
          </div>

          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Обучение коммуникации врача с пациентом
          </h2>

          <p className="text-slate-600 mb-8">
            Научитесь эффективно общаться с пациентами разных типов и возрастов.
            Курс основан на 28 научных исследованиях.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">12 уроков</div>
                <div className="text-sm text-slate-500">Теория + практика</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">18 упражнений</div>
                <div className="text-sm text-slate-500">Интерактивные кейсы</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Сертификат</div>
                <div className="text-sm text-slate-500">По завершении</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Вход в систему</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                placeholder="student@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Пароль</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button onClick={handleLogin} className="w-full">
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// PROTECTED ROUTE
// ============================================
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}

// ============================================
// MAIN APP
// ============================================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="lesson" element={<LessonPage />} />
            <Route path="profile" element={<Profile />} />
            <Route path="achievements" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
