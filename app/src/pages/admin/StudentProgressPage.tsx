import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentsApi } from '@/api/students';
import type { StudentProgress } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';

export default function StudentProgressPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  useEffect(() => {
    studentsApi.progress(Number(studentId)).then(r => setProgress(r.data));
  }, [studentId]);

  if (!progress) return <div className="p-6 text-slate-500">Загрузка...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-xl font-bold text-slate-800">Прогресс студента</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />Записи на курсы</CardTitle></CardHeader>
          <CardContent>
            {progress.enrollments.length === 0
              ? <p className="text-slate-400 text-sm">Нет записей</p>
              : progress.enrollments.map((e, i) => (
                <div key={i} className="text-sm py-1 border-b last:border-0">
                  Курс #{e.course_id} — {new Date(e.enrolled_at).toLocaleDateString('ru')}
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Завершённые уроки</CardTitle></CardHeader>
          <CardContent>
            {progress.completed_lessons.length === 0
              ? <p className="text-slate-400 text-sm">Нет завершённых уроков</p>
              : progress.completed_lessons.map(l => (
                <div key={l.lesson_id} className="text-sm py-1 border-b last:border-0">
                  Урок #{l.lesson_id} — {new Date(l.completed_at).toLocaleDateString('ru')}
                </div>
              ))}
            <div className="mt-2 font-medium text-sm">Итого: {progress.completed_lessons.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
