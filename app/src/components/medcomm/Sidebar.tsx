import { useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type SidebarItem =
  | { section: string }
  | { key: string; label: string; icon: IconName; badge?: string | number };

export interface SidebarProps {
  items: SidebarItem[];
  current?: string;
  onNav: (key: string) => void;
  brand?: string;
  collapsed?: boolean;
  footer?: ReactNode;
  /** Опциональная кнопка переключения режима student/admin */
  mode?: 'student' | 'admin';
  onSwitchMode?: () => void;
}

export function Sidebar({
  items,
  current,
  onNav,
  brand,
  collapsed,
  footer,
  mode,
  onSwitchMode,
}: SidebarProps) {
  return (
    <aside
      style={{
        width: collapsed ? 64 : 248,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .2s',
      }}
    >
      <div
        style={{
          padding: collapsed ? '18px 12px' : '18px 18px',
          borderBottom: '1px solid var(--line-soft)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'linear-gradient(135deg, var(--teal-500), var(--teal-700))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: 'Inter Tight',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Д
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span
                style={{
                  fontFamily: 'Inter Tight',
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'var(--ink-900)',
                }}
              >
                Доктор, поговорим?
              </span>
              {brand && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'var(--ink-500)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginTop: 1,
                  }}
                >
                  {brand}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
        {items.map((item, i) => {
          if ('section' in item) {
            return (
              !collapsed && (
                <div
                  key={`s-${i}`}
                  style={{
                    padding: '14px 10px 6px',
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: 'var(--ink-400)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.section}
                </div>
              )
            );
          }
          return (
            <SidebarItemButton
              key={item.key}
              item={item}
              active={current === item.key}
              onClick={() => onNav(item.key)}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid var(--line-soft)', padding: 10 }}>
        {onSwitchMode && !collapsed && (
          <button
            onClick={onSwitchMode}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px dashed var(--line-strong)',
              background: 'transparent',
              color: 'var(--ink-600)',
              fontSize: 12.5,
              marginBottom: 8,
              cursor: 'pointer',
            }}
          >
            <Icon name="refresh" size={14} />
            <span style={{ flex: 1, textAlign: 'left' }}>
              Перейти в {mode === 'student' ? 'админку' : 'студента'}
            </span>
          </button>
        )}
        {footer}
      </div>
    </aside>
  );
}

interface ItemButtonProps {
  item: { key: string; label: string; icon: IconName; badge?: string | number };
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

function SidebarItemButton({ item, active, onClick, collapsed }: ItemButtonProps) {
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
        padding: collapsed ? '10px' : '8px 10px',
        borderRadius: 8,
        background: active ? 'var(--teal-50)' : h ? '#F4F6F9' : 'transparent',
        color: active ? 'var(--teal-700)' : h ? 'var(--ink-900)' : 'var(--ink-700)',
        border: 'none',
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        marginBottom: 2,
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: 'all .12s',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <Icon name={item.icon} size={17} />
      {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
      {!collapsed && item.badge != null && (
        <span
          style={{
            background: active ? 'var(--teal-600)' : 'var(--ink-300)',
            color: 'white',
            fontSize: 10.5,
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: 999,
            minWidth: 18,
            textAlign: 'center',
          }}
        >
          {item.badge}
        </span>
      )}
      {active && !collapsed && (
        <span
          style={{
            position: 'absolute',
            left: -10,
            top: 6,
            bottom: 6,
            width: 3,
            background: 'var(--teal-600)',
            borderRadius: 2,
          }}
        />
      )}
    </button>
  );
}
