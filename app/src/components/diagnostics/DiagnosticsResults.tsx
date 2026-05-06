import { useEffect, useState } from 'react';
import { generalTestsApi } from '@/api/generalTests';
import type {
  GeneralTestAttemptOut,
  GeneralTestKind,
  GeneralTestOut,
} from '@/types/api';
import { Badge, Button, Card, Icon, Progress } from '@/components/medcomm';

interface DiagnosticsResultsProps {
  kind: GeneralTestKind;
  testIds: number[];
  attempts: Map<number, GeneralTestAttemptOut>;
  onBack: () => void;
  onGoToProgram: () => void;
}

export default function DiagnosticsResults({
  kind,
  testIds,
  attempts,
  onBack,
  onGoToProgram,
}: DiagnosticsResultsProps) {
  const [tests, setTests] = useState<GeneralTestOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all(testIds.map((id) => generalTestsApi.get(id).then((r) => r.data)))
      .then((list) => setTests(list.sort((a, b) => a.sort_order - b.sort_order)))
      .finally(() => setLoading(false));
  }, [testIds]);

  if (loading) {
    return (
      <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка…</div>
    );
  }

  return (
    <div style={{ padding: '24px 32px 48px', maxWidth: 1100, margin: '0 auto' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--ink-600)',
          fontSize: 13,
          padding: 0,
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        <Icon name="arrowLeft" size={14} /> К диагностике
      </button>

      <div
        className="anim-up"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 18,
          padding: 28,
          marginBottom: 22,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'var(--teal-50)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <Badge tone="success" size="sm" icon="check" style={{ marginBottom: 12 }}>
            Диагностика завершена
          </Badge>
          <h1 style={{ fontSize: 26, marginBottom: 8 }}>
            {kind === 'entry' ? 'Ваша стартовая точка' : 'Ваш итоговый профиль'}
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--ink-600)',
              maxWidth: 640,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {kind === 'entry'
              ? 'Это ваш профиль на старте курса. В конце обучения вы пройдёте те же тесты — сможете увидеть, как изменились показатели.'
              : 'Это итоговый профиль. Сравните его со стартовым на странице диагностики, чтобы увидеть динамику.'}
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          marginBottom: 22,
        }}
      >
        {tests.map((test) => {
          const attempt = attempts.get(test.id);
          const score = attempt?.score;
          const interp = attempt?.interpretation;
          const total = score?.total ?? 0;
          const max = score?.max ?? 1;
          return (
            <Card key={test.id} padding={20}>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--ink-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {test.method}
              </div>
              <h3 style={{ fontSize: 14.5, marginBottom: 12 }}>{test.title}</h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <span
                  className="num"
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    fontFamily: 'Inter Tight',
                    color: 'var(--teal-700)',
                  }}
                >
                  {test.question_type === 'scale10' ? total.toFixed(1) : Math.round(total)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>из {max}</span>
              </div>
              <Progress value={total} max={max} height={6} />
              {interp && (
                <div style={{ marginTop: 12 }}>
                  <Badge tone="teal" size="md">
                    {interp.short}
                  </Badge>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Detailed interpretation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tests.map((test, i) => {
          const attempt = attempts.get(test.id);
          const score = attempt?.score;
          const interp = attempt?.interpretation;
          const total = score?.total ?? 0;
          const max = score?.max ?? 1;
          return (
            <Card key={test.id} padding={0}>
              <div
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--line-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: 'var(--teal-50)',
                    color: 'var(--teal-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter Tight',
                    fontWeight: 700,
                  }}
                >
                  0{i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15 }}>{test.title}</h3>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{test.method}</div>
                </div>
                <span
                  className="num"
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'Inter Tight',
                    color: 'var(--ink-900)',
                  }}
                >
                  {test.question_type === 'scale10' ? total.toFixed(1) : Math.round(total)}
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--ink-500)',
                      fontWeight: 400,
                      marginLeft: 4,
                    }}
                  >
                    / {max}
                  </span>
                </span>
              </div>
              <div
                style={{
                  padding: '18px 22px',
                  display: 'grid',
                  gridTemplateColumns: (score?.breakdown.length ?? 0) > 0 ? '1fr 1.4fr' : '1fr',
                  gap: 24,
                }}
              >
                {(score?.breakdown.length ?? 0) > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--ink-500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontWeight: 600,
                        marginBottom: 10,
                      }}
                    >
                      Шкалы
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {score!.breakdown.map((b) => (
                        <div key={b.key}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12.5,
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ color: 'var(--ink-700)' }}>{b.name}</span>
                            <span className="num" style={{ color: 'var(--ink-500)' }}>
                              {b.value}/{b.max}
                            </span>
                          </div>
                          <Progress value={b.value} max={b.max} height={4} color="var(--teal-500)" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--ink-500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 600,
                      marginBottom: 10,
                    }}
                  >
                    Интерпретация{interp ? ` · ${interp.level}` : ''}
                  </div>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: 'var(--ink-700)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {interp?.text || 'Интерпретация недоступна.'}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card
        padding={22}
        style={{
          marginTop: 22,
          background: 'linear-gradient(135deg, #ECFBFA 0%, #FFFFFF 70%)',
          border: '1px solid var(--teal-100)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>
              {kind === 'entry' ? 'Готовы начать обучение?' : 'Готовы сравнить результаты?'}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: 'var(--ink-600)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {kind === 'entry'
                ? 'Перейдите к программе курса. В конце обучения вы пройдёте те же тесты и увидите динамику.'
                : 'Сравнение «до/после» доступно на странице диагностики.'}
            </p>
          </div>
          <Button variant="primary" icon="map" onClick={onGoToProgram}>
            К программе
          </Button>
        </div>
      </Card>
    </div>
  );
}
