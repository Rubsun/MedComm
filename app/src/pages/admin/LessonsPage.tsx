import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { modulesApi } from '@/api/modules';
import { lessonsApi } from '@/api/lessons';
import type { ModuleOut, LessonOut } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Lock, Unlock, Trash2, Eye, EyeOff, ArrowLeft, ExternalLink } from 'lucide-react';

export default function LessonsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const cid = Number(courseId);
  const navigate = useNavigate();
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<number, LessonOut[]>>({});
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [creatingModule, setCreatingModule] = useState(false);
  const [newLessonTitles, setNewLessonTitles] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    const mods = (await modulesApi.list(cid)).data;
    setModules(mods);
    const byMod: Record<number, LessonOut[]> = {};
    await Promise.all(mods.map(async m => {
      byMod[m.id] = (await lessonsApi.list(m.id)).data;
    }));
    setLessonsByModule(byMod);
  }, [cid]);

  useEffect(() => { load(); }, [load]);

  const createModule = async () => {
    if (!newModuleTitle.trim()) return;
    await modulesApi.create({ course_id: cid, title: newModuleTitle.trim(), description: '' });
    setNewModuleTitle(''); setCreatingModule(false); load();
  };

  const createLesson = async (moduleId: number) => {
    const title = newLessonTitles[moduleId];
    if (!title?.trim()) return;
    await lessonsApi.create({ module_id: moduleId, title: title.trim(), description: '', type: 'theory', duration_min: 10 });
    setNewLessonTitles(prev => ({ ...prev, [moduleId]: '' }));
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-xl font-bold text-slate-800">Модули и уроки</h1>
        <div className="flex-1" />
        <Button size="sm" className="gap-2" onClick={() => setCreatingModule(true)}><Plus className="w-4 h-4" />Модуль</Button>
      </div>

      {creatingModule && (
        <div className="flex gap-2">
          <Input placeholder="Название модуля" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && createModule()} autoFocus />
          <Button onClick={createModule}>Создать</Button>
          <Button variant="ghost" onClick={() => setCreatingModule(false)}>Отмена</Button>
        </div>
      )}

      {modules.map(m => (
        <Card key={m.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">{m.title}</CardTitle>
              {m.is_locked && <Badge variant="secondary">Заблокирован</Badge>}
              <Button size="icon" variant="ghost" onClick={async () => { await modulesApi.lock(m.id); load(); }}>
                {m.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={async () => { if (confirm('Удалить модуль?')) { await modulesApi.delete(m.id); load(); } }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(lessonsByModule[m.id] ?? []).map(l => (
              <div key={l.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                <span className="flex-1 text-sm">{l.title}</span>
                <Badge variant={l.is_published ? 'default' : 'outline'} className="text-xs">
                  {l.is_published ? 'Опубликован' : 'Черновик'}
                </Badge>
                <Button size="icon" variant="ghost" onClick={async () => { await lessonsApi.publish(l.id); load(); }}>
                  {l.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Link to={`/admin/lessons/${l.id}/editor`}>
                  <Button size="icon" variant="ghost"><ExternalLink className="w-3 h-3" /></Button>
                </Link>
                <Button size="icon" variant="ghost" onClick={async () => { if (confirm('Удалить урок?')) { await lessonsApi.delete(l.id); load(); } }}>
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            ))}

            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Название урока"
                className="h-8 text-sm"
                value={newLessonTitles[m.id] ?? ''}
                onChange={e => setNewLessonTitles(prev => ({ ...prev, [m.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && createLesson(m.id)}
              />
              <Button size="sm" onClick={() => createLesson(m.id)}>+</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
