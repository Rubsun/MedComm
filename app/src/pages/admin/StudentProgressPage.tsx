import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentsApi } from '@/api/students';
import { coursesApi } from '@/api/courses';
import { lessonsApi } from '@/api/lessons';
import { modulesApi } from '@/api/modules';
import type { CourseOut, LessonOut, StudentProgress } from '@/types/api';
import { Avatar, Badge, Button, Card, Empty, Icon } from '@/components/medcomm';

interface CourseInfo {
  course: CourseOut;
  enrolled_at: string;
  totalLessons: number;
  completedLessons: number;
}

export default function StudentProgressPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [courseInfos, setCourseInfos] = useState<CourseInfo[]>([]);
  const [completedLessonTitles, setCompletedLessonTitles] = useState<Map<number, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      try {
        const id = Number(studentId);
        const [progRes, listRes] = await Promise.all([
          studentsApi.progress(id),
          studentsApi.list(),
        ]);
        const meta = listRes.data.find((s) => s.id === id);
        if (meta) {
          setStudentName(`${meta.first_name} ${meta.last_name}`);
          setStudentEmail(meta.email);
        }
        const data = progRes.data;
        setProgress(data);

        const completedIds = new Set(data.completed_lessons.map((p) => p.lesson_id));

        // resolve course details + completion stats
        const infos: CourseInfo[] = [];
        const titleMap = new Map<number, string>();
        for (const enr of data.enrollments) {
          try {
            const course = (await coursesApi.get(enr.course_id)).data;
            const modules = (await modulesApi.list(course.id)).data;
            const lessonLists = await Promise.all(
              modules.map((m) => lessonsApi.list(m.id).then((r) => r.data))
            );
            const lessons: LessonOut[] = lessonLists.flat();
            for (const l of lessons) titleMap.set(l.id, l.title);
            const completed = lessons.filter((l) => completedIds.has(l.id)).length;
            infos.push({
              course,
              enrolled_at: enr.enrolled_at,
              totalLessons: lessons.length,
              completedLessons: completed,
            });
          } catch (err) {
            console.error('Failed to load course details', enr.course_id, err);
          }
        }
        setCourseInfos(infos);
        setCompletedLessonTitles(titleMap);
      } catch (err) {
        console.error('Failed to load student progress', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  if (loading) {
    return <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка прогресса студента…</div>;
  }
  if (!progress) {
    return (
      <div style={{ padding: '40px 32px' }}>
        <Empty icon="user" title="Студент не найден" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <Button
        variant="ghost"
        size="sm"
        icon="chevronLeft"
        onClick={() => navigate('/admin/students')}
        style={{ marginBottom: 14 }}
      >
        К списку студентов
      </Button>

      <Card padding={22} style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={studentName || studentEmail} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, marginBottom: 4 }}>
              {studentName || 'Студент'}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{studentEmail}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>
              {progress.completed_lessons.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>уроков пройдено</div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card padding={0}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3 style={{ fontSize: 15 }}>Записи на курсы</h3>
          </div>
          {courseInfos.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--ink-500)' }}>
              Студент пока не записан ни на один курс.
            </div>
          ) : (
            courseInfos.map((info) => {
              const pct =
                info.totalLessons === 0
                  ? 0
                  : Math.round((info.completedLessons / info.totalLessons) * 100);
              return (
                <div
                  key={info.course.id}
                  style={{
                    padding: '14px 22px',
                    borderTop: '1px solid var(--line-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: 'var(--teal-50)',
                      color: 'var(--teal-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="book" size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--ink-900)',
                        marginBottom: 2,
                      }}
                    >
                      {info.course.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
                      {info.completedLessons} / {info.totalLessons} уроков · записан{' '}
                      {formatDate(info.enrolled_at)}
                    </div>
                  </div>
                  <Badge
                    tone={pct === 100 ? 'success' : pct > 0 ? 'teal' : 'neutral'}
                    size="md"
                  >
                    {pct}%
                  </Badge>
                </div>
              );
            })
          )}
        </Card>

        <Card padding={0}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3 style={{ fontSize: 15 }}>Последние пройденные уроки</h3>
          </div>
          {progress.completed_lessons.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--ink-500)' }}>
              Уроков пока не пройдено.
            </div>
          ) : (
            [...progress.completed_lessons]
              .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
              .slice(0, 12)
              .map((p) => (
                <div
                  key={p.lesson_id}
                  style={{
                    padding: '12px 22px',
                    borderTop: '1px solid var(--line-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Icon name="checkCircle" size={14} color="var(--success)" />
                  <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-900)' }}>
                    {completedLessonTitles.get(p.lesson_id) ?? `Урок #${p.lesson_id}`}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
                    {formatDate(p.completed_at)}
                  </div>
                </div>
              ))
          )}
        </Card>
      </div>
    </div>
  );
}

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return s;
  }
}
