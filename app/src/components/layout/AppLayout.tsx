import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar, type SidebarItem } from '@/components/medcomm';

const STUDENT_NAV: SidebarItem[] = [
  { section: 'Обучение' },
  { key: 'dashboard', label: 'Главная', icon: 'home' },
  { key: 'program', label: 'Программа', icon: 'map' },
  { section: 'Прогресс' },
  { key: 'achievements', label: 'Достижения', icon: 'trophy' },
  { key: 'profile', label: 'Профиль', icon: 'user' },
  { section: 'О платформе' },
  { key: 'about', label: 'О проекте', icon: 'info' },
];

const KEY_TO_PATH: Record<string, string> = {
  dashboard: '/',
  program: '/program',
  achievements: '/achievements',
  profile: '/profile',
  about: '/about',
};

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentKey = useMemo(() => {
    const p = location.pathname;
    if (p === '/' || p === '') return 'dashboard';
    if (p.startsWith('/program')) return 'program';
    if (p.startsWith('/achievements')) return 'achievements';
    if (p.startsWith('/profile')) return 'profile';
    if (p.startsWith('/about')) return 'about';
    if (p.startsWith('/lesson')) return 'program'; // подсветим программу при чтении урока
    return undefined;
  }, [location.pathname]);

  const handleNav = (key: string) => {
    const path = KEY_TO_PATH[key];
    if (path) navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar
        items={STUDENT_NAV}
        current={currentKey}
        onNav={handleNav}
        brand="Студент"
        mode="student"
        onSwitchMode={isAdmin ? () => navigate('/admin') : undefined}
        footer={
          <UserFooter
            name={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Пользователь'}
            email={user?.email ?? ''}
            onLogout={handleLogout}
          />
        }
      />
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  );
}

function UserFooter({
  name,
  email,
  onLogout,
}: {
  name: string;
  email: string;
  onLogout: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '6px 4px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '6px 8px',
          background: 'var(--bg-soft)',
          borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-900)' }}>{name}</span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--ink-500)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {email}
        </span>
      </div>
      <button
        onClick={onLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '8px 10px',
          fontSize: 12.5,
          fontWeight: 500,
          background: 'transparent',
          color: 'var(--ink-600)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Выйти
      </button>
    </div>
  );
}
