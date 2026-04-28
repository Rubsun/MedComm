import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { coursesApi } from '@/api/courses';
import { programsApi } from '@/api/programs';
import type { CourseOut, ProgramOut } from '@/types/api';
import { Badge, Button, Card, Empty, Icon } from '@/components/medcomm';

export default function CoursesPage() {
  const { programId } = useParams<{ programId: string }>();
  const pid = Number(programId);
  const navigate = useNavigate();
  const [program, setProgram] = useState<ProgramOut | null>(null);
  const [courses, setCourses] = useState<CourseOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [progRes, coursesRes] = await Promise.all([
        programsApi.get(pid),
        coursesApi.list(pid),
      ]);
      setProgram(progRes.data);
      setCourses(coursesRes.data);
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await coursesApi.create({ program_id: pid, title: newTitle.trim(), description: '' });
    setNewTitle('');
    setCreating(false);
    await load();
  };

  const handlePublish = async (id: number) => {
    await coursesApi.publish(id);
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить курс?')) return;
    await coursesApi.delete(id);
    await load();
  };

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) return;
    await coursesApi.update(id, { title: editTitle.trim() });
    setEditingId(null);
    await load();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = courses.findIndex((c) => c.id === active.id);
    const newIndex = courses.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(courses, oldIndex, newIndex);
    setCourses(reordered);
    await coursesApi.reorder(reordered.map((c, i) => ({ id: c.id, sort_order: i })));
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <Button
        variant="ghost"
        size="sm"
        icon="chevronLeft"
        onClick={() => navigate('/admin/programs')}
        style={{ marginBottom: 14 }}
      >
        К программам
      </Button>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22 }}>{program?.title ?? 'Программа'}</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
            Курсы внутри программы · {courses.length}{' '}
            {pluralize(courses.length, 'курс', 'курса', 'курсов')}
          </p>
        </div>
        <Button variant="primary" size="sm" icon="plus" onClick={() => setCreating(true)}>
          Новый курс
        </Button>
      </div>

      {creating && (
        <Card padding={16} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <InlineInput
              autoFocus
              placeholder="Название курса"
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
      ) : courses.length === 0 ? (
        <Empty
          icon="book"
          title="Курсов пока нет"
          description="Добавьте первый курс — внутри будут модули и уроки."
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={courses.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {courses.map((c) => (
                <SortableCourseRow
                  key={c.id}
                  course={c}
                  isEditing={editingId === c.id}
                  editTitle={editTitle}
                  onStartEdit={() => {
                    setEditingId(c.id);
                    setEditTitle(c.title);
                  }}
                  onChangeEdit={setEditTitle}
                  onSaveEdit={() => handleSaveEdit(c.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onTogglePublish={() => handlePublish(c.id)}
                  onDelete={() => handleDelete(c.id)}
                  onOpen={() => navigate(`/admin/courses/${c.id}/lessons`)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableCourseRow({
  course,
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
  course: CourseOut;
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
    id: course.id,
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
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>
                  {course.title}
                </div>
                {course.description && (
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                    {course.description}
                  </div>
                )}
              </div>
              {course.is_published ? (
                <Badge tone="success" size="sm" dot>
                  Опубликован
                </Badge>
              ) : (
                <Badge tone="neutral" size="sm">
                  Черновик
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={course.is_published ? 'eyeOff' : 'eye'}
                onClick={onTogglePublish}
              >
                {course.is_published ? 'Снять' : 'Опубликовать'}
              </Button>
              <Button variant="ghost" size="sm" icon="edit" onClick={onStartEdit}>
                Изменить
              </Button>
              <Button variant="danger" size="sm" icon="trash" onClick={onDelete}>
                Удалить
              </Button>
              <Button variant="primary" size="sm" iconRight="arrowRight" onClick={onOpen}>
                Уроки
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
