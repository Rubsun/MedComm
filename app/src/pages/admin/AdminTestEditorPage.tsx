import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { generalTestsApi } from '@/api/generalTests';
import type {
  GeneralTestInterpretation,
  GeneralTestKind,
  GeneralTestOut,
  GeneralTestQuestionType,
  GeneralTestResultsOut,
  GeneralTestScale,
  GeneralTestUpdateInput,
} from '@/types/api';
import {
  Badge,
  Button,
  Card,
  Icon,
  type IconName,
  ToastViewport,
  useToasts,
} from '@/components/medcomm';

type Tab = 'meta' | 'questions' | 'scales' | 'interpretations' | 'results';

const Q_TYPE_LABEL: Record<GeneralTestQuestionType, string> = {
  yesno: 'Да / Нет',
  likert4: 'Шкала 1–4',
  scale10: 'Шкала 1–10',
};

interface DraftState {
  kind: GeneralTestKind;
  title: string;
  method: string;
  description: string;
  duration: string;
  likert_labels: string[] | null;
  scales: GeneralTestScale[];
  interpretations: GeneralTestInterpretation[];
  questions: string[];
}

function fromTest(t: GeneralTestOut): DraftState {
  return {
    kind: t.kind,
    title: t.title,
    method: t.method,
    description: t.description,
    duration: t.duration,
    likert_labels: t.likert_labels,
    scales: t.scales.map((s) => ({ ...s })),
    interpretations: t.interpretations.map((i) => ({ ...i })),
    questions: t.questions
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((q) => q.text),
  };
}

function isDirty(a: DraftState, b: DraftState): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export default function AdminTestEditorPage() {
  const { testId } = useParams<{ testId: string }>();
  const tid = Number(testId);
  const navigate = useNavigate();
  const { toasts, push: toast, dismiss } = useToasts();
  const [test, setTest] = useState<GeneralTestOut | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [tab, setTab] = useState<Tab>('questions');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    generalTestsApi.get(tid).then((r) => {
      setTest(r.data);
      setDraft(fromTest(r.data));
    });
  }, [tid]);

  const dirty = useMemo(
    () => (test && draft ? isDirty(fromTest(test), draft) : false),
    [test, draft],
  );

  if (!test || !draft) {
    return (
      <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка…</div>
    );
  }

  const update = (patch: Partial<DraftState>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload: GeneralTestUpdateInput = {
        kind: draft.kind,
        title: draft.title,
        method: draft.method,
        description: draft.description,
        duration: draft.duration,
        likert_labels: draft.likert_labels,
        scales: draft.scales,
        interpretations: draft.interpretations,
        questions: draft.questions,
      };
      const res = await generalTestsApi.update(tid, payload);
      setTest(res.data);
      setDraft(fromTest(res.data));
      toast({ message: 'Изменения сохранены', icon: 'check' });
    } catch (err) {
      const detail =
        (isAxiosError(err) && (err.response?.data as { detail?: string } | undefined)?.detail) ||
        'Не удалось сохранить';
      toast({ message: detail, icon: 'warning', color: 'var(--danger)' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      const res = await generalTestsApi.publish(tid);
      setTest(res.data);
      setDraft(fromTest(res.data));
      toast({
        message: res.data.is_published ? 'Опубликовано' : 'Снято с публикации',
        icon: 'check',
      });
    } catch {
      toast({ message: 'Не удалось изменить публикацию', icon: 'warning', color: 'var(--danger)' });
    }
  };

  const TABS: { key: Tab; label: string; icon: IconName; count?: number }[] = [
    { key: 'meta', label: 'Описание', icon: 'info' },
    { key: 'questions', label: 'Вопросы', icon: 'list', count: draft.questions.length },
    { key: 'scales', label: 'Ключ', icon: 'target', count: draft.scales.length },
    {
      key: 'interpretations',
      label: 'Интерпретации',
      icon: 'sparkles',
      count: draft.interpretations.length,
    },
    { key: 'results', label: 'Результаты', icon: 'chart' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          height: 56,
          padding: '0 20px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexShrink: 0,
        }}
      >
        <Button variant="ghost" size="sm" icon="chevronLeft" onClick={() => navigate('/admin/tests')}>
          К списку
        </Button>
        <div style={{ height: 22, width: 1, background: 'var(--line)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Badge tone={draft.kind === 'entry' ? 'info' : 'teal'} size="sm">
              {draft.kind === 'entry' ? 'Входной' : 'Итоговый'}
            </Badge>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink-900)' }}>
              {draft.title}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>
              · {Q_TYPE_LABEL[test.question_type]}
            </span>
          </div>
        </div>
        {test.is_published ? (
          <Badge tone="success" size="sm" dot>
            Опубликован
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            Черновик
          </Badge>
        )}
        <Button
          variant={test.is_published ? 'secondary' : 'primary'}
          size="sm"
          icon={test.is_published ? 'eyeOff' : 'eye'}
          onClick={handleTogglePublish}
        >
          {test.is_published ? 'Снять' : 'Опубликовать'}
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon="check"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? 'Сохраняем…' : dirty ? 'Сохранить' : 'Сохранено'}
        </Button>
      </div>

      <div
        style={{
          height: 44,
          padding: '0 20px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 0,
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '0 14px',
                height: 44,
                border: 'none',
                borderBottom: `2px solid ${active ? 'var(--teal-600)' : 'transparent'}`,
                background: 'transparent',
                color: active ? 'var(--ink-900)' : 'var(--ink-600)',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                marginBottom: -1,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
              {t.count != null && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: active ? 'var(--teal-700)' : 'var(--ink-500)',
                    background: active ? 'var(--teal-50)' : 'var(--bg-soft)',
                    padding: '1px 6px',
                    borderRadius: 999,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '24px 28px', maxWidth: 980, margin: '0 auto' }}>
          {tab === 'meta' && (
            <MetaTab draft={draft} update={update} questionType={test.question_type} />
          )}
          {tab === 'questions' && (
            <QuestionsTab draft={draft} update={update} questionType={test.question_type} />
          )}
          {tab === 'scales' && (
            <ScalesTab draft={draft} update={update} questionType={test.question_type} />
          )}
          {tab === 'interpretations' && <InterpretationsTab draft={draft} update={update} />}
          {tab === 'results' && <ResultsTab testId={tid} />}
        </div>
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)' }}>{children}</div>
      {hint && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 2 }}>{hint}</div>
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const style: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--line)',
    borderRadius: 8,
    fontSize: 13.5,
    fontFamily: 'inherit',
    color: 'var(--ink-900)',
    background: 'var(--surface)',
    outline: 'none',
    resize: multiline ? 'vertical' : 'none',
    lineHeight: 1.5,
  };
  return multiline ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={style}
    />
  ) : (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  );
}

