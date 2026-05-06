import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { generalTestsApi } from '@/api/generalTests';
import type {
  GeneralTestKind,
  GeneralTestListItem,
  GeneralTestQuestionType,
} from '@/types/api';
import {
  Badge,
  Button,
  Card,
  Empty,
  Icon,
  ToastViewport,
  useToasts,
} from '@/components/medcomm';

const Q_TYPE_LABEL: Record<GeneralTestQuestionType, string> = {
  yesno: 'Да/Нет',
  likert4: 'Шкала 1–4',
  scale10: 'Шкала 1–10',
};

type Filter = 'all' | GeneralTestKind;

export default function AdminTestsPage() {
  const navigate = useNavigate();
  const { toasts, push: toast, dismiss } = useToasts();
  const [tests, setTests] = useState<GeneralTestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState(false);

  const reload = () =>
    generalTestsApi.list().then((r) =>
      setTests([...r.data].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)),
    );

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? tests : tests.filter((t) => t.kind === filter)),
    [tests, filter],
  );

  const handleCreate = async () => {
    setBusy(true);
    try {
      const res = await generalTestsApi.create({
        kind: 'final',
        title: 'Новый тест',
        method: '',
        description: '',
        question_type: 'yesno',
        duration: '5–10 мин',
        scales: [],
        interpretations: [],
        questions: [],
      });
      toast({ message: 'Тест создан', icon: 'check' });
      navigate(`/admin/tests/${res.data.id}/editor`);
    } catch (err) {
      const detail =
        (isAxiosError(err) && (err.response?.data as { detail?: string } | undefined)?.detail) ||
        'Не удалось создать тест';
      toast({ message: detail, icon: 'warning', color: 'var(--danger)' });
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      const res = await generalTestsApi.publish(id);
      setTests((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_published: res.data.is_published } : t)),
      );
      toast({
        message: res.data.is_published ? 'Опубликовано' : 'Снято с публикации',
        icon: 'check',
      });
    } catch {
      toast({ message: 'Не удалось изменить публикацию', icon: 'warning', color: 'var(--danger)' });
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Удалить тест «${title}»? Все попытки прохождения будут удалены.`))
      return;
    try {
      await generalTestsApi.delete(id);
      setTests((prev) => prev.filter((t) => t.id !== id));
      toast({ message: 'Тест удалён', icon: 'check' });
    } catch {
      toast({ message: 'Не удалось удалить тест', icon: 'warning', color: 'var(--danger)' });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка…</div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Диагностические тесты</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>
            {tests.length} {tests.length === 1 ? 'тест' : 'тестов'}
            {' · '}
            {tests.filter((t) => t.kind === 'entry').length} входных,{' '}
            {tests.filter((t) => t.kind === 'final').length} итоговых
          </div>
        </div>
        <Button variant="primary" icon="plus" onClick={handleCreate} disabled={busy}>
          Создать тест
        </Button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: 'var(--bg-soft)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          width: 'fit-content',
          marginBottom: 18,
        }}
      >
        {(
          [
            { k: 'all', label: 'Все', count: tests.length },
            { k: 'entry', label: 'Входные', count: tests.filter((t) => t.kind === 'entry').length },
            { k: 'final', label: 'Итоговые', count: tests.filter((t) => t.kind === 'final').length },
          ] as { k: Filter; label: string; count: number }[]
        ).map((t) => {
          const active = filter === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setFilter(t.k)}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                background: active ? 'var(--surface)' : 'transparent',
                color: active ? 'var(--ink-900)' : 'var(--ink-600)',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                boxShadow: active ? 'var(--shadow-xs)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t.label}
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--ink-500)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon="file"
          title="Нет тестов в этой категории"
          description="Создайте новый тест или измените фильтр"
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {filtered.map((t) => {
            const kindBadge =
              t.kind === 'entry'
                ? { tone: 'info' as const, label: 'Входной' }
                : { tone: 'teal' as const, label: 'Итоговый' };
            return (
              <Card key={t.id} padding={0} hover>
                <div
                  style={{
                    padding: '18px 20px',
                    borderBottom: '1px solid var(--line-soft)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 11,
                        flexShrink: 0,
                        background:
                          t.kind === 'entry' ? 'var(--info-soft)' : 'var(--teal-50)',
                        color: t.kind === 'entry' ? 'var(--info)' : 'var(--teal-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="note" size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 3,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Badge tone={kindBadge.tone} size="sm">
                          {kindBadge.label}
                        </Badge>
                        <Badge tone="neutral" size="sm">
                          {Q_TYPE_LABEL[t.question_type]}
                        </Badge>
                        {t.is_published ? (
                          <Badge tone="success" size="sm" dot>
                            Опубликован
                          </Badge>
                        ) : (
                          <Badge tone="neutral" size="sm">
                            Черновик
                          </Badge>
                        )}
                      </div>
                      <h3 style={{ fontSize: 15, marginBottom: 2 }}>{t.title}</h3>
                      <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                        {t.method || '—'}
                      </div>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: 'var(--ink-600)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {t.description || (
                      <span style={{ color: 'var(--ink-400)' }}>Нет описания</span>
                    )}
                  </p>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    borderBottom: '1px solid var(--line-soft)',
                  }}
                >
                  <Stat label="Вопросов" value={t.questions_count} />
                  <Stat label="Шкал" value={t.scales_count} />
                  <Stat label="Время" value={t.duration || '—'} small />
                </div>
                <div
                  style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1 }} />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={t.is_published ? 'eyeOff' : 'eye'}
                    onClick={() => handleTogglePublish(t.id)}
                  >
                    {t.is_published ? 'Снять' : 'Опубликовать'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="trash"
                    onClick={() => handleDelete(t.id, t.title)}
                  >
                    Удалить
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="edit"
                    onClick={() => navigate(`/admin/tests/${t.id}/editor`)}
                  >
                    Открыть
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function Stat({
  label,
  value,
  small,
  accent,
}: {
  label: string;
  value: string | number;
  small?: boolean;
  accent?: boolean;
}) {
  return (
    <div style={{ padding: '12px 16px', borderRight: '1px solid var(--line-soft)' }}>
      <div
        style={{
          fontSize: 10.5,
          color: 'var(--ink-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 500,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        className="num"
        style={{
          fontSize: small ? 13 : 17,
          fontWeight: 700,
          fontFamily: 'Inter Tight',
          color: accent ? 'var(--teal-700)' : 'var(--ink-900)',
        }}
      >
        {value}
      </div>
    </div>
  );
}
