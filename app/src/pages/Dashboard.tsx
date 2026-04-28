import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { programsApi } from '@/api/programs';
import { coursesApi } from '@/api/courses';
import { modulesApi } from '@/api/modules';
import { lessonsApi } from '@/api/lessons';
import { progressApi } from '@/api/progress';
import type { CourseOut, LessonOut, MyProgress, ProgramOut } from '@/types/api';
import {
  Badge,
  Button,
  Card,
  Icon,
  type IconName,
  Progress,
} from '@/components/medcomm';

interface CourseStats {
  course: CourseOut;
  programTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  nextLesson: LessonOut | null;
  status: 'in_progress' | 'completed' | 'not_started';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ProgramOut[]>([]);
  const [progress, setProgress] = useState<MyProgress | null>(null);
  const [enrolledStats, setEnrolledStats] = useState<CourseStats[]>([]);
  const [unenrolledCourses, setUnenrolledCourses] = useState<
    { course: CourseOut; programTitle: string }[]
  >([]);
  const [enrolling, setEnrolling] = useState<number | null>(null);

  const refresh = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const [progRes, programsRes] = await Promise.all([
          progressApi.me(),
          programsApi.list(),
        ]);
        const myProgress = progRes.data;
        const programList = programsRes.data;
        setProgress(myProgress);
        setPrograms(programList);

        const programCourses = await Promise.all(
          programList.map(async (p) => {
            const courses = (await coursesApi.list(p.id)).data;
            return { program: p, courses };
          })
        );

        const enrolledIds = new Set(myProgress.enrollments.map((e) => e.course_id));
        const completedIds = new Set(myProgress.completed_lessons.map((p) => p.lesson_id));

        const enrolledStatsCalc: CourseStats[] = [];
        const unenrolledList: { course: CourseOut; programTitle: string }[] = [];

        for (const { program, courses } of programCourses) {
          for (const course of courses) {
            if (enrolledIds.has(course.id)) {
              const modules = (await modulesApi.list(course.id)).data;
              const lessonLists = await Promise.all(
                modules.map((m) => lessonsApi.list(m.id).then((r) => r.data))
              );
              const lessons = lessonLists.flat().filter((l) => l.is_published);
              const completed = lessons.filter((l) => completedIds.has(l.id)).length;
              const next = lessons.find((l) => !completedIds.has(l.id)) ?? null;
              const total = lessons.length;
              const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
              enrolledStatsCalc.push({
                course,
                programTitle: program.title,
                totalLessons: total,
                completedLessons: completed,
                progressPct: pct,
                nextLesson: next,
                status: total > 0 && completed === total
                  ? 'completed'
                  : completed > 0
                    ? 'in_progress'
                    : 'not_started',
              });
            } else {
              unenrolledList.push({ course, programTitle: program.title });
            }
          }
        }