function MetaTab({
  draft,
  update,
  questionType,
}: {
  draft: DraftState;
  update: (patch: Partial<DraftState>) => void;
  questionType: GeneralTestQuestionType;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card padding={22}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Основное</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <FieldLabel>Название</FieldLabel>
            <TextInput value={draft.title} onChange={(v) => update({ title: v })} />
          </div>
          <div>
            <FieldLabel>Методика</FieldLabel>
            <TextInput value={draft.method} onChange={(v) => update({ method: v })} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <FieldLabel hint="Текст видят студенты на странице теста">
            Описание для студента
          </FieldLabel>
          <TextInput
            value={draft.description}
            onChange={(v) => update({ description: v })}
            multiline
            rows={3}
          />
        </div>
      </Card>

      <Card padding={22}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Параметры</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <FieldLabel>Тип</FieldLabel>
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { k: 'entry' as const, l: 'Входной' },
                { k: 'final' as const, l: 'Итоговый' },
              ]).map((o) => {
                const active = draft.kind === o.k;
                return (
                  <button
                    key={o.k}
                    onClick={() => update({ kind: o.k })}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 7,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--teal-500)' : 'var(--line)'}`,
                      background: active ? 'var(--teal-50)' : 'var(--surface)',
                      color: active ? 'var(--teal-700)' : 'var(--ink-700)',
                      fontWeight: active ? 600 : 500,
                      fontFamily: 'inherit',
                    }}
                  >
                    {o.l}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <FieldLabel>Формат вопросов</FieldLabel>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 7,
                border: '1px solid var(--line)',
                background: 'var(--bg-soft)',
                fontSize: 12.5,
                color: 'var(--ink-700)',
              }}
            >
              {Q_TYPE_LABEL[questionType]}
            </div>
          </div>
          <div>
            <FieldLabel>Длительность</FieldLabel>
            <TextInput value={draft.duration} onChange={(v) => update({ duration: v })} />
          </div>
        </div>

        {questionType === 'likert4' && (
          <div style={{ marginTop: 14 }}>
            <FieldLabel hint="Ровно 4 значения, через перевод строки">
              Подписи шкалы 1–4
            </FieldLabel>
            <TextInput
              value={(draft.likert_labels || []).join('\n')}
              onChange={(v) => {
                const arr = v.split('\n').map((s) => s.trim());
                update({ likert_labels: arr });
              }}
              multiline
              rows={4}
            />
          </div>
        )}
      </Card>

      <Card padding={22} style={{ background: 'var(--warning-soft)', border: '1px solid #FCD34D' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Icon name="warning" size={18} color="#B45309" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#B45309', marginBottom: 3 }}>
              Изменения после публикации
            </div>
            <div style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>
              Если изменить шкалы или удалить вопрос, прежние ответы студентов могут стать
              несовместимы. Проверяйте на черновой копии.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function QuestionsTab({
  draft,
  update,
  questionType,
}: {
  draft: DraftState;
  update: (patch: Partial<DraftState>) => void;
  questionType: GeneralTestQuestionType;
}) {
  const addQ = () =>
    update({ questions: [...draft.questions, 'Новый вопрос — отредактируйте текст'] });
  const editQ = (i: number, text: string) => {
    const next = draft.questions.slice();
    next[i] = text;
    update({ questions: next });
  };
  const removeQ = (i: number) => {
    if (!window.confirm(`Удалить вопрос ${i + 1}?`)) return;
    update({ questions: draft.questions.filter((_, idx) => idx !== i) });
  };
  const moveQ = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.questions.length) return;
    const next = draft.questions.slice();
    [next[i], next[j]] = [next[j], next[i]];
    update({ questions: next });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15 }}>Вопросы теста</h3>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
            Тип ответов: <strong>{Q_TYPE_LABEL[questionType]}</strong> · нумерация автоматическая
          </div>
        </div>
        <Button variant="primary" size="sm" icon="plus" onClick={addQ}>
          Добавить вопрос
        </Button>
      </div>

      <Card padding={0}>
        {draft.questions.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--ink-500)', fontSize: 13, textAlign: 'center' }}>
            Пока нет вопросов. Добавьте первый.
          </div>
        ) : (
          draft.questions.map((q, i) => (
            <QuestionRow
              key={i}
              index={i}
              text={q}
              type={questionType}
              isLast={i === draft.questions.length - 1}
              canMoveUp={i > 0}
              canMoveDown={i < draft.questions.length - 1}
              onChange={(t) => editQ(i, t)}
              onRemove={() => removeQ(i)}
              onMoveUp={() => moveQ(i, -1)}
              onMoveDown={() => moveQ(i, 1)}
            />
          ))
        )}
      </Card>
    </div>
  );
}

