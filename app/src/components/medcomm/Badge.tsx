import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Tone = 'neutral' | 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'dark';
type Size = 'sm' | 'md';

const TONES: Record<Tone, { bg: string; c: string; dotc: string }> = {
  neutral: { bg: '#EEF1F5', c: 'var(--ink-700)', dotc: 'var(--ink-400)' },
  teal: { bg: 'var(--teal-50)', c: 'var(--teal-700)', dotc: 'var(--teal-500)' },
  success: { bg: 'var(--success-soft)', c: '#047857', dotc: 'var(--success)' },
  warning: { bg: 'var(--warning-soft)', c: '#B45309', dotc: 'var(--warning)' },
  danger: { bg: 'var(--danger-soft)', c: '#B91C1C', dotc: 'var(--danger)' },
  info: { bg: 'var(--info-soft)', c: '#1D4ED8', dotc: 'var(--info)' },
  dark: { bg: '#1E2A3D', c: '#fff', dotc: '#A6EBE5' },
};

const SIZES: Record<Size, { h: number; px: number; fs: number }> = {
  sm: { h: 22, px: 8, fs: 11.5 },
  md: { h: 26, px: 10, fs: 12.5 },
};

export interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  icon?: IconName;
  dot?: boolean;
  style?: CSSProperties;
}

export function Badge({ children, tone = 'neutral', size = 'sm', icon, dot, style }: BadgeProps) {
  const tones = TONES[tone];
  const sizes = SIZES[size];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: sizes.h,
        padding: `0 ${sizes.px}px`,
        borderRadius: 999,
        background: tones.bg,
        color: tones.c,
        fontSize: sizes.fs,
        fontWeight: 500,
        lineHeight: 1,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{ width: 6, height: 6, borderRadius: 999, background: tones.dotc }}
        />
      )}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}
