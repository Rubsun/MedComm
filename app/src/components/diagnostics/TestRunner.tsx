import { useEffect, useMemo, useRef, useState } from 'react';
import type { GeneralTestAnswer, GeneralTestOut } from '@/types/api';
import { Button, Icon, Progress } from '@/components/medcomm';

interface TestRunnerProps {
  test: GeneralTestOut;
  initialAnswers: Record<string, GeneralTestAnswer>;
  stepLabel: string;
  onCancel: () => void;
  onSaveAnswers: (answers: Record<string, GeneralTestAnswer>) => void;
  onComplete: (answers: Record<string, GeneralTestAnswer>) => void;
}

function ChoiceButton({
  selected,
  onClick,
  label,
  hint,
  prefix,
  full,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  prefix?: number | string;
  full?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '16px 18px',
        borderRadius: 12,
        border: `1.5px solid ${
          selected ? 'var(--teal-500)' : hover ? 'var(--line-strong)' : 'var(--line)'
        }`,
        background: selected ? 'var(--teal-50)' : hover ? 'var(--bg-soft)' : 'var(--surface)',
        color: 'var(--ink-900)',
        fontSize: 15,
        fontWeight: 500,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'all .14s',
        cursor: 'pointer',
        width: full ? '100%' : 'auto',
        fontFamily: 'inherit',
      }}
    >
      {prefix != null && (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            background: selected ? 'var(--teal-600)' : 'var(--bg-soft)',
            color: selected ? 'white' : 'var(--ink-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter Tight',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {prefix}
        </span>
      )}
      <span style={{ flex: 1 }}>{label}</span>
      {hint && (
        <span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 400 }}>{hint}</span>
      )}
      {selected && <Icon name="check" size={18} color="var(--teal-600)" />}
    </button>
  );
}

function Scale10Picker({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--ink-500)',
          marginBottom: 14,
        }}
      >
        <span>1 — полностью не согласен</span>
        <span>10 — полностью согласен</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const sel = value === n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              style={{
                height: 56,
                borderRadius: 10,
                border: `1.5px solid ${sel ? 'var(--teal-500)' : 'var(--line)'}`,
                background: sel ? 'var(--teal-600)' : 'var(--surface)',
                color: sel ? 'white' : 'var(--ink-700)',
                fontFamily: 'Inter Tight',
                fontWeight: 700,
                fontSize: 18,
                cursor: 'pointer',
                transition: 'all .12s',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      {value != null && (
        <div
          className="anim-fade"
          style={{
            marginTop: 14,
            fontSize: 13,
            color: 'var(--ink-600)',
            textAlign: 'center',
          }}
        >
          Выбрано: <b style={{ color: 'var(--teal-700)' }}>{value}</b> из 10
        </div>
      )}
    </div>
  );
}