function QuestionRow({
  index,
  text,
  type,
  isLast,
  canMoveUp,
  canMoveDown,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  text: string;
  type: GeneralTestQuestionType;
  isLast: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (text: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(text);
  const [hover, setHover] = useState(false);
  useEffect(() => setVal(text), [text]);

  const save = () => {
    onChange(val);
    setEditing(false);
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '12px 16px 14px',
        borderBottom: isLast ? 'none' : '1px solid var(--line-soft)',
        display: 'flex',
        gap: 12,
        background: hover ? 'var(--bg-soft)' : 'transparent',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          paddingTop: 2,
        }}
      >
        <button
          disabled={!canMoveUp}
          onClick={onMoveUp}
          style={{
            width: 24,
            height: 22,
            border: 'none',
            background: 'transparent',
            color: canMoveUp ? 'var(--ink-500)' : 'var(--ink-300)',
            cursor: canMoveUp ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevronUp" size={14} />
        </button>
        <span
          className="num"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--ink-500)',
            background: 'var(--bg-soft)',
            border: '1px solid var(--line)',
            minWidth: 24,
            padding: '1px 5px',
            borderRadius: 5,
            textAlign: 'center',
          }}
        >
          {index + 1}
        </span>
        <button
          disabled={!canMoveDown}
          onClick={onMoveDown}
          style={{
            width: 24,
            height: 22,
            border: 'none',
            background: 'transparent',
            color: canMoveDown ? 'var(--ink-500)' : 'var(--ink-300)',
            cursor: canMoveDown ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevronDown" size={14} />
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div>
            <textarea
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
                if (e.key === 'Escape') {
                  setVal(text);
                  setEditing(false);
                }
              }}
              rows={2}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid var(--teal-500)',
                borderRadius: 7,
                fontSize: 13.5,
                fontFamily: 'inherit',
                color: 'var(--ink-900)',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <Button size="xs" variant="primary" icon="check" onClick={save}>
                Сохранить
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setVal(text);
                  setEditing(false);
                }}
              >
                Отмена
              </Button>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--ink-400)',
                  alignSelf: 'center',
                  marginLeft: 4,
                }}
              >
                ⌘+Enter
              </span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{
              fontSize: 13.5,
              color: 'var(--ink-800)',
              lineHeight: 1.55,
              cursor: 'text',
              padding: '4px 0',
            }}
          >
            {text}
          </div>
        )}

        {!editing && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {type === 'yesno' &&
              ['Да', 'Нет'].map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: 11,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'var(--bg-soft)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink-600)',
                  }}
                >
                  {l}
                </span>
              ))}
            {type === 'likert4' &&
              [1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className="num"
                  style={{
                    fontSize: 11,
                    width: 22,
                    height: 22,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 5,
                    background: 'var(--bg-soft)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink-600)',
                    fontWeight: 600,
                  }}
                >
                  {n}
                </span>
              ))}
            {type === 'scale10' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  color: 'var(--ink-500)',
                }}
              >
                <span>1</span>
                <div
                  style={{
                    width: 120,
                    height: 4,
                    background: 'var(--line-soft)',
                    borderRadius: 999,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: '60%',
                      background: 'var(--teal-500)',
                      borderRadius: 999,
                    }}
                  />
                </div>
                <span>10</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, opacity: hover ? 1 : 0, transition: 'opacity .12s' }}>
        <button
          onClick={() => setEditing(true)}
          style={{
            width: 28,
            height: 28,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            color: 'var(--ink-500)',
            cursor: 'pointer',
          }}
        >
          <Icon name="edit" size={13} />
        </button>
        <button
          onClick={onRemove}
          style={{
            width: 28,
            height: 28,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            color: 'var(--danger)',
            cursor: 'pointer',
          }}
        >
          <Icon name="trash" size={13} />
        </button>
      </div>
    </div>
  );
}

