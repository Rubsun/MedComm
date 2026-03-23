import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, GraduationCap, Users, Award } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
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
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><GraduationCap className="w-5 h-5 text-blue-600" /></div>
              <div><div className="font-semibold text-slate-800">Теория + практика</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><Users className="w-5 h-5 text-green-600" /></div>
              <div><div className="font-semibold text-slate-800">Интерактивные кейсы</div></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg"><Award className="w-5 h-5 text-amber-600" /></div>
              <div><div className="font-semibold text-slate-800">Сертификат</div></div>
            </div>
          </div>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Вход в систему</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Пароль</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-blue-600 hover:underline">Зарегистрироваться</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
