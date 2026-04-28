import { useCallback, useState } from 'react';
import { Icon, type IconName } from './Icon';

export interface ToastItem {
  id: number;
  message: string;
  icon?: IconName;
  color?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((x) => x.id !== id)),
      t.duration ?? 4000
    );
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

export interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-up"
          style={{
            background: 'var(--ink-900)',
            color: 'white',
            padding: '12px 14px',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 280,
            maxWidth: 400,
            pointerEvents: 'auto',
          }}
        >
          <Icon name={t.icon ?? 'check'} size={16} color={t.color ?? 'var(--teal-400)'} />
          <span style={{ flex: 1, fontSize: 13 }}>{t.message}</span>
          {t.action && (
            <button
              onClick={t.action.onClick}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'var(--teal-400)',
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
