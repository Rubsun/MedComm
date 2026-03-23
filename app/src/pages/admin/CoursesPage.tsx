import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { coursesApi } from '@/api/courses';
import type { CourseOut } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ChevronRight, Eye, EyeOff, Pencil, Trash2, ArrowLeft, GripVertical } from 'lucide-react';

function SortableCourse({
  c,
  editingId, editTitle,
  onEdit, onEditTitle, onSave, onCancelEdit,
  onPublish, onDelete,
}: {
  c: CourseOut;
  editingId: number | null;
  editTitle: string;
  onEdit: (id: number, title: string) => void;
  onEditTitle: (t: string) => void;
  onSave: (id: number) => void;
  onCancelEdit: () => void;
  onPublish: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: c.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
            <GripVertical className="w-4 h-4" />
          </button>
          {editingId === c.id ? (
            <>
              <Input value={editTitle} onChange={e => onEditTitle(e.target.value)} className="flex-1" autoFocus />
              <Button size="sm" onClick={() => onSave(c.id)}>Сохранить</Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>Отмена</Button>
            </>
          ) : (
            <>
              <div className="flex-1 font-medium">{c.title}</div>
              <Badge variant={c.is_published ? 'default' : 'secondary'}>{c.is_published ? 'Опубликован' : 'Черновик'}</Badge>
              <Button size="icon" variant="ghost" onClick={() => onPublish(c.id)}>
                {c.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onEdit(c.id, c.title)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(c.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
              <Link to={`/admin/courses/${c.id}/lessons`}>
                <Button size="icon" variant="ghost"><ChevronRight className="w-4 h-4" /></Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CoursesPage() {
  const { programId } = useParams<{ programId: string }>();
  const pid = Number(programId);
  const [courses, setCourses] = useState<CourseOut[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const load = () => coursesApi.list(pid).then(r => setCourses(r.data));
  useEffect(() => { load(); }, [pid]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await coursesApi.create({ program_id: pid, title: newTitle.trim(), description: '' });
    setNewTitle(''); setCreating(false); load();
  };

  const handlePublish = async (id: number) => { await coursesApi.publish(id); load(); };
  const handleDelete = async (id: number) => {
    if (!confirm('Удалить курс?')) return;
    await coursesApi.delete(id); load();
  };
  const handleEdit = async (id: number) => {
    await coursesApi.update(id, { title: editTitle });
    setEditingId(null); load();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = courses.findIndex(c => c.id === active.id);
    const newIndex = courses.findIndex(c => c.id === over.id);
    const reordered = arrayMove(courses, oldIndex, newIndex);
    setCourses(reordered);
    await coursesApi.reorder(reordered.map((c, i) => ({ id: c.id, sort_order: i })));
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/admin/programs"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="text-xl font-bold text-slate-800">Курсы</h1>
        <div className="flex-1" />
        <Button onClick={() => setCreating(true)} size="sm" className="gap-2"><Plus className="w-4 h-4" />Добавить</Button>
      </div>

      {creating && (
        <Card><CardContent className="p-4 flex gap-2">
          <Input placeholder="Название курса" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
          <Button onClick={handleCreate}>Создать</Button>
          <Button variant="ghost" onClick={() => setCreating(false)}>Отмена</Button>
        </CardContent></Card>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={courses.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {courses.map(c => (
              <SortableCourse
                key={c.id}
                c={c}
                editingId={editingId}
                editTitle={editTitle}
                onEdit={(id, title) => { setEditingId(id); setEditTitle(title); }}
                onEditTitle={setEditTitle}
                onSave={handleEdit}
                onCancelEdit={() => setEditingId(null)}
                onPublish={handlePublish}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
