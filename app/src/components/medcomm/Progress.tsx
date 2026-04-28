export interface ProgressProps {
  value: number;
  max?: number;
  color?: string;
  bg?: string;
  height?: number;
  radius?: number;
  animate?: boolean;
}

export function Progress({
  value,
  max = 100,
  color = 'var(--teal-600)',
  bg = 'var(--line-soft)',
  height = 6,
  radius = 999,
  animate,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ width: '100%', height, background: bg, borderRadius: radius, overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: radius,
          transition: animate !== false ? 'width .5s cubic-bezier(.2,.9,.3,1)' : 'none',
        }}
      />
    </div>
  );
}
