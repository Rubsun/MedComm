import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { programsApi } from '@/api/programs';
import { coursesApi } from '@/api/courses';
import { modulesApi } from '@/api/modules';
import { lessonsApi } from '@/api/lessons';
import { progressApi } from '@/api/progress';
import type { CourseOut, LessonOut, ModuleOut, MyProgress, ProgramOut } from '@/types/api';
import { Badge, Button, Card, Empty, Icon, type IconName, Progress } from '@/components/medcomm';

interface CourseStat {
  course: CourseOut;
  total: number;
  completed: number;
  pct: number;
  isEnrolled: boolean;
}

type LessonStatus = 'completed' | 'next' | 'available' | 'locked';

export default function ProgramPage() {
  const { programId: programIdParam } = useParams<{ programId?: string }>();
  const navigate = useNavigate();

  const [programs, setPrograms] = useState<ProgramOut[]>([]);
  const [progress, setProgress] = useState<MyProgress | null>(null);
  const [program, setProgram] = useState<ProgramOut | null>(null);
  const [stats, setStats] = useState<CourseStat[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<number, LessonOut[]>>({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Initial load: programs + my progress + pick a program
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [progRes, programsRes] = await Promise.all([
          progressApi.me(),
          programsApi.list(),
        ]);
        setPrograms(programsRes.data);
        setProgress(progRes.data);

        const enrolledIds = new Set(progRes.data.enrollments.map((e) => e.course_id));

        let chosenProgram: ProgramOut | null = null;
        if (programIdParam) {
          chosenProgram =
            programsRes.data.find((p) => p.id === Number(programIdParam)) ?? null;
        } else {
          // выбрать первую программу с записями, иначе первую опубликованную
          for (const p of programsRes.data) {
            const courseList = (await coursesApi.list(p.id)).data;
            if (courseList.some((c) => enrolledIds.has(c.id))) {
              chosenProgram = p;
              break;
            }
          }
          if (!chosenProgram) chosenProgram = programsRes.data[0] ?? null;
        }
        setProgram(chosenProgram);
      } catch (err) {
        console.error('Failed to load programs', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [programIdParam]);

  // When program is set: load courses + per-course progress
  useEffect(() => {
    if (!program || !progress) return;
    (async () => {
      const courseList = (await coursesApi.list(program.id)).data;

      const enrolledIds = new Set(progress.enrollments.map((e) => e.course_id));
      const completedIds = new Set(progress.completed_lessons.map((p) => p.lesson_id));

      const statResults: CourseStat[] = await Promise.all(
        courseList.map(async (course) => {
          const courseModules = (await modulesApi.list(course.id)).data;
          const lessonLists = await Promise.all(
            courseModules.map((m) => lessonsApi.list(m.id).then((r) => r.data))
          );
          const lessons = lessonLists.flat().filter((l) => l.is_published);
          const completed = lessons.filter((l) => completedIds.has(l.id)).length;
          return {
            course,
            total: lessons.length,
            completed,
            pct: lessons.length === 0 ? 0 : Math.round((completed / lessons.length) * 100),
            isEnrolled: enrolledIds.has(course.id),
          };
        })
      );
      setStats(statResults);

      // выбрать курс по умолчанию: первый записанный с прогрессом < 100%, иначе первый записанный, иначе первый
      const inProgress = statResults.find((s) => s.isEnrolled && s.pct < 100);
      const enrolled = statResults.find((s) => s.isEnrolled);
      setSelectedCourseId(inProgress?.course.id ?? enrolled?.course.id ?? statResults[0]?.course.id ?? null);
    })();
  }, [program, progress]);

  // When selected course changes: load modules + lessons
  useEffect(() => {
    if (selectedCourseId == null) {
      setModules([]);
      setLessonsByModule({});
      return;
    }
    (async () => {
      const m = (await modulesApi.list(selectedCourseId)).data;
      setModules(m);
      const lessonResults = await Promise.all(
        m.map((mod) => lessonsApi.list(mod.id).then((r) => ({ moduleId: mod.id, lessons: r.data })))
      );
      const byModule: Record<number, LessonOut[]> = {};
      for (const r of lessonResults) byModule[r.moduleId] = r.lessons.filter((l) => l.is_published);
      setLessonsByModule(byModule);
    })();
  }, [selectedCourseId]);

  const completedIds = useMemo(
    () => new Set(progress?.completed_lessons.map((p) => p.lesson_id) ?? []),
    [progress]
  );

  const selectedStat = stats.find((s) => s.course.id === selectedCourseId);

  // Find the "next" lesson — first non-completed in the selected course
  const nextLessonId = useMemo(() => {
    for (const mod of modules) {
      if (mod.is_locked) continue;
      const ls = lessonsByModule[mod.id] ?? [];
      const next = ls.find((l) => !completedIds.has(l.id));
      if (next) return next.id;
    }
    return null;
  }, [modules, lessonsByModule, completedIds]);

  const handleEnrollSelected = async () => {
    if (!selectedStat || selectedStat.isEnrolled) return;
    setEnrolling(true);
    try {
      await progressApi.enroll(selectedStat.course.id);
      // refresh progress
      const progRes = await progressApi.me();
      setProgress(progRes.data);
    } catch (err) {
      console.error('Enroll failed', err);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка программы…</div>;
  }

  if (!program) {
    return (
      <div style={{ padding: '40px 32px', maxWidth: 1280, margin: '0 auto' }}>
        <Empty
          icon="map"
          title="Нет доступных программ"
          description="Попросите администратора опубликовать программу."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Программа header */}
      <div style={{ marginBottom: 24 }}>
        <Badge tone="teal" size="sm" icon="layers">
          Программа
        </Badge>
        <h1 style={{ fontSize: 26, marginTop: 10, marginBottom: 6 }}>{program.title}</h1>
        {program.description && (
          <p style={{ fontSize: 14, color: 'var(--ink-600)', maxWidth: 720, lineHeight: 1.5 }}>
            {program.description}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            gap: 22,
            marginTop: 14,
            fontSize: 12.5,
            color: 'var(--ink-600)',
            flexWrap: 'wrap',
          }}
        >
          <Stat icon="folder">{stats.length} {pluralize(stats.length, 'курс', 'курса', 'курсов')}</Stat>
          <Stat icon="book">
            {stats.reduce((s, c) => s + c.total, 0)} уроков
          </Stat>
          {programs.length > 1 && (
            <button
              onClick={() => navigate('/program')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                fontSize: 12.5,
                color: 'var(--teal-700)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Сменить программу →
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Courses sidebar */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--ink-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            Курсы
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.map((s) => (
              <CourseSidebarCard
                key={s.course.id}
                stat={s}
                active={s.course.id === selectedCourseId}
                onClick={() => setSelectedCourseId(s.course.id)}
              />
            ))}
            {stats.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-500)', padding: 12 }}>
                В этой программе пока нет курсов.
              </div>
            )}
          </div>
        </div>

        {/* Module tree */}
        <Card padding={0}>
          {selectedStat ? (
            <>
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--line-soft)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{selectedStat.course.title}</h3>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
                    Карта прогресса по модулям · {selectedStat.completed} / {selectedStat.total} уроков
                  </div>
                </div>
                {!selectedStat.isEnrolled ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon="plus"
                    disabled={enrolling}
                    onClick={handleEnrollSelected}
                  >
                    {enrolling ? 'Запись…' : 'Записаться'}
                  </Button>
                ) : nextLessonId ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon="play"
                    onClick={() => navigate(`/lesson/${nextLessonId}`)}
                  >
                    Продолжить
                  </Button>
                ) : (
                  <Badge tone="success" size="md" icon="check">
                    Курс пройден
                  </Badge>
                )}
              </div>
              <div style={{ padding: '12px 24px 24px' }}>
                {modules.length === 0 ? (
                  <div style={{ padding: 24, fontSize: 13, color: 'var(--ink-500)' }}>
                    Модули появятся после публикации.
                  </div>
                ) : (
                  modules.map((m, i) => (
                    <ModuleNode
                      key={m.id}
                      module={m}
                      index={i}
                      isLast={i === modules.length - 1}
                      lessons={lessonsByModule[m.id] ?? []}
                      completedIds={completedIds}
                      isEnrolled={selectedStat.isEnrolled}
                      nextLessonId={nextLessonId}
                      onLessonClick={(l) => navigate(`/lesson/${l.id}`)}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>
              Выберите курс слева.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────

function Stat({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={14} color="var(--ink-500)" />
      {children}
    </span>
  );
}

function CourseSidebarCard({
  stat,
  active,
  onClick,
}: {
  stat: CourseStat;
  active: boolean;
  onClick: () => void;
}) {
  const status: 'completed' | 'in_progress' | 'not_enrolled' =
    !stat.isEnrolled ? 'not_enrolled' : stat.pct === 100 ? 'completed' : 'in_progress';

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: 14,
        borderRadius: 12,
        border: `1px solid ${active ? 'var(--teal-500)' : 'var(--line)'}`,
        background: active ? 'var(--teal-50)' : 'var(--surface)',
        cursor: 'pointer',
        position: 'relative',
        display: 'block',
        width: '100%',
        boxShadow: active ? '0 0 0 3px rgba(20, 184, 166, 0.1)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {status === 'completed' && (
          <Badge tone="success" size="sm" icon="check">
            Завершён
          </Badge>
        )}
        {status === 'in_progress' && (
          <Badge tone="teal" size="sm">
            В процессе
          </Badge>
        )}
        {status === 'not_enrolled' && (
          <Badge tone="neutral" size="sm">
            Не записан
          </Badge>
        )}
      </div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: 'var(--ink-900)',
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {stat.course.title}
      </div>
      {stat.isEnrolled ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            value={stat.pct}
            height={4}
            color={stat.pct === 100 ? 'var(--success)' : 'var(--teal-600)'}
          />
          <span className="num" style={{ fontSize: 11, color: 'var(--ink-500)' }}>
            {stat.pct}%
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
          {stat.total} {pluralize(stat.total, 'урок', 'урока', 'уроков')}
        </div>
      )}
    </button>
  );
}

function ModuleNode({
  module,
  index,
  isLast,
  lessons,
  completedIds,
  isEnrolled,
  nextLessonId,
  onLessonClick,
}: {
  module: ModuleOut;
  index: number;
  isLast: boolean;
  lessons: LessonOut[];
  completedIds: Set<number>;
  isEnrolled: boolean;
  nextLessonId: number | null;
  onLessonClick: (l: LessonOut) => void;
}) {
  const completed = lessons.length > 0 && lessons.every((l) => completedIds.has(l.id));
  const inProgressCount = lessons.filter((l) => completedIds.has(l.id)).length;
  const someProgress = inProgressCount > 0 && !completed;
  const [open, setOpen] = useState(index < 2 || someProgress);

  return (
    <div style={{ position: 'relative', paddingLeft: 36, paddingBottom: isLast ? 0 : 10 }}>
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            left: 13,
            top: 28,
            bottom: 0,
            width: 2,
            background: completed ? 'var(--teal-200)' : 'var(--line)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 6,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: completed
            ? 'var(--teal-600)'
            : someProgress
              ? 'var(--surface)'
              : 'var(--bg-soft)',
          border: completed
            ? 'none'
            : `2px solid ${someProgress ? 'var(--teal-500)' : 'var(--line-strong)'}`,
          color: completed ? 'white' : someProgress ? 'var(--teal-600)' : 'var(--ink-400)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'Inter Tight',
        }}
      >
        {completed ? <Icon name="check" size={14} /> : index + 1}
      </div>

      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink-900)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {module.title}
            {module.is_locked && <Icon name="lock" size={13} color="var(--ink-400)" />}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 2 }}>
            {inProgressCount}/{lessons.length}{' '}
            {pluralize(lessons.length, 'урок', 'урока', 'уроков')} ·{' '}
            {completed
              ? 'модуль пройден'
              : module.is_locked
                ? 'модуль заблокирован'
                : someProgress
                  ? 'в процессе'
                  : 'не начат'}
          </div>
        </div>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} color="var(--ink-400)" />
      </button>

      {open && (
        <div
          className="anim-up"
          style={{
            marginTop: 4,
            marginLeft: 12,
            paddingLeft: 18,
            borderLeft: '1px dashed var(--line)',
          }}
        >
          {lessons.length === 0 ? (
            <div style={{ padding: 8, fontSize: 12, color: 'var(--ink-500)' }}>
              Пока нет уроков в модуле.
            </div>
          ) : (
            lessons.map((l) => {
              const status: LessonStatus = module.is_locked
                ? 'locked'
                : completedIds.has(l.id)
                  ? 'completed'
                  : !isEnrolled
                    ? 'locked'
                    : l.id === nextLessonId
                      ? 'next'
                      : 'available';
              return (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  status={status}
                  onClick={status === 'locked' ? undefined : () => onLessonClick(l)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  status,
  onClick,
}: {
  lesson: LessonOut;
  status: LessonStatus;
  onClick?: () => void;
}) {
  const colors: Record<LessonStatus, { c: string; bg: string; icon: IconName }> = {
    completed: { c: 'var(--success)', bg: 'var(--success-soft)', icon: 'checkCircle' },
    next: { c: 'var(--teal-600)', bg: 'var(--teal-50)', icon: 'play' },
    available: { c: 'var(--ink-500)', bg: 'var(--bg-soft)', icon: 'book' },
    locked: { c: 'var(--ink-400)', bg: 'var(--bg-soft)', icon: 'lock' },
  };
  const c = colors[status];
  const typeIcon: IconName =
    lesson.type === 'theory' ? 'book' : lesson.type === 'practice' ? 'msg' : 'sparkles';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: onClick ? 'pointer' : 'not-allowed',
        opacity: status === 'locked' ? 0.6 : 1,
        marginBottom: 2,
        transition: 'background .12s',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = 'var(--bg-soft)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: c.bg,
          color: c.c,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={c.icon} size={13} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-800)',
            fontWeight: status === 'next' ? 600 : 500,
          }}
        >
          {lesson.title}
        </div>
      </div>
      {lesson.duration_min > 0 && (
        <Badge tone="neutral" size="sm" icon={typeIcon}>
          {lesson.duration_min} мин
        </Badge>
      )}
      {status === 'next' && (
        <Badge tone="teal" size="sm" dot>
          сейчас
        </Badge>
      )}
    </div>
  );
}

function pluralize(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
