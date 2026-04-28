import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { achievementsApi, type AchievementInput } from '@/api/achievements';
import type {
  AchievementMetric,
  AchievementOp,
  AchievementOut,
  AchievementTier,
} from '@/types/api';
import { Badge, Button, Card, Empty, Icon } from '@/components/medcomm';
import type { IconName } from '@/components/medcomm/Icon';

const METRIC_LABELS: Record<AchievementMetric, string> = {
  lessons_completed: 'Уроков пройдено',
  courses_completed: 'Курсов завершено',
  streak_days: 'Дней подряд (стрик)',
  perfect_quizzes: 'Идеальных тестов',
  practice_count: 'Практик пройдено',
};

const OP_LABELS: Record<AchievementOp, string> = {
  '>=': '≥',
  '>': '>',
  '==': '=',
};

const TIER_TONE: Record<AchievementTier, 'warning' | 'neutral' | 'success'> = {
  bronze: 'warning',
  silver: 'neutral',
  gold: 'success',
};

const TIER_LABEL: Record<AchievementTier, string> = {
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
};

const KNOWN_ICONS = new Set<IconName>([
  'home', 'book', 'map', 'user', 'award', 'bell', 'settings', 'search', 'plus',
  'check', 'checkCircle', 'flame', 'clock', 'chart', 'bar', 'users', 'grad',
  'trash', 'edit', 'eye', 'eyeOff', 'file', 'image', 'video', 'list', 'grid',
  'sparkles', 'target', 'heart', 'msg', 'layers', 'folder', 'bookmark', 'note',
  'trophy', 'cert', 'info', 'star', 'smile', 'light',
] as IconName[]);

function isIconName(s: string): s is IconName {
  return KNOWN_ICONS.has(s as IconName);
}

const EMPTY_FORM: AchievementInput = {
  title: '',
  description: '',
  icon: 'trophy',
  color: null,
  tier: 'bronze',
  metric: 'lessons_completed',
  op: '>=',
  threshold: 1,
  xp: 50,
};

