import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark' | 'soft';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { h: number; px: number; fs: number; gap: number; r: number }> = {
  xs: { h: 26, px: 10, fs: 12, gap: 4, r: 7 },
  sm: { h: 32, px: 12, fs: 13, gap: 6, r: 8 },
  md: { h: 38, px: 16, fs: 13.5, gap: 8, r: 9 },
  lg: { h: 46, px: 22, fs: 15, gap: 10, r: 11 },
};

const VARIANTS: Record<Variant, { bg: string; c: string; bd: string; hbg: string }> = {
  primary: { bg: 'var(--teal-600)', c: '#fff', bd: 'var(--teal-600)', hbg: 'var(--teal-700)' },
  secondary: { bg: 'var(--surface)', c: 'var(--ink-800)', bd: 'var(--line-strong)', hbg: '#F1F4F8' },
  ghost: { bg: 'transparent', c: 'var(--ink-700)', bd: 'transparent', hbg: '#EEF1F5' },
  danger: { bg: 'var(--surface)', c: 'var(--danger)', bd: '#F4C7C7', hbg: 'var(--danger-soft)' },
  dark: { bg: 'var(--ink-900)', c: '#fff', bd: 'var(--ink-900)', hbg: 'var(--ink-800)' },
  soft: { bg: 'var(--teal-50)', c: 'var(--teal-700)', bd: 'transparent', hbg: 'var(--teal-100)' },
};

export interface MCButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  full?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled,
  full,
  style,
  ...rest
}: MCButtonProps) {
  const sizes = SIZES[size];
  const variants = VARIANTS[variant];
  const [hover, setHover] = useState(false);
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: sizes.h,
        padding: `0 ${sizes.px}px`,
        fontSize: sizes.fs,
        gap: sizes.gap,
        borderRadius: sizes.r,
        background: hover && !disabled ? variants.hbg : variants.bg,
        color: variants.c,
        border: `1px solid ${variants.bd}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 500,
        transition: 'all .14s',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        width: full ? '100%' : undefined,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={sizes.fs + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sizes.fs + 2} />}
    </button>
  );
}