export default function TestRunner({
  test,
  initialAnswers,
  stepLabel,
  onCancel,
  onSaveAnswers,
  onComplete,
}: TestRunnerProps) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, GeneralTestAnswer>>(
    () => ({ ...initialAnswers }),
  );

  const total = test.questions.length;
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => /^\d+$/.test(k)).length,
    [answers],
  );
  const progress = total === 0 ? 0 : (answeredCount / total) * 100;

  // автосейв с дебаунсом 500мс
  const saveTimer = useRef<number | null>(null);
  const lastSaved = useRef<string>(JSON.stringify(initialAnswers));
  useEffect(() => {
    const serialized = JSON.stringify(answers);
    if (serialized === lastSaved.current) return;
    if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      lastSaved.current = serialized;
      onSaveAnswers(answers);
    }, 500);
    return () => {
      if (saveTimer.current != null) window.clearTimeout(saveTimer.current);
    };
  }, [answers, onSaveAnswers]);

  if (total === 0) {
    return (
      <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>
        В этом тесте нет вопросов. Обратитесь к администратору.
      </div>
    );
  }

  const setAnswer = (val: GeneralTestAnswer) => {
    const next = { ...answers, [String(idx)]: val };
    setAnswers(next);
    if (test.question_type !== 'scale10') {
      window.setTimeout(() => {
        if (idx < total - 1) {
          setIdx(idx + 1);
        } else {
          onComplete(next);
        }
      }, 220);
    }
  };

  const goNext = () => {
    if (answers[String(idx)] == null) return;
    if (idx < total - 1) setIdx(idx + 1);
    else onComplete(answers);
  };
  const goPrev = () => idx > 0 && setIdx(idx - 1);

  const current = test.questions[idx];
  const value = answers[String(idx)];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          padding: '14px 32px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--ink-600)',
            fontSize: 13,
            padding: 6,
            cursor: 'pointer',
          }}
        >
          <Icon name="arrowLeft" size={14} /> К списку тестов
        </button>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxWidth: 700,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5 }}>
            <span
              style={{
                color: 'var(--ink-500)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {stepLabel}
            </span>
            <span style={{ color: 'var(--ink-400)' }}>·</span>
            <span style={{ color: 'var(--ink-700)', fontWeight: 500 }}>{test.title}</span>
            <span style={{ flex: 1 }} />
            <span className="num" style={{ color: 'var(--ink-500)' }}>
              {idx + 1} / {total}
            </span>
          </div>
          <Progress value={progress} height={4} />
        </div>
        <div style={{ width: 130 }} />
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 32px',
        }}
      >
        <div key={idx} className="anim-up" style={{ width: '100%', maxWidth: 720 }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              color: 'var(--teal-600)',
              marginBottom: 16,
              letterSpacing: '0.04em',
            }}
          >
            ВОПРОС {String(idx + 1).padStart(2, '0')}
          </div>
          <h2
            style={{
              fontSize: 26,
              lineHeight: 1.35,
              color: 'var(--ink-900)',
              marginBottom: 32,
              letterSpacing: '-0.015em',
            }}
          >
            {current.text}
          </h2>

          {test.question_type === 'yesno' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                maxWidth: 480,
              }}
            >
              {[
                { v: 'yes', label: 'Да', hint: 'согласен' },
                { v: 'no', label: 'Нет', hint: 'не согласен' },
              ].map((opt) => (
                <ChoiceButton
                  key={opt.v}
                  selected={value === opt.v}
                  onClick={() => setAnswer(opt.v as 'yes' | 'no')}
                  label={opt.label}
                  hint={opt.hint}
                />
              ))}
            </div>
          )}

          {test.question_type === 'likert4' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(test.likert_labels ?? ['1', '2', '3', '4']).map((lbl, vi) => (
                <ChoiceButton
                  key={vi}
                  selected={value === vi + 1}
                  onClick={() => setAnswer(vi + 1)}
                  label={lbl}
                  prefix={vi + 1}
                  full
                />
              ))}
            </div>
          )}

          {test.question_type === 'scale10' && (
            <Scale10Picker
              value={typeof value === 'number' ? value : undefined}
              onChange={(v) => setAnswers({ ...answers, [String(idx)]: v })}
            />
          )}
        </div>
      </div>

      <div
        style={{
          padding: '14px 32px',
          borderTop: '1px solid var(--line)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Button variant="ghost" icon="chevronLeft" disabled={idx === 0} onClick={goPrev}>
          Назад
        </Button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--ink-500)' }}>
          {test.question_type === 'scale10'
            ? 'Выберите оценку и нажмите «Далее»'
            : 'Выберите вариант — переход автоматический'}
        </div>
        <Button
          variant="primary"
          iconRight={idx === total - 1 ? 'check' : 'chevronRight'}
          disabled={value == null}
          onClick={goNext}
        >
          {idx === total - 1 ? 'Завершить' : 'Далее'}
        </Button>
      </div>
    </div>
  );
}
