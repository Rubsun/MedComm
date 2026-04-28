import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface EmptyProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function Empty({ icon = 'sparkles', title, description, action }: EmptyProps) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'var(--teal-50)',
          color: 'var(--teal-600)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Icon name={icon} size={26} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{title}</h3>
      {description && (
        <p style={{ fontSize: 13, color: 'var(--ink-500)', maxWidth: 360, margin: '0 auto 18px' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
