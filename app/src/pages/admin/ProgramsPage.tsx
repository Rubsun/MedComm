import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { programsApi } from '@/api/programs';
import type { ProgramOut } from '@/types/api';
import { Badge, Button, Card, Empty, Icon } from '@/components/medcomm';

export default function ProgramsPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await programsApi.list();
      setPrograms(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await programsApi.create({ title: newTitle.trim(), description: '' });
    setNewTitle('');
    setCreating(false);
    await load();
  };

  const handlePublish = async (id: number) => {
    await programsApi.publish(id);
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить программу?')) return;
    await programsApi.delete(id);
    await load();
  };

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) return;
    await programsApi.update(id, { title: editTitle.trim() });
    setEditingId(null);
    await load();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = programs.findIndex((p) => p.id === active.id);
    const newIndex = programs.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(programs, oldIndex, newIndex);
    setPrograms(reordered);
    await programsApi.reorder(reordered.map((p, i) => ({ id: p.id, sort_order: i })));
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
          <h1 style={{ fontSize: 24 }}>Программы</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
            {programs.length} {pluralize(programs.length, 'программа', 'программы', 'программ')}{' '}
            · перетаскивайте, чтобы изменить порядок
          </p>
        </div>
        <Button variant="primary" size="sm" icon="plus" onClick={() => setCreating(true)}>
          Новая программа
        </Button>
      </div>

      {creating && (
        <Card padding={16} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <InlineInput
              autoFocus
              placeholder="Название программы"
              value={newTitle}
              onChange={setNewTitle}
              onEnter={handleCreate}
            />
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Создать
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
              Отмена
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ padding: 24, fontSize: 13, color: 'var(--ink-500)' }}>Загрузка…</div>
      ) : programs.length === 0 ? (
        <Empty
          icon="layers"
          title="Программ пока нет"
          description="Создайте первую программу — внутри неё будут жить курсы."
          action={
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
              Создать программу
            </Button>
          }
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={programs.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {programs.map((p) => (
                <SortableProgramRow
                  key={p.id}
                  program={p}
                  isEditing={editingId === p.id}
                  editTitle={editTitle}
                  onStartEdit={() => {
                    setEditingId(p.id);
                    setEditTitle(p.title);
                  }}
                  onChangeEdit={setEditTitle}
                  onSaveEdit={() => handleSaveEdit(p.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onTogglePublish={() => handlePublish(p.id)}
                  onDelete={() => handleDelete(p.id)}
                  onOpen={() => navigate(`/admin/programs/${p.id}/courses`)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableProgramRow({
  program,
  isEditing,
  editTitle,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onTogglePublish,
  onDelete,
  onOpen,
}: {
  program: ProgramOut;
  isEditing: boolean;
  editTitle: string;
  onStartEdit: () => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: program.id,
  });

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
          {isEditing ? (
            <>
              <InlineInput value={editTitle} onChange={onChangeEdit} onEnter={onSaveEdit} autoFocus />
              <Button variant="primary" size="sm" onClick={onSaveEdit}>
                Сохранить
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                Отмена
              </Button>
            </>
          ) : (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink-900)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {program.title}
                </div>
                {program.description && (
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
                    {program.description}
                  </div>
                )}
              </div>
              {program.is_published ? (
                <Badge tone="success" size="sm" dot>
                  Опубликована
                </Badge>
              ) : (
                <Badge tone="neutral" size="sm">
                  Черновик
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={program.is_published ? 'eyeOff' : 'eye'}
                onClick={onTogglePublish}
                title={program.is_published ? 'Снять с публикации' : 'Опубликовать'}
              >
                {program.is_published ? 'Снять' : 'Опубликовать'}
              </Button>
              <Button variant="ghost" size="sm" icon="edit" onClick={onStartEdit}>
                Изменить
              </Button>
              <Button variant="danger" size="sm" icon="trash" onClick={onDelete}>
                Удалить
              </Button>
              <Button variant="primary" size="sm" iconRight="arrowRight" onClick={onOpen}>
                Курсы
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function InlineInput({
  value,
  onChange,
  onEnter,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) onEnter();
      }}
      style={{
        flex: 1,
        height: 36,
        padding: '0 12px',
        border: '1px solid var(--line-strong)',
        borderRadius: 8,
        background: 'var(--surface)',
        fontSize: 13.5,
        color: 'var(--ink-900)',
        fontFamily: 'inherit',
        outline: 'none',
      }}
    />
  );
}

function pluralize(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
