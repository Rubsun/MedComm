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
import { modulesApi } from '@/api/modules';
import { lessonsApi } from '@/api/lessons';
import type { CourseOut, LessonOut, ModuleOut } from '@/types/api';
import { Badge, Button, Card, Empty, Icon } from '@/components/medcomm';

export default function LessonsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const cid = Number(courseId);
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseOut | null>(null);
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<number, LessonOut[]>>({});
  const [loading, setLoading] = useState(true);
  const [creatingModule, setCreatingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [creatingLessonInModule, setCreatingLessonInModule] = useState<number | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, modsRes] = await Promise.all([
        coursesApi.get(cid),
        modulesApi.list(cid),
      ]);
      setCourse(courseRes.data);
      const mods = modsRes.data;
      setModules(mods);
      const byMod: Record<number, LessonOut[]> = {};
      await Promise.all(
        mods.map(async (m) => {
          byMod[m.id] = (await lessonsApi.list(m.id)).data;
        }),
      );
      setLessonsByModule(byMod);
    } finally {
      setLoading(false);
    }
  }, [cid]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreateModule = async () => {
    if (!newModuleTitle.trim()) return;
    await modulesApi.create({ course_id: cid, title: newModuleTitle.trim(), description: '' });
    setNewModuleTitle('');
    setCreatingModule(false);
    await load();
  };

  const handleSaveModuleEdit = async (id: number) => {
    if (!editModuleTitle.trim()) return;
    await modulesApi.update(id, { title: editModuleTitle.trim() });
    setEditingModuleId(null);
    await load();
  };

  const handlePublishModule = async (id: number) => {
    await modulesApi.publish(id);
    await load();
  };

  const handleDeleteModule = async (id: number) => {
    if (!confirm('Удалить модуль вместе со всеми уроками?')) return;
    await modulesApi.delete(id);
    await load();
  };

  const handleCreateLesson = async (moduleId: number) => {
    if (!newLessonTitle.trim()) return;
    await lessonsApi.create({
      module_id: moduleId,
      title: newLessonTitle.trim(),
      description: '',
      type: 'theory',
      duration_min: 10,
    });
    setNewLessonTitle('');
    setCreatingLessonInModule(null);
    await load();
  };

  const handleSaveLessonEdit = async (id: number) => {
    if (!editLessonTitle.trim()) return;
    await lessonsApi.update(id, { title: editLessonTitle.trim() });
    setEditingLessonId(null);
    await load();
  };

  const handlePublishLesson = async (id: number) => {
    await lessonsApi.publish(id);
    await load();
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm('Удалить урок?')) return;
    await lessonsApi.delete(id);
    await load();
  };

  const handleModulesDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIndex, newIndex);
    setModules(reordered);
    await modulesApi.reorder(reordered.map((m, i) => ({ id: m.id, sort_order: i })));
  };

  const handleLessonsDragEnd = async (moduleId: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const lessons = lessonsByModule[moduleId] ?? [];
    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lessons, oldIndex, newIndex);
    setLessonsByModule((prev) => ({ ...prev, [moduleId]: reordered }));
    await lessonsApi.reorder(reordered.map((l, i) => ({ id: l.id, sort_order: i })));
  };

  const totalLessons = Object.values(lessonsByModule).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <Button
        variant="ghost"
        size="sm"
        icon="chevronLeft"
        onClick={() =>
          course
            ? navigate(`/admin/programs/${course.program_id}/courses`)
            : navigate('/admin/programs')
        }
        style={{ marginBottom: 14 }}
      >
        К курсам
      </Button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22 }}>{course?.title ?? 'Курс'}</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
            {modules.length} {pluralize(modules.length, 'модуль', 'модуля', 'модулей')} ·{' '}
            {totalLessons} {pluralize(totalLessons, 'урок', 'урока', 'уроков')}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon="plus"
          onClick={() => setCreatingModule(true)}
        >
          Новый модуль
        </Button>
      </div>

      {creatingModule && (
        <Card padding={16} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <InlineInput
              autoFocus
              placeholder="Название модуля"
              value={newModuleTitle}
              onChange={setNewModuleTitle}
              onEnter={handleCreateModule}
            />
            <Button variant="primary" size="sm" onClick={handleCreateModule}>
              Создать
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCreatingModule(false)}>
              Отмена
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ padding: 24, fontSize: 13, color: 'var(--ink-500)' }}>Загрузка…</div>
      ) : modules.length === 0 ? (
        <Empty
          icon="layers"
          title="Модулей пока нет"
          description="Добавьте первый модуль — внутри будут уроки."
        />
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleModulesDragEnd}>
          <SortableContext
            items={modules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {modules.map((m) => (
                <SortableModuleCard
                  key={m.id}
                  module={m}
                  lessons={lessonsByModule[m.id] ?? []}
                  isEditing={editingModuleId === m.id}
                  editTitle={editModuleTitle}
                  onStartEdit={() => {
                    setEditingModuleId(m.id);
                    setEditModuleTitle(m.title);
                  }}
                  onChangeEdit={setEditModuleTitle}
                  onSaveEdit={() => handleSaveModuleEdit(m.id)}
                  onCancelEdit={() => setEditingModuleId(null)}
                  onPublish={() => handlePublishModule(m.id)}
                  onDelete={() => handleDeleteModule(m.id)}
                  creatingLesson={creatingLessonInModule === m.id}
                  newLessonTitle={newLessonTitle}
                  onStartCreateLesson={() => {
                    setCreatingLessonInModule(m.id);
                    setNewLessonTitle('');
                  }}
                  onCancelCreateLesson={() => setCreatingLessonInModule(null)}
                  onChangeNewLessonTitle={setNewLessonTitle}
                  onCreateLesson={() => handleCreateLesson(m.id)}
                  editingLessonId={editingLessonId}
                  editLessonTitle={editLessonTitle}
                  onStartEditLesson={(id, title) => {
                    setEditingLessonId(id);
                    setEditLessonTitle(title);
                  }}
                  onChangeEditLesson={setEditLessonTitle}
                  onSaveEditLesson={(id) => handleSaveLessonEdit(id)}
                  onCancelEditLesson={() => setEditingLessonId(null)}
                  onPublishLesson={handlePublishLesson}
                  onDeleteLesson={handleDeleteLesson}
                  onOpenLesson={(id) => navigate(`/admin/lessons/${id}/editor`)}
                  onLessonsDragEnd={(e) => handleLessonsDragEnd(m.id, e)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableModuleCard({
  module: mod,
  lessons,
  isEditing,
  editTitle,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onPublish,
  onDelete,
  creatingLesson,
  newLessonTitle,
  onStartCreateLesson,
  onCancelCreateLesson,
  onChangeNewLessonTitle,
  onCreateLesson,
  editingLessonId,
  editLessonTitle,
  onStartEditLesson,
  onChangeEditLesson,
  onSaveEditLesson,
  onCancelEditLesson,
  onPublishLesson,
  onDeleteLesson,
  onOpenLesson,
  onLessonsDragEnd,
}: {
  module: ModuleOut;
  lessons: LessonOut[];
  isEditing: boolean;
  editTitle: string;
  onStartEdit: () => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
  creatingLesson: boolean;
  newLessonTitle: string;
  onStartCreateLesson: () => void;
  onCancelCreateLesson: () => void;
  onChangeNewLessonTitle: (v: string) => void;
  onCreateLesson: () => void;
  editingLessonId: number | null;
  editLessonTitle: string;
  onStartEditLesson: (id: number, title: string) => void;
  onChangeEditLesson: (v: string) => void;
  onSaveEditLesson: (id: number) => void;
  onCancelEditLesson: () => void;
  onPublishLesson: (id: number) => void;
  onDeleteLesson: (id: number) => void;
  onOpenLesson: (id: number) => void;
  onLessonsDragEnd: (event: DragEndEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
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
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid var(--line)',
          }}
        >
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
            aria-label="Перетащить модуль"
          >
            <Icon name="drag" size={16} />
          </button>
          {isEditing ? (
            <>
              <InlineInput
                value={editTitle}
                onChange={onChangeEdit}
                onEnter={onSaveEdit}
                autoFocus
              />
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
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: 'var(--ink-900)',
                  }}
                >
                  {mod.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                  {lessons.length} {pluralize(lessons.length, 'урок', 'урока', 'уроков')}
                </div>
              </div>
              {mod.is_published ? (
                <Badge tone="success" size="sm">
                  Опубликован
                </Badge>
              ) : (
                <Badge tone="neutral" size="sm">
                  Скрыт
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={mod.is_published ? 'eyeOff' : 'eye'}
                onClick={onPublish}
              >
                {mod.is_published ? 'Скрыть' : 'Показать'}
              </Button>
              <Button variant="ghost" size="sm" icon="edit" onClick={onStartEdit}>
                Изменить
              </Button>
              <Button variant="danger" size="sm" icon="trash" onClick={onDelete}>
                Удалить
              </Button>
            </>
          )}
        </div>

        <div style={{ padding: '8px 18px 14px' }}>
          {lessons.length === 0 && !creatingLesson ? (
            <div
              style={{
                padding: '14px 0',
                fontSize: 13,
                color: 'var(--ink-500)',
                textAlign: 'center',
              }}
            >
              В этом модуле ещё нет уроков
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={onLessonsDragEnd}>
              <SortableContext
                items={lessons.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {lessons.map((l) => (
                    <SortableLessonRow
                      key={l.id}
                      lesson={l}
                      isEditing={editingLessonId === l.id}
                      editTitle={editLessonTitle}
                      onStartEdit={() => onStartEditLesson(l.id, l.title)}
                      onChangeEdit={onChangeEditLesson}
                      onSaveEdit={() => onSaveEditLesson(l.id)}
                      onCancelEdit={onCancelEditLesson}
                      onPublish={() => onPublishLesson(l.id)}
                      onDelete={() => onDeleteLesson(l.id)}
                      onOpen={() => onOpenLesson(l.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {creatingLesson ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <InlineInput
                autoFocus
                placeholder="Название урока"
                value={newLessonTitle}
                onChange={onChangeNewLessonTitle}
                onEnter={onCreateLesson}
              />
              <Button variant="primary" size="sm" onClick={onCreateLesson}>
                Создать
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelCreateLesson}>
                Отмена
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon="plus"
              onClick={onStartCreateLesson}
              style={{ marginTop: 10 }}
            >
              Добавить урок
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function SortableLessonRow({
  lesson,
  isEditing,
  editTitle,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onPublish,
  onDelete,
  onOpen,
}: {
  lesson: LessonOut;
  isEditing: boolean;
  editTitle: string;
  onStartEdit: () => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: 'var(--surface-2)',
        borderRadius: 8,
      }}
    >
      <button
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          background: 'none',
          border: 'none',
          color: 'var(--ink-300)',
          padding: 2,
        }}
        aria-label="Перетащить урок"
      >
        <Icon name="drag" size={14} />
      </button>
      {isEditing ? (
        <>
          <InlineInput
            value={editTitle}
            onChange={onChangeEdit}
            onEnter={onSaveEdit}
            autoFocus
          />
          <Button variant="primary" size="sm" onClick={onSaveEdit}>
            Сохранить
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
            Отмена
          </Button>
        </>
      ) : (
        <>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: 'var(--ink-900)' }}>
            {lesson.title}
          </div>
          <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>
            {lesson.duration_min} мин
          </span>
          {lesson.is_published ? (
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
            icon={lesson.is_published ? 'eyeOff' : 'eye'}
            onClick={onPublish}
          />
          <Button variant="ghost" size="sm" icon="edit" onClick={onStartEdit} />
          <Button variant="danger" size="sm" icon="trash" onClick={onDelete} />
          <Button
            variant="primary"
            size="sm"
            iconRight="arrowRight"
            onClick={onOpen}
          >
            Редактор
          </Button>
        </>
      )}
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