        setEnrolledStats(enrolledStatsCalc);
        setUnenrolledCourses(unenrolledList);
      } catch (err) {
        console.error('Failed to load dashboard', err);
        setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const continueCandidate = useMemo(() => {
    return enrolledStats.find((s) => s.nextLesson) ?? null;
  }, [enrolledStats]);

  const totalLessonsCompleted = progress?.completed_lessons.length ?? 0;
  const totalLessonsAcrossEnrolled = enrolledStats.reduce((s, c) => s + c.totalLessons, 0);

  const avgQuizScore = useMemo(() => {
    if (!progress || progress.quiz_results.length === 0) return null;
    const valid = progress.quiz_results.filter((q) => q.max_score > 0);
    if (valid.length === 0) return null;
    const sum = valid.reduce((s, q) => s + (q.best_score / q.max_score) * 100, 0);
    return Math.round(sum / valid.length);
  }, [progress]);

  const activeCoursesCount = enrolledStats.filter((s) => s.status === 'in_progress').length;

  const handleContinue = () => {
    if (continueCandidate?.nextLesson) navigate(`/lesson/${continueCandidate.nextLesson.id}`);
  };

  const handleEnroll = async (courseId: number) => {
    setEnrolling(courseId);
    try {
      await progressApi.enroll(courseId);
      await refresh();
    } catch (err) {
      console.error('Enroll failed', err);
    } finally {
      setEnrolling(null);
    }
  };

  if (loading && !progress) {
    return (
      <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка прогресса…</div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 9,
            background: 'var(--danger-soft)',
            color: 'var(--danger)',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* HERO */}
      {continueCandidate?.nextLesson ? (
        <ContinueHero
          courseTitle={continueCandidate.course.title}
          programTitle={continueCandidate.programTitle}
          lessonTitle={continueCandidate.nextLesson.title}
          completed={continueCandidate.completedLessons}
          total={continueCandidate.totalLessons}
          progressPct={continueCandidate.progressPct}
          onContinue={handleContinue}
          onMap={() => navigate('/program')}
        />
      ) : enrolledStats.length === 0 ? (
        <NewbieHero
          firstName={user?.first_name ?? ''}
          onScroll={() =>
            document.getElementById('available-courses')?.scrollIntoView({ behavior: 'smooth' })
          }
        />
      ) : (
        <CompletedHero firstName={user?.first_name ?? ''} />
      )}

      {/* STATS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          margin: '24px 0 28px',
        }}
      >
        <StatCard
          icon="checkCircle"
          iconColor="var(--teal-600)"
          label="Завершено"
          value={String(totalLessonsCompleted)}
          sub={`из ${totalLessonsAcrossEnrolled} уроков`}
        />
        <StatCard
          icon="book"
          iconColor="var(--info)"
          label="Активные курсы"
          value={String(activeCoursesCount)}
          sub={`${enrolledStats.length} в обучении`}
        />
        <StatCard
          icon="target"
          iconColor="var(--indigo)"
          label="Средний балл"
          value={avgQuizScore != null ? String(avgQuizScore) : '—'}
          sub="по тестам"
        />
        <StatCard
          icon="trophy"
          iconColor="#7C3AED"
          label="Достижений"
          value="—"
          sub="скоро"
        />
      </div>

      {/* MY COURSES */}
      <Card padding={0} style={{ marginBottom: 20 }}>
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--line-soft)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15 }}>Мои курсы</h3>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
              {enrolledStats.length === 0
                ? 'Запишитесь на курс ниже, чтобы начать обучение.'
                : `${enrolledStats.length} ${pluralize(enrolledStats.length, 'курс', 'курса', 'курсов')} в работе`}
            </div>
          </div>
          {enrolledStats.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              iconRight="arrowRight"
              onClick={() => navigate('/program')}
            >
              Карта программы
            </Button>
          )}
        </div>
        <div>
          {enrolledStats.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--ink-500)',
                fontSize: 13,
              }}
            >
              Пока пусто — выберите курс ниже.
            </div>
          ) : (
            enrolledStats.map((s) => (
              <CourseRow
                key={s.course.id}
                stats={s}
                onClick={() => {
                  if (s.nextLesson) navigate(`/lesson/${s.nextLesson.id}`);
                  else navigate('/program');
                }}
              />
            ))
          )}
        </div>
      </Card>

      {/* AVAILABLE PROGRAMS */}
      {programs.length > 0 && (
        <Card padding={0} id="available-courses">
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--line-soft)',
            }}
          >
            <h3 style={{ fontSize: 15 }}>Доступные программы</h3>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
              Выберите курс, чтобы записаться и начать обучение.
            </div>
          </div>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {programs.map((program) => {
              const courses = unenrolledCourses.filter(
                (c) => c.course.program_id === program.id
              );
              if (courses.length === 0) return null;
              return (
                <div key={program.id}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--ink-800)',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Icon name="layers" size={14} color="var(--teal-600)" />
                    {program.title}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {courses.map(({ course }) => (
                      <UnenrolledCourseCard
                        key={course.id}
                        course={course}
                        loading={enrolling === course.id}
                        onEnroll={() => handleEnroll(course.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Heroes
// ──────────────────────────────────────────────────────────────────────────

function ContinueHero({
  courseTitle,
  programTitle,
  lessonTitle,
  completed,
  total,
  progressPct,
  onContinue,
  onMap,
}: {
  courseTitle: string;
  programTitle: string;
  lessonTitle: string;
  completed: number;
  total: number;
  progressPct: number;
  onContinue: () => void;
  onMap: () => void;
}) {
  return (
    <div
      className="anim-up"
      style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)',
        borderRadius: 18,
        padding: 28,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(45, 212, 191, 0.15)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
          fontSize: 12,
          opacity: 0.85,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        <Icon name="play" size={12} /> Продолжить обучение
      </div>
      <h2 style={{ color: 'white', fontSize: 24, marginBottom: 6, fontFamily: 'Inter Tight' }}>
        {lessonTitle}
      </h2>
      <div style={{ fontSize: 13.5, opacity: 0.85, marginBottom: 20 }}>
        {programTitle} · {courseTitle}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <Progress value={progressPct} color="var(--teal-400)" bg="rgba(255,255,255,0.15)" height={8} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 8,
              fontSize: 11.5,
              opacity: 0.8,
            }}
          >
            <span>
              {completed} из {total} уроков
            </span>
            <span className="num">{progressPct}%</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button
          variant="primary"
          icon="play"
          onClick={onContinue}
          style={{ background: 'white', color: 'var(--teal-700)', borderColor: 'white' }}
        >
          Продолжить урок
        </Button>
        <Button
          variant="ghost"
          icon="map"
          onClick={onMap}
          style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          К карте программы
        </Button>
      </div>
    </div>
  );
}

function NewbieHero({ firstName, onScroll }: { firstName: string; onScroll: () => void }) {
  return (
    <div
      className="anim-up"
      style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)',
        borderRadius: 18,
        padding: 28,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <h2
        style={{
          color: 'white',
          fontSize: 24,
          marginBottom: 6,
          fontFamily: 'Inter Tight',
        }}
      >
        Привет{firstName ? `, ${firstName}` : ''}!
      </h2>
      <p style={{ fontSize: 13.5, opacity: 0.85, marginBottom: 18, maxWidth: 540 }}>
        Чтобы начать, выберите курс из доступных программ ниже. Каждый курс состоит из теории
        и практики на интерактивных кейсах.
      </p>
      <Button
        variant="primary"
        icon="arrowDown"
        onClick={onScroll}
        style={{ background: 'white', color: 'var(--teal-700)', borderColor: 'white' }}
      >
        Выбрать курс
      </Button>
    </div>
  );
}

function CompletedHero({ firstName }: { firstName: string }) {
  return (
    <div
      className="anim-up"
      style={{
        background: 'linear-gradient(135deg, #047857 0%, #065F46 100%)',
        borderRadius: 18,
        padding: 28,
        color: 'white',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12, opacity: 0.85, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        <Icon name="checkCircle" size={12} /> Все курсы пройдены
      </div>
      <h2 style={{ color: 'white', fontSize: 24, marginBottom: 6, fontFamily: 'Inter Tight' }}>
        Поздравляем{firstName ? `, ${firstName}` : ''}!
      </h2>
      <p style={{ fontSize: 13.5, opacity: 0.85 }}>
        Вы прошли все курсы из ваших записей. Возвращайтесь — мы готовим новые материалы.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Pieces
// ──────────────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card padding={18}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
          }}
        >
          <Icon name={icon} size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--ink-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 500,
            }}
          >
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <span
              className="num"
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'Inter Tight',
                color: 'var(--ink-900)',
              }}
            >
              {value}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{sub}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CourseRow({ stats, onClick }: { stats: CourseStats; onClick: () => void }) {
  const isCompleted = stats.status === 'completed';
  const tone = isCompleted ? 'var(--success)' : 'var(--teal-600)';
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 22px',
        borderTop: '1px solid var(--line-soft)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'background .12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-soft)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          flexShrink: 0,
          background: isCompleted ? 'var(--success-soft)' : 'var(--teal-50)',
          color: isCompleted ? 'var(--success)' : 'var(--teal-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={isCompleted ? 'checkCircle' : 'book'} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>
            {stats.course.title}
          </span>
          {isCompleted && (
            <Badge tone="success" size="sm" icon="check">
              Завершён
            </Badge>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress value={stats.progressPct} color={tone} height={4} />
          <span
            className="num"
            style={{
              fontSize: 11,
              color: 'var(--ink-500)',
              whiteSpace: 'nowrap',
              minWidth: 30,
              textAlign: 'right',
            }}
          >
            {stats.progressPct}%
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 4 }}>
          {stats.completedLessons} / {stats.totalLessons} уроков · {stats.programTitle}
        </div>
      </div>
      <Icon name="chevronRight" size={16} color="var(--ink-400)" />
    </div>
  );
}

function UnenrolledCourseCard({
  course,
  loading,
  onEnroll,
}: {
  course: CourseOut;
  loading: boolean;
  onEnroll: () => void;
}) {
  return (
    <Card padding={16} hover>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
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
        <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>
          {course.title}
        </div>
      </div>
      {course.description && (
        <p
          style={{
            fontSize: 12.5,
            color: 'var(--ink-500)',
            lineHeight: 1.45,
            marginBottom: 14,
            minHeight: 36,
          }}
        >
          {course.description}
        </p>
      )}
      <Button variant="soft" size="sm" full disabled={loading} onClick={onEnroll}>
        {loading ? 'Запись…' : 'Записаться на курс'}
      </Button>
    </Card>
  );
}

function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
