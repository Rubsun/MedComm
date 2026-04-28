import { useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  children: ReactNode;
  padding?: number | string;
  hover?: boolean;
  style?: CSSProperties;
}

export function Card({ children, padding = 20, hover, style, onClick, ...rest }: CardProps) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        border: `1px solid ${h ? 'var(--line-strong)' : 'var(--line)'}`,
        padding,
        boxShadow: h ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        transition: 'all .14s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