export default function AchievementsAdminPage() {
  const [items, setItems] = useState<AchievementOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id: number | null; data: AchievementInput } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await achievementsApi.list();
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => setEditing({ id: null, data: { ...EMPTY_FORM } });
  const startEdit = (a: AchievementOut) =>
    setEditing({
      id: a.id,
      data: {
        title: a.title,
        description: a.description,
        icon: a.icon,
        color: a.color,
        tier: a.tier,
        metric: a.metric,
        op: a.op,
        threshold: a.threshold,
        xp: a.xp,
      },
    });
  const cancelEdit = () => setEditing(null);

  const handleSave = async () => {
    if (!editing) return;
    const data = editing.data;
    if (!data.title.trim()) return;
    if (editing.id === null) {
      await achievementsApi.create(data);
    } else {
      await achievementsApi.update(editing.id, data);
    }
    setEditing(null);
    await load();
  };

  const handlePublish = async (id: number) => {
    await achievementsApi.publish(id);
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить достижение?')) return;
    await achievementsApi.delete(id);
    await load();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    await achievementsApi.reorder(reordered.map((i, idx) => ({ id: i.id, sort_order: idx })));
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24 }}>Достижения</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
            {items.length} {pluralize(items.length, 'достижение', 'достижения', 'достижений')} ·
            правила автоматически проверяются после каждого действия студента
          </p>
        </div>
        <Button variant="primary" size="sm" icon="plus" onClick={startCreate}>
          Новое достижение
        </Button>
      </div>

      {editing && (
        <AchievementForm
          mode={editing.id === null ? 'create' : 'edit'}
          value={editing.data}
          onChange={(patch) =>
            setEditing((prev) =>
              prev ? { ...prev, data: { ...prev.data, ...patch } } : prev,
            )
          }
          onSave={handleSave}
          onCancel={cancelEdit}
        />
      )}

      {loading ? (
        <div style={{ padding: 24, fontSize: 13, color: 'var(--ink-500)' }}>Загрузка…</div>
      ) : items.length === 0 ? (
        <Empty
          icon="trophy"
          title="Достижений пока нет"
          description="Создайте первое — оно автоматически разблокируется у студентов при достижении порога."
          action={
            <Button variant="primary" icon="plus" onClick={startCreate}>
              Создать достижение
            </Button>
          }
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((a) => (
                <SortableAchievementRow
                  key={a.id}
                  achievement={a}
                  onEdit={() => startEdit(a)}
                  onPublish={() => handlePublish(a.id)}
                  onDelete={() => handleDelete(a.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableAchievementRow({
  achievement,
  onEdit,
  onPublish,
  onDelete,
}: {
  achievement: AchievementOut;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: achievement.id,
  });

  const a = achievement;
  const iconBg = a.color ?? 'var(--teal-50)';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <Card padding={0}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            {...attributes}
            {...listeners}
            style={{
              cursor: 'grab',
              background: 'none',
              border: 'none',
              color: 'var(--ink-300)',
              padding: 4,
            }}
            aria-label="Перетащить"
          >
            <Icon name="drag" size={16} />
          </button>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: iconBg,
              color: 'var(--teal-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {isIconName(a.icon) ? (
              <Icon name={a.icon} size={22} />
            ) : (
              <span style={{ fontSize: 22 }}>{a.icon || '🏆'}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14.5,
                fontWeight: 600,
                color: 'var(--ink-900)',
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {a.title}
              </span>
              <Badge tone={TIER_TONE[a.tier]} size="sm">
                {TIER_LABEL[a.tier]}
              </Badge>
            </div>
            {a.description && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--ink-500)',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {a.description}
              </div>
            )}
            <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 4 }}>
              {METRIC_LABELS[a.metric]} {OP_LABELS[a.op]} {a.threshold} · +{a.xp} XP
            </div>
          </div>
          {a.is_published ? (
            <Badge tone="success" size="sm" dot>
              Опубликовано
            </Badge>
          ) : (
            <Badge tone="neutral" size="sm">
              Черновик
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={a.is_published ? 'eyeOff' : 'eye'}
            onClick={onPublish}
          >
            {a.is_published ? 'Снять' : 'Опубликовать'}
          </Button>
          <Button variant="ghost" size="sm" icon="edit" onClick={onEdit}>
            Изменить
          </Button>
          <Button variant="danger" size="sm" icon="trash" onClick={onDelete}>
            Удалить
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AchievementForm({
  mode,
  value,
  onChange,
  onSave,
  onCancel,
}: {
  mode: 'create' | 'edit';
  value: AchievementInput;
  onChange: (patch: Partial<AchievementInput>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Card padding={18} style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ink-500)',
          marginBottom: 10,
        }}
      >
        {mode === 'create' ? 'Новое достижение' : 'Редактирование'}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        <Field label="Название">
          <FormInput
            placeholder="Первый шаг"
            value={value.title}
            onChange={(v) => onChange({ title: v })}
            autoFocus
          />
        </Field>
        <Field label="Иконка (имя из набора или emoji)">
          <FormInput
            placeholder="trophy или 🏆"
            value={value.icon ?? ''}
            onChange={(v) => onChange({ icon: v })}
          />
        </Field>

        <Field label="Описание" full>
          <FormInput
            placeholder="Прошёл первый урок"
            value={value.description ?? ''}
            onChange={(v) => onChange({ description: v })}
          />
        </Field>

        <Field label="Уровень">
          <FormSelect
            value={value.tier ?? 'bronze'}
            onChange={(v) => onChange({ tier: v as AchievementTier })}
            options={[
              { value: 'bronze', label: 'Бронза' },
              { value: 'silver', label: 'Серебро' },
              { value: 'gold', label: 'Золото' },
            ]}
          />
        </Field>
        <Field label="Цвет фона (hex или пусто)">
          <FormInput
            placeholder="#ECFDF5"
            value={value.color ?? ''}
            onChange={(v) => onChange({ color: v.trim() === '' ? null : v })}
          />
        </Field>

        <Field label="Метрика">
          <FormSelect
            value={value.metric}
            onChange={(v) => onChange({ metric: v as AchievementMetric })}
            options={(Object.keys(METRIC_LABELS) as AchievementMetric[]).map((m) => ({
              value: m,
              label: METRIC_LABELS[m],
            }))}
          />
        </Field>
        <Field label="Условие">
          <div style={{ display: 'flex', gap: 8 }}>
            <FormSelect
              value={value.op ?? '>='}
              onChange={(v) => onChange({ op: v as AchievementOp })}
              options={[
                { value: '>=', label: '≥' },
                { value: '>', label: '>' },
                { value: '==', label: '=' },
              ]}
              style={{ width: 80 }}
            />
            <FormInput
              type="number"
              value={String(value.threshold)}
              onChange={(v) => onChange({ threshold: Number(v) || 0 })}
            />
          </div>
        </Field>

        <Field label="XP за разблокировку">
          <FormInput
            type="number"
            value={String(value.xp ?? 0)}
            onChange={(v) => onChange({ xp: Number(v) || 0 })}
          />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="primary" size="sm" icon="check" onClick={onSave}>
          {mode === 'create' ? 'Создать' : 'Сохранить'}
        </Button>
      </div>
    </Card>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label
        style={{
          display: 'block',
          fontSize: 11.5,
          fontWeight: 500,
          color: 'var(--ink-500)',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        height: 36,
        padding: '0 12px',
        border: '1px solid var(--line-strong)',
        borderRadius: 8,
        background: 'var(--surface)',
        fontSize: 13.5,
        color: 'var(--ink-900)',
        fontFamily: 'inherit',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}

function FormSelect({
  value,
  onChange,
  options,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  style?: CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        height: 36,
        padding: '0 10px',
        border: '1px solid var(--line-strong)',
        borderRadius: 8,
        background: 'var(--surface)',
        fontSize: 13.5,
        color: 'var(--ink-900)',
        fontFamily: 'inherit',
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function pluralize(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
