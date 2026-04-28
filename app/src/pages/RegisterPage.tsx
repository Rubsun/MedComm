import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/auth';
import { Button } from '@/components/medcomm';
import { AuthShell, Field, FormError, Input } from './LoginPage';

export default function RegisterPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const set =
    (field: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register(form);
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Ошибка регистрации');
      } else {
        setError('Не удалось подключиться к серверу. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heading="Регистрация"
      subheading="Создайте аккаунт студента — займёт меньше минуты."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Имя">
            <Input
              value={form.first_name}
              onChange={set('first_name')}
              autoComplete="given-name"
              required
            />
          </Field>
          <Field label="Фамилия">
            <Input
              value={form.last_name}
              onChange={set('last_name')}
              autoComplete="family-name"
              required
            />
          </Field>
        </div>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            placeholder="you@university.ru"
            required
          />
        </Field>
        <Field label="Пароль">
          <Input
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            placeholder="Минимум 8 символов"
            minLength={8}
            required
          />
        </Field>
        {error && <FormError message={error} />}
        <Button type="submit" full size="md" disabled={loading}>
          {loading ? 'Создаём аккаунт…' : 'Создать аккаунт'}
        </Button>
        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-500)' }}>
          Уже есть аккаунт?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--teal-700)', fontWeight: 600, textDecoration: 'none' }}
          >
            Войти
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
