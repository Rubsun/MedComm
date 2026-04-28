import { Card } from './Card';
import { Badge } from './Badge';

type Tone = 'neutral' | 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'dark';

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaLabel?: string;
  trend?: 'up' | 'down';
  tone?: Tone;
}

export function KpiCard({ label, value, delta, deltaLabel, trend, tone = 'neutral' }: KpiCardProps) {
  const badgeTone: Tone = trend === 'up' ? 'success' : trend === 'down' ? 'danger' : tone;
  return (
    <Card padding={18}>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--ink-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, marginBottom: 8 }}>
        <span
          className="num"
          style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Inter Tight', color: 'var(--ink-900)' }}
        >
          {value}
        </span>
      </div>
      {(delta || deltaLabel) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {delta && (
            <Badge
              tone={badgeTone}
              size="sm"
              icon={trend === 'up' ? 'arrowUp' : trend === 'down' ? 'arrowDown' : undefined}
            >
              {delta}
            </Badge>
          )}
          {deltaLabel && (
            <span style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{deltaLabel}</span>
          )}
        </div>
      )}
    </Card>
  );
}
