import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Avatar } from './Avatar';
import { Icon, type IconName } from './Icon';

export interface TopbarUser {
  name: string;
  role: string;
}

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: string[];
  user: TopbarUser;
  onLogout?: () => void;
  onProfile?: () => void;
  right?: ReactNode;
}

export function Topbar({
  title,
  subtitle,
  breadcrumbs,
  user,
  onLogout,
  onProfile,
  right,
}: TopbarProps) {
  const [showUser, setShowUser] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showUser) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowUser(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showUser]);

  return (
    <header
      style={{
        height: 60,
        padding: '0 24px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--ink-500)',
              marginBottom: 1,
            }}
          >
            {breadcrumbs.map((b, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <Icon name="chevronRight" size={11} />}
                <span style={{ color: i === breadcrumbs.length - 1 ? 'var(--ink-700)' : undefined }}>
                  {b}
                </span>
              </span>
            ))}
          </div>
        )}
        {title && <h1 style={{ fontSize: 18, fontWeight: 600 }}>{title}</h1>}
        {subtitle && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 1 }}>{subtitle}</div>
        )}
      </div>

      {right}

      <div style={{ position: 'relative' }} ref={ref}>
        <button
          onClick={() => setShowUser((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px 4px 4px',
            border: '1px solid var(--line)',
            borderRadius: 8,
            background: showUser ? 'var(--bg-soft)' : 'var(--surface)',
            cursor: 'pointer',
          }}
        >
          <Avatar name={user.name} size={28} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              lineHeight: 1.1,
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-900)' }}>
              {user.name}
            </span>
            <span style={{ fontSize: 10.5, color: 'var(--ink-500)' }}>{user.role}</span>
          </div>
        </button>
        {showUser && (
          <div
            className="anim-down"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: 220,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              boxShadow: 'var(--shadow-lg)',
              padding: 6,
              zIndex: 100,
            }}
          >
            {onProfile && (
              <DropdownItem
                icon="user"
                label="Профиль"
                onClick={() => {
                  setShowUser(false);
                  onProfile();
                }}
              />
            )}
            {onLogout && (
              <>
                <div style={{ height: 1, background: 'var(--line-soft)', margin: '4px 0' }} />
                <DropdownItem
                  icon="logout"
                  label="Выйти"
                  danger
                  onClick={() => {
                    setShowUser(false);
                    onLogout();
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

interface DropdownItemProps {
  icon: IconName;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

function DropdownItem({ icon, label, onClick, danger }: DropdownItemProps) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 6,
        border: 'none',
        background: h ? (danger ? 'var(--danger-soft)' : '#F4F6F9') : 'transparent',
        color: danger ? 'var(--danger)' : 'var(--ink-800)',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );
}