function parseIntList(s: string): number[] {
  return s
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => parseInt(p, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function ScalesTab({
  draft,
  update,
  questionType,
}: {
  draft: DraftState;
  update: (patch: Partial<DraftState>) => void;
  questionType: GeneralTestQuestionType;
}) {
  const updateScale = (i: number, patch: Partial<GeneralTestScale>) => {
    const next = draft.scales.slice();
    next[i] = { ...next[i], ...patch };
    update({ scales: next });
  };
  const addScale = () =>
    update({
      scales: [
        ...draft.scales,
        { key: `scale_${draft.scales.length + 1}`, name: 'Новая шкала' },
      ],
    });
  const removeScale = (i: number) => {
    if (!window.confirm('Удалить шкалу?')) return;
    update({ scales: draft.scales.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15 }}>Шкалы и ключ ответов</h3>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
            Каждая шкала — это группа вопросов, набирающих очки по своему правилу. Номера
            вопросов — 1-based.
          </div>
        </div>
        <Button variant="secondary" size="sm" icon="plus" onClick={addScale}>
          Добавить шкалу
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {draft.scales.map((s, i) => (
          <Card key={i} padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--teal-50)',
                  color: 'var(--teal-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'Inter Tight',
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                <TextInput value={s.name} onChange={(v) => updateScale(i, { name: v })} />
                <TextInput value={s.key} onChange={(v) => updateScale(i, { key: v })} />
              </div>
              <button
                onClick={() => removeScale(i)}
                style={{
                  width: 28,
                  height: 28,
                  border: 'none',
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                }}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>

            {questionType === 'yesno' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <FieldLabel hint="Через запятую/пробел; +1 если ответ «Да»">
                    Вопросы «Да»
                  </FieldLabel>
                  <TextInput
                    value={(s.yes ?? []).join(', ')}
                    onChange={(v) => updateScale(i, { yes: parseIntList(v) })}
                  />
                </div>
                <div>
                  <FieldLabel hint="Через запятую/пробел; +1 если ответ «Нет»">
                    Вопросы «Нет»
                  </FieldLabel>
                  <TextInput
                    value={(s.no ?? []).join(', ')}
                    onChange={(v) => updateScale(i, { no: parseIntList(v) })}
                  />
                </div>
              </div>
            )}

            {questionType === 'likert4' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <FieldLabel hint="Прибавляется значение ответа (1..4)">Прямые</FieldLabel>
                  <TextInput
                    value={(s.direct ?? []).join(', ')}
                    onChange={(v) => updateScale(i, { direct: parseIntList(v) })}
                  />
                </div>
                <div>
                  <FieldLabel hint="Прибавляется (5 − ответ)">Обратные</FieldLabel>
                  <TextInput
                    value={(s.reverse ?? []).join(', ')}
                    onChange={(v) => updateScale(i, { reverse: parseIntList(v) })}
                  />
                </div>
              </div>
            )}

            {questionType === 'scale10' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                <div>
                  <FieldLabel hint="Эти вопросы инвертируются: используется (11 − ответ)">
                    Инверсные вопросы
                  </FieldLabel>
                  <TextInput
                    value={(s.inverse ?? []).join(', ')}
                    onChange={(v) => updateScale(i, { inverse: parseIntList(v) })}
                  />
                </div>
              </div>
            )}
          </Card>
        ))}

        {draft.scales.length === 0 && (
          <Card padding={22}>
            <div style={{ color: 'var(--ink-500)', fontSize: 13, textAlign: 'center' }}>
              Шкалы не настроены. Добавьте хотя бы одну.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function InterpretationsTab({
  draft,
  update,
}: {
  draft: DraftState;
  update: (patch: Partial<DraftState>) => void;
}) {
  const updateRow = (i: number, patch: Partial<GeneralTestInterpretation>) => {
    const next = draft.interpretations.slice();
    next[i] = { ...next[i], ...patch };
    update({ interpretations: next });
  };
  const addRow = () =>
    update({
      interpretations: [
        ...draft.interpretations,
        { min: 0, max: 0, level: 'новый', short: 'Новый диапазон', text: '' },
      ],
    });
  const removeRow = (i: number) => {
    if (!window.confirm('Удалить диапазон?')) return;
    update({ interpretations: draft.interpretations.filter((_, idx) => idx !== i) });
  };
  const toneFor = (level: string) => {
    if (/высок|высш/i.test(level)) return { c: 'var(--teal-600)', bg: 'var(--teal-50)' };
    if (/средн|умеренн/i.test(level)) return { c: 'var(--info)', bg: 'var(--info-soft)' };
    return { c: 'var(--warning)', bg: 'var(--warning-soft)' };
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15 }}>Интерпретации результатов</h3>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
            Каждый диапазон баллов даёт свой текст обратной связи студенту. Диапазоны не должны
            перекрываться.
          </div>
        </div>
        <Button variant="secondary" size="sm" icon="plus" onClick={addRow}>
          Добавить диапазон
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {draft.interpretations.map((interp, i) => {
          const tone = toneFor(interp.level);
          return (
            <Card key={i} padding={0} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                <div
                  style={{
                    width: 130,
                    padding: '14px 12px',
                    background: tone.bg,
                    color: tone.c,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    borderRight: '1px solid var(--line)',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="number"
                      value={interp.min}
                      onChange={(e) => updateRow(i, { min: Number(e.target.value) })}
                      style={{
                        width: '50%',
                        padding: '4px 6px',
                        border: '1px solid currentColor',
                        borderRadius: 5,
                        background: 'var(--surface)',
                        color: 'var(--ink-900)',
                        fontFamily: 'Inter Tight',
                        fontSize: 13,
                        fontWeight: 700,
                        outline: 'none',
                      }}
                    />
                    <input
                      type="number"
                      value={interp.max}
                      onChange={(e) => updateRow(i, { max: Number(e.target.value) })}
                      style={{
                        width: '50%',
                        padding: '4px 6px',
                        border: '1px solid currentColor',
                        borderRadius: 5,
                        background: 'var(--surface)',
                        color: 'var(--ink-900)',
                        fontFamily: 'Inter Tight',
                        fontSize: 13,
                        fontWeight: 700,
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 600,
                    }}
                  >
                    мин — макс
                  </div>
                </div>
                <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <FieldLabel>Уровень (level)</FieldLabel>
                      <TextInput
                        value={interp.level}
                        onChange={(v) => updateRow(i, { level: v })}
                      />
                    </div>
                    <div>
                      <FieldLabel>Короткое название (short)</FieldLabel>
                      <TextInput
                        value={interp.short}
                        onChange={(v) => updateRow(i, { short: v })}
                      />
                    </div>
                  </div>
                  <FieldLabel>Текст для студента</FieldLabel>
                  <TextInput
                    value={interp.text}
                    onChange={(v) => updateRow(i, { text: v })}
                    multiline
                    rows={3}
                  />
                </div>
                <button
                  onClick={() => removeRow(i)}
                  style={{
                    width: 36,
                    border: 'none',
                    borderLeft: '1px solid var(--line)',
                    background: 'transparent',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                  }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </Card>
          );
        })}
        {draft.interpretations.length === 0 && (
          <Card padding={22}>
            <div style={{ color: 'var(--ink-500)', fontSize: 13, textAlign: 'center' }}>
              Интерпретации не настроены. Студент не увидит обратную связь по результатам.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function ResultsTab({ testId }: { testId: number }) {
  const [data, setData] = useState<GeneralTestResultsOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    generalTestsApi
      .results(testId, 10)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return <div style={{ color: 'var(--ink-500)', fontSize: 13 }}>Загрузка…</div>;
  }
  if (!data) return null;

  const total = data.distribution.reduce((s, d) => s + d.count, 0) || 1;
  const max = Math.max(...data.distribution.map((d) => d.count), 1);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <SimpleStat
          icon="users"
          color="var(--info)"
          label="Прохождений"
          value={data.responses}
          sub="всего попыток"
        />
        <SimpleStat
          icon="checkCircle"
          color="var(--success)"
          label="Завершили"
          value={data.completed}
          sub="дошли до результата"
        />
        <SimpleStat
          icon="target"
          color="var(--teal-600)"
          label="Средний балл"
          value={data.avg_score}
          sub="по завершённым"
        />
      </div>

      <Card padding={22} style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, marginBottom: 4 }}>Распределение по уровням</h3>
        <p style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 18 }}>
          Сколько студентов в каждом диапазоне интерпретации
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.distribution.map((d, i) => {
            const pct = Math.round((d.count / total) * 100);
            const widthPct = (d.count / max) * 100;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 200,
                    fontSize: 12.5,
                    color: 'var(--ink-700)',
                    fontWeight: 500,
                    textAlign: 'right',
                  }}
                >
                  {d.short}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 24,
                    background: 'var(--bg-soft)',
                    borderRadius: 6,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      background: 'var(--teal-500)',
                      borderRadius: 6,
                      transition: 'width .5s ease',
                    }}
                  />
                </div>
                <div
                  className="num"
                  style={{
                    width: 90,
                    fontSize: 12,
                    color: 'var(--ink-700)',
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                >
                  {d.count}{' '}
                  <span style={{ color: 'var(--ink-500)', fontWeight: 500 }}>· {pct}%</span>
                </div>
              </div>
            );
          })}
          {data.distribution.length === 0 && (
            <div style={{ color: 'var(--ink-500)', fontSize: 13 }}>
              Распределение появится после настройки интерпретаций и появления попыток.
            </div>
          )}
        </div>
      </Card>

      <Card padding={0}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--line-soft)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontSize: 15, flex: 1 }}>Последние прохождения</h3>
        </div>
        <div>
          {data.recent.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--ink-500)', fontSize: 13 }}>
              Пока никто не завершил этот тест.
            </div>
          ) : (
            data.recent.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 20px',
                  borderTop: i ? '1px solid var(--line-soft)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
                    {r.user_name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
                    {new Date(r.completed_at).toLocaleString('ru-RU')}
                  </div>
                </div>
                <Badge
                  tone={
                    /высок/.test(r.level)
                      ? 'success'
                      : /средн|умеренн/i.test(r.level)
                      ? 'info'
                      : 'warning'
                  }
                  size="sm"
                >
                  {r.level || '—'}
                </Badge>
                <div
                  className="num"
                  style={{
                    width: 60,
                    textAlign: 'right',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'Inter Tight',
                    color: 'var(--ink-900)',
                  }}
                >
                  {Number.isFinite(r.score_total) ? r.score_total.toFixed(1) : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function SimpleStat({
  icon,
  color,
  label,
  value,
  sub,
}: {
  icon: IconName;
  color: string;
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <Card padding={18}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-soft)',
            color,
          }}
        >
          <Icon name={icon} size={16} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{label}</div>
      </div>
      <div
        className="num"
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'Inter Tight',
          color: 'var(--ink-900)',
          marginBottom: 2,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{sub}</div>
    </Card>
  );
}
