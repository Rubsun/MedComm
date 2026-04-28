import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Card, Icon } from '@/components/medcomm';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Неверный email или пароль');
      } else {
        setError('Не удалось подключиться к серверу. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heading="Вход в платформу"
      subheading="Войдите, чтобы продолжить обучение или работу с курсами."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.ru"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Пароль">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </Field>
        {error && <FormError message={error} />}
        <Button type="submit" full size="md" disabled={loading}>
          {loading ? 'Вход…' : 'Войти'}
        </Button>
        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-500)' }}>
          Ещё нет аккаунта?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--teal-700)', fontWeight: 600, textDecoration: 'none' }}
          >
            Зарегистрироваться
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Reusable auth shell (используется и в RegisterPage)
// ──────────────────────────────────────────────────────────────────────────

export function AuthShell({
  heading,
  subheading,
  children,
}: {
  heading: string;
  subheading: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          padding: '64px 56px',
          background: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(45, 212, 191, 0.18)',
            filter: 'blur(60px)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter Tight',
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              Д
            </div>
            <div>
              <div style={{ fontFamily: 'Inter Tight', fontWeight: 700, fontSize: 17 }}>
                Доктор, поговорим?
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Платформа обучения
              </div>
            </div>
          </div>
          <h1
            style={{
              color: 'white',
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 480,
              marginBottom: 18,
            }}
          >
            Учитесь общаться с пациентами уверенно и по-человечески.
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.55,
              opacity: 0.85,
              maxWidth: 480,
            }}
          >
            Интерактивные сценарии, разбор реальных кейсов и обратная связь от преподавателей.
            Курсы по модели Calgary–Cambridge, эмпатии, сложным разговорам и SPIKES.
          </p>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 32,
          }}
        >
          <Badge tone="dark" size="md" icon="grad">
            Программа курса
          </Badge>
          <Badge tone="dark" size="md" icon="users">
            Кейсы и практика
          </Badge>
          <Badge tone="dark" size="md" icon="cert">
            Сертификат
          </Badge>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Card padding={32} style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{heading}</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink-500)', marginBottom: 22 }}>{subheading}</p>
          {children}
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Form helpers (минимум, без shadcn — единый стиль)
// ──────────────────────────────────────────────────────────────────────────

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--ink-700)',
          letterSpacing: '0.01em',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        height: 38,
        padding: '0 12px',
        borderRadius: 9,
        border: '1px solid var(--line-strong)',
        background: 'var(--surface)',
        color: 'var(--ink-900)',
        fontSize: 13.5,
        fontFamily: 'inherit',
        transition: 'border-color .14s, box-shadow .14s',
        outline: 'none',
        ...props.style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--teal-500)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.15)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--line-strong)';
        e.currentTarget.style.boxShadow = 'none';
        props.onBlur?.(e);
      }}
    />
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 9,
        background: 'var(--danger-soft)',
        color: 'var(--danger)',
        fontSize: 12.5,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Icon name="warning" size={14} />
      {message}
    </div>
  );
}
