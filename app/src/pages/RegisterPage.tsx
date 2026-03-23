import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await authApi.register(form);
      await login(form.email, form.password);
      navigate('/');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-3 rounded-xl">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MedComm Platform</h1>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Регистрация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Имя</label>
                <Input value={form.first_name} onChange={set('first_name')} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Фамилия</label>
                <Input value={form.last_name} onChange={set('last_name')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input type="email" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Пароль</label>
              <Input type="password" value={form.password} onChange={set('password')} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleRegister} className="w-full" disabled={loading}>
              {loading ? 'Регистрация...' : 'Создать аккаунт'}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">Войти</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
