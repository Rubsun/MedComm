import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { programsApi } from '@/api/programs';
import type { ProgramOut } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ChevronRight, Eye, EyeOff, Pencil, Trash2, GripVertical } from 'lucide-react';

function SortableProgram({
  p,
  editingId, editTitle,
  onEdit, onEditTitle, onSave, onCancelEdit,
  onPublish, onDelete,
}: {
  p: ProgramOut;
  editingId: number | null;
  editTitle: string;
  onEdit: (id: number, title: string) => void;
  onEditTitle: (t: string) => void;
  onSave: (id: number) => void;
  onCancelEdit: () => void;
  onPublish: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: p.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
            <GripVertical className="w-4 h-4" />
          </button>
          {editingId === p.id ? (
            <>
              <Input value={editTitle} onChange={e => onEditTitle(e.target.value)} className="flex-1" autoFocus />
              <Button size="sm" onClick={() => onSave(p.id)}>Сохранить</Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>Отмена</Button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <div className="font-medium">{p.title}</div>
              </div>
              <Badge variant={p.is_published ? 'default' : 'secondary'}>
                {p.is_published ? 'Опубликована' : 'Черновик'}
              </Badge>
              <Button size="icon" variant="ghost" onClick={() => onPublish(p.id)} title={p.is_published ? 'Снять публикацию' : 'Опубликовать'}>
                {p.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onEdit(p.id, p.title)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
              <Link to={`/admin/programs/${p.id}/courses`}>
                <Button size="icon" variant="ghost"><ChevronRight className="w-4 h-4" /></Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramOut[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const load = () => programsApi.list().then(r => setPrograms(r.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await programsApi.create({ title: newTitle.trim(), description: '' });
    setNewTitle('');
    setCreating(false);
    load();
  };

  const handlePublish = async (id: number) => {
    await programsApi.publish(id);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить программу?')) return;
    await programsApi.delete(id);
    load();
  };

  const handleEdit = async (id: number) => {
    await programsApi.update(id, { title: editTitle });
    setEditingId(null);
    load();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = programs.findIndex(p => p.id === active.id);
    const newIndex = programs.findIndex(p => p.id === over.id);
    const reordered = arrayMove(programs, oldIndex, newIndex);
    setPrograms(reordered);
    await programsApi.reorder(reordered.map((p, i) => ({ id: p.id, sort_order: i })));
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Программы</h1>
        <Button onClick={() => setCreating(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />Добавить
        </Button>
      </div>

      {creating && (
        <Card>
          <CardContent className="p-4 flex gap-2">
            <Input
              placeholder="Название программы"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <Button onClick={handleCreate}>Создать</Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>Отмена</Button>
          </CardContent>
        </Card>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={programs.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {programs.map(p => (
              <SortableProgram
                key={p.id}
                p={p}
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
