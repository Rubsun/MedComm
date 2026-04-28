import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar, type SidebarItem } from '@/components/medcomm';

const ADMIN_NAV: SidebarItem[] = [
  { section: 'Платформа' },
  { key: 'overview', label: 'Обзор', icon: 'home' },
  { key: 'analytics', label: 'Аналитика', icon: 'chart' },
  { section: 'Контент' },
  { key: 'programs', label: 'Программы', icon: 'layers' },
  { key: 'achievements', label: 'Достижения', icon: 'trophy' },
  { section: 'Сообщество' },
  { key: 'students', label: 'Студенты', icon: 'users' },
];

const KEY_TO_PATH: Record<string, string> = {
  overview: '/admin',
  analytics: '/admin/analytics',
  programs: '/admin/programs',
  achievements: '/admin/achievements',
  students: '/admin/students',
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentKey = useMemo(() => {
    const p = location.pathname;
    if (p === '/admin' || p === '/admin/') return 'overview';
    if (p.startsWith('/admin/analytics')) return 'analytics';
    if (
      p.startsWith('/admin/programs') ||
      p.startsWith('/admin/courses') ||
      p.startsWith('/admin/lessons')
    )
      return 'programs';
    if (p.startsWith('/admin/achievements')) return 'achievements';
    if (p.startsWith('/admin/students')) return 'students';
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
        items={ADMIN_NAV}
        current={currentKey}
        onNav={handleNav}
        brand="Админ"
        mode="admin"
        onSwitchMode={() => navigate('/')}
        footer={
          <UserFooter
            name={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Администратор'}
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
