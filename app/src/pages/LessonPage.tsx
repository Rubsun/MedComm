import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { lessonsApi } from '@/api/lessons';
import { progressApi } from '@/api/progress';
import type { LessonOut, LessonBlockOut } from '@/types/api';
import TextBlock from '@/components/lesson-blocks/TextBlock';
import ImageBlock from '@/components/lesson-blocks/ImageBlock';
import VideoBlock from '@/components/lesson-blocks/VideoBlock';
import PracticeBlock from '@/components/lesson-blocks/PracticeBlock';
import QuizBlock from '@/components/lesson-blocks/QuizBlock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<LessonOut | null>(null);
  const [blocks, setBlocks] = useState<LessonBlockOut[]>([]);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    const id = Number(lessonId);
    lessonsApi.get(id).then(r => setLesson(r.data));
    lessonsApi.getBlocks(id).then(r =>
      setBlocks(r.data.sort((a, b) => a.sort_order - b.sort_order))
    );
  }, [lessonId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await progressApi.completeLesson(Number(lessonId));
      setCompleted(true);
    } finally {
      setCompleting(false);
    }
  };

  if (!lesson) return <div className="p-6 text-slate-500">Загрузка...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{lesson.type}</Badge>
          <span className="text-sm text-slate-500">{lesson.duration_min} мин</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{lesson.title}</h1>
        {lesson.description && <p className="text-slate-500 mt-1">{lesson.description}</p>}
      </div>

      <div className="space-y-6">
        {blocks.map(block => (
          <div key={block.id}>
            {block.type === 'text' && <TextBlock data={block.data as { content: string }} />}
            {block.type === 'image' && <ImageBlock data={block.data as { url: string; caption?: string }} />}
            {block.type === 'video' && <VideoBlock data={block.data as { url: string; title?: string }} />}
            {block.type === 'practice' && <PracticeBlock block={block} />}
            {block.type === 'quiz' && <QuizBlock block={block} />}
          </div>
        ))}
      </div>

      <div className="border-t pt-6">
        {completed ? (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Урок завершён
          </div>
        ) : (
          <Button onClick={handleComplete} disabled={completing} className="w-full sm:w-auto">
            {completing ? 'Сохранение...' : 'Завершить урок'}
          </Button>
        )}
      </div>
    </div>
  );
}
