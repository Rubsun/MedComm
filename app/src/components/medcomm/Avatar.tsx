import type { CSSProperties } from 'react';

export interface AvatarProps {
  name?: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function Avatar({ name = '', size = 32, color, style }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const bg = color ?? `hsl(${hue}, 35%, 88%)`;
  const fg = color ? '#fff' : `hsl(${hue}, 40%, 30%)`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 600,
        flexShrink: 0,
        fontFamily: 'Inter Tight',
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
