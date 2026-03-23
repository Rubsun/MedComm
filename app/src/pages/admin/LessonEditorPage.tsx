import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonsApi } from '@/api/lessons';
import type { LessonOut, LessonBlockOut } from '@/types/api';
import BlockEditorPanel from '@/components/admin/BlockEditorPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function LessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lid = Number(lessonId);
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonOut | null>(null);
  const [blocks, setBlocks] = useState<LessonBlockOut[]>([]);

  const loadBlocks = useCallback(() =>
    lessonsApi.getBlocks(lid).then(r =>
      setBlocks(r.data.sort((a, b) => a.sort_order - b.sort_order))
    ), [lid]);

  useEffect(() => {
    lessonsApi.get(lid).then(r => setLesson(r.data));
    loadBlocks();
  }, [lid, loadBlocks]);

  const handlePublish = async () => {
    await lessonsApi.publish(lid);
    const r = await lessonsApi.get(lid);
    setLesson(r.data);
  };

  if (!lesson) return <div className="p-6 text-slate-500">Загрузка...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3 flex items-center gap-3 bg-white">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="font-bold text-slate-800 flex-1">{lesson.title}</h1>
        <Badge variant={lesson.is_published ? 'default' : 'secondary'}>
          {lesson.is_published ? 'Опубликован' : 'Черновик'}
        </Badge>
        <Button size="sm" variant="outline" className="gap-2" onClick={handlePublish}>
          {lesson.is_published ? <><EyeOff className="w-4 h-4" />Снять</> : <><Eye className="w-4 h-4" />Опубликовать</>}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <BlockEditorPanel lessonId={lid} blocks={blocks} onBlocksChange={loadBlocks} />
      </div>
    </div>
  );
}
