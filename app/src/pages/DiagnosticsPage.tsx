import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generalTestsApi } from '@/api/generalTests';
import type {
  GeneralTestAnswer,
  GeneralTestAttemptOut,
  GeneralTestKind,
  GeneralTestListItem,
  GeneralTestOut,
} from '@/types/api';
import {
  Badge,
  Button,
  Card,
  Icon,
  ToastViewport,
  useToasts,
} from '@/components/medcomm';
import TestRunner from '@/components/diagnostics/TestRunner';
import DiagnosticsResults from '@/components/diagnostics/DiagnosticsResults';

type Stage =
  | { kind: 'hub' }
  | { kind: 'running'; testId: number }
  | { kind: 'results' };

interface SectionProps {
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: 'info' | 'teal';
  tests: GeneralTestListItem[];
  attempts: Map<number, GeneralTestAttemptOut>;
  onStart: (testId: number) => void;
  onShowResults: () => void;
  onRefresh: () => void;
}

function Section({
  title,
  subtitle,
  badge,
  badgeTone,
  tests,
  attempts,
  onStart,
  onShowResults,
}: SectionProps) {
  if (tests.length === 0) {
    return (
      <Card padding={22} style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>{title}</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>
          В этой категории пока нет опубликованных тестов.
        </p>
      </Card>
    );
  }
  const completedCount = tests.filter((t) => attempts.get(t.id)?.is_completed).length;
  const allDone = completedCount === tests.length && tests.length > 0;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Badge tone={badgeTone} size="sm">
              {badge}
            </Badge>
            <h2 style={{ fontSize: 20, margin: 0 }}>{title}</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: 0 }}>{subtitle}</p>
        </div>
        <span
          className="num"
          style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: 'Inter Tight' }}
        >
          {completedCount}/{tests.length}
        </span>
      </div>

      <Card padding={20} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: `conic-gradient(var(--teal-500) ${
                tests.length ? (completedCount / tests.length) * 360 : 0
              }deg, var(--line-soft) 0)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter Tight',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--teal-700)',
              }}
            >
              {completedCount}/{tests.length}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, marginBottom: 3 }}>
              {allDone
                ? 'Все тесты пройдены'
                : completedCount > 0
                ? 'Продолжите диагностику'
                : 'Заполните опросники'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-600)', margin: 0 }}>
              {allDone
                ? 'Вы можете посмотреть сводные результаты или перепройти отдельный тест.'
                : 'Прогресс сохраняется автоматически.'}
            </p>
          </div>
          {allDone && (
            <Button variant="primary" icon="chart" onClick={onShowResults}>
              Посмотреть результаты
            </Button>
          )}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tests.map((t, i) => {
          const attempt = attempts.get(t.id);
          const answered = attempt
            ? Object.keys(attempt.answers || {}).filter((k) => /^\d+$/.test(k)).length
            : 0;
          const done = !!attempt?.is_completed;
          const inProgress = !done && answered > 0;
          return (
            <Card key={t.id} padding={0}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div
                  style={{
                    width: 6,
                    background: done
                      ? 'var(--success)'
                      : inProgress
                      ? 'var(--warning)'
                      : 'var(--line)',
                    borderRadius: '14px 0 0 14px',
                  }}
                />
                <div
                  style={{
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      flexShrink: 0,
                      background: done ? 'var(--success-soft)' : 'var(--teal-50)',
                      color: done ? 'var(--success)' : 'var(--teal-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Inter Tight',
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {done ? <Icon name="check" size={20} /> : `0${i + 1}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: 600,
                          color: 'var(--ink-900)',
                          fontFamily: 'Inter Tight',
                        }}
                      >
                        {t.title}
                      </span>
                      <Badge tone="neutral" size="sm">
                        {t.method}
                      </Badge>
                      {done && (
                        <Badge tone="success" size="sm" icon="check">
                          Пройден
                        </Badge>
                      )}
                      {inProgress && (
                        <Badge tone="warning" size="sm">
                          {answered}/{t.questions_count}
                        </Badge>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--ink-600)',
                        lineHeight: 1.5,
                        marginBottom: 6,
                      }}
                    >
                      {t.description}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 14,
                        fontSize: 11.5,
                        color: 'var(--ink-500)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="clock" size={12} /> {t.duration}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="list" size={12} /> {t.questions_count} вопросов
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="bar" size={12} />{' '}
                        {t.scales_count} {t.scales_count === 1 ? 'шкала' : 'шкал'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={done ? 'secondary' : 'primary'}
                    icon={done ? 'refresh' : inProgress ? 'play' : 'arrowRight'}
                    onClick={() => onStart(t.id)}
                  >
                    {done ? 'Перепройти' : inProgress ? 'Продолжить' : 'Начать'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function DiagnosticsPage() {
  const navigate = useNavigate();
  const { toasts, push: toast, dismiss } = useToasts();
  const [stage, setStage] = useState<Stage>({ kind: 'hub' });
  const [tests, setTests] = useState<GeneralTestListItem[]>([]);
  const [attempts, setAttempts] = useState<Map<number, GeneralTestAttemptOut>>(new Map());
  const [activeTest, setActiveTest] = useState<GeneralTestOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [resultsKind, setResultsKind] = useState<GeneralTestKind>('entry');

  const reload = useCallback(async () => {
    const [testsRes, attemptsRes] = await Promise.all([
      generalTestsApi.list(),
      generalTestsApi.myAttempts(),
    ]);
    setTests(testsRes.data);
    const map = new Map<number, GeneralTestAttemptOut>();
    for (const a of attemptsRes.data) map.set(a.test_id, a);
    setAttempts(map);
  }, []);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  const entryTests = useMemo(
    () => tests.filter((t) => t.kind === 'entry').sort((a, b) => a.sort_order - b.sort_order),
    [tests],
  );
  const finalTests = useMemo(
    () => tests.filter((t) => t.kind === 'final').sort((a, b) => a.sort_order - b.sort_order),
    [tests],
  );

  const handleStart = async (testId: number) => {
    try {
      const [testRes, attemptRes] = await Promise.all([
        generalTestsApi.get(testId),
        generalTestsApi.startAttempt(testId),
      ]);
      let attempt = attemptRes.data;
      // Перепрохождение: если попытка уже завершена — обнуляем ответы на сервере,
      // чтобы пользователь начинал с чистого листа (прогресс 0/N, без подсветки старых ответов).
      if (attempt.is_completed) {
        const reset = await generalTestsApi.saveAnswers(testId, {});
        attempt = reset.data;
      }
      setActiveTest(testRes.data);
      const next = new Map(attempts);
      next.set(testId, attempt);
      setAttempts(next);
      setStage({ kind: 'running', testId });
    } catch {
      toast({ message: 'Не удалось открыть тест', icon: 'warning', color: 'var(--danger)' });
    }
  };

  const handleSaveAnswers = async (
    testId: number,
    next: Record<string, GeneralTestAnswer>,
  ) => {
    try {
      const res = await generalTestsApi.saveAnswers(testId, next);
      const map = new Map(attempts);
      map.set(testId, res.data);
      setAttempts(map);
    } catch {
      // тихо, чтобы не спамить — финальный complete всё равно перепосчитает
    }
  };

  const handleComplete = async (
    testId: number,
    answers: Record<string, GeneralTestAnswer>,
  ) => {
    try {
      const res = await generalTestsApi.completeAttempt(testId, answers);
      const map = new Map(attempts);
      map.set(testId, res.data);
      setAttempts(map);
      setActiveTest(null);
      const kind = tests.find((t) => t.id === testId)?.kind ?? 'entry';
      setResultsKind(kind);
      const all = (kind === 'entry' ? entryTests : finalTests).every((t) =>
        t.id === testId ? true : map.get(t.id)?.is_completed,
      );
      if (all) {
        setStage({ kind: 'results' });
        toast({
          message: 'Диагностика завершена — посмотрите результаты',
          icon: 'check',
        });
      } else {
        setStage({ kind: 'hub' });
      }
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast({
        message: detail || 'Не удалось завершить тест',
        icon: 'warning',
        color: 'var(--danger)',
      });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка…</div>
    );
  }

  if (stage.kind === 'running' && activeTest) {
    const initialAnswers = (attempts.get(stage.testId)?.answers ?? {}) as Record<
      string,
      GeneralTestAnswer
    >;
    return (
      <>
        <TestRunner
          test={activeTest}
          initialAnswers={initialAnswers}
          stepLabel={
            activeTest.kind === 'entry' ? 'Входное тестирование' : 'Итоговое тестирование'
          }
          onCancel={() => {
            setActiveTest(null);
            setStage({ kind: 'hub' });
          }}
          onSaveAnswers={(next) => handleSaveAnswers(stage.testId, next)}
          onComplete={(next) => handleComplete(stage.testId, next)}
        />
        <ToastViewport toasts={toasts} onDismiss={dismiss} />
      </>
    );
  }

  if (stage.kind === 'results') {
    const list = resultsKind === 'entry' ? entryTests : finalTests;
    return (
      <>
        <DiagnosticsResults
          kind={resultsKind}
          testIds={list.map((t) => t.id)}
          attempts={attempts}
          onBack={() => setStage({ kind: 'hub' })}
          onGoToProgram={() => navigate('/program')}
        />
        <ToastViewport toasts={toasts} onDismiss={dismiss} />
      </>
    );
  }

  return (
    <div style={{ padding: '24px 32px 48px', maxWidth: 1100, margin: '0 auto' }}>
      <div
        className="anim-up"
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)',
          borderRadius: 18,
          padding: 32,
          color: 'white',
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
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(45, 212, 191, 0.18)',
            filter: 'blur(40px)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 720 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              fontSize: 12,
              opacity: 0.85,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <Icon name="target" size={13} /> Диагностические тесты
          </div>
          <h1
            style={{ color: 'white', fontSize: 26, marginBottom: 10, fontFamily: 'Inter Tight' }}
          >
            Оцените свою стартовую точку
          </h1>
          <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, margin: 0, marginBottom: 18 }}>
            Это не экзамен и не оценка «хорошо/плохо» — это диагностика, которая поможет
            платформе показать ваш личный прогресс в конце курса. Отвечайте честно и не
            задумывайтесь слишком долго.
          </p>
          <div style={{ display: 'flex', gap: 14, fontSize: 12.5, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9 }}>
              <Icon name="clock" size={13} /> 20–25 минут
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9 }}>
              <Icon name="lock" size={13} /> Конфиденциально
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9 }}>
              <Icon name="refresh" size={13} /> Повтор в конце курса
            </span>
          </div>
        </div>
      </div>

      <Section
        title="Входное тестирование"
        subtitle="Пройдите перед началом курса — это ваш стартовый профиль"
        badge="Входные"
        badgeTone="info"
        tests={entryTests}
        attempts={attempts}
        onStart={handleStart}
        onShowResults={() => {
          setResultsKind('entry');
          setStage({ kind: 'results' });
        }}
        onRefresh={reload}
      />

      <Section
        title="Итоговое тестирование"
        subtitle="Те же шкалы — для сравнения «до/после»"
        badge="Итоговые"
        badgeTone="teal"
        tests={finalTests}
        attempts={attempts}
        onStart={handleStart}
        onShowResults={() => {
          setResultsKind('final');
          setStage({ kind: 'results' });
        }}
        onRefresh={reload}
      />

      <Card padding={22} style={{ background: 'var(--bg-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              flexShrink: 0,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--teal-700)',
            }}
          >
            <Icon name="info" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 13.5, marginBottom: 4 }}>Что вы получите</h4>
            <p style={{ fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.55, margin: 0 }}>
              После завершения вы увидите краткую интерпретацию по каждой шкале. В конце курса
              вы пройдёте те же тесты — и сможете сравнить результаты «до/после». Это
              объективная карта вашего роста.
            </p>
          </div>
        </div>
      </Card>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
