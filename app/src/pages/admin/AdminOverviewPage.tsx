import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '@/api/analytics';
import { studentsApi } from '@/api/students';
import { programsApi } from '@/api/programs';
import type {
  AnalyticsOverview,
  CompletionRate,
  ProgramOut,
  QuizAnalytics,
  StudentOut,
} from '@/types/api';
import { Badge, Button, Card, Icon, KpiCard, Progress } from '@/components/medcomm';

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [completion, setCompletion] = useState<CompletionRate[]>([]);
  const [quizzes, setQuizzes] = useState<QuizAnalytics[]>([]);
  const [students, setStudents] = useState<StudentOut[]>([]);
  const [programs, setPrograms] = useState<ProgramOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, cmp, quizR, stud, prog] = await Promise.all([
          analyticsApi.overview(),
          analyticsApi.completion(),
          analyticsApi.quizResults(),
          studentsApi.list(),
          programsApi.list(),
        ]);
        setOverview(ov.data);
        setCompletion(cmp.data);
        setQuizzes(quizR.data);
        setStudents(stud.data);
        setPrograms(prog.data);
      } catch (err) {
        console.error('Failed to load admin overview', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка обзора…</div>;
  }

  const totalEnrollments = overview?.enrollments_per_course.reduce(
    (s, e) => s + e.enrollment_count,
    0
  ) ?? 0;

  const avgQuizPct = quizzes.length === 0
    ? null
    : Math.round(
        quizzes.reduce((s, q) => s + (q.avg_score_pct ?? 0), 0) / quizzes.length
      );

  const completionTop = [...completion]
    .sort((a, b) => b.completed_count - a.completed_count)
    .slice(0, 5);

  const maxCompletion = completionTop[0]?.completed_count ?? 0;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20,
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24 }}>Обзор платформы</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink-500)', marginTop: 4 }}>
            Сводная статистика и быстрые действия
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon="chart"
          onClick={() => navigate('/admin/analytics')}
        >
          Полная аналитика
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon="plus"
          onClick={() => navigate('/admin/programs')}
        >
          Управление программами
        </Button>
      </div>

      {/* KPI strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <KpiCard
          label="Студентов"
          value={overview?.total_students ?? 0}
        />
        <KpiCard
          label="Активных за 30 дней"
          value={overview?.active_students_last_30_days ?? 0}
          tone="info"
        />
        <KpiCard
          label="Записей на курсы"
          value={totalEnrollments}
          tone="teal"
        />
        <KpiCard
          label="Средний балл"
          value={avgQuizPct != null ? `${avgQuizPct}%` : '—'}
          tone={avgQuizPct != null && avgQuizPct >= 70 ? 'success' : 'warning'}
        />
      </div>

      {/* Two columns: completion + quick lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 22 }}>
        <Card padding={0}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3 style={{ fontSize: 15 }}>Топ-5 уроков по завершениям</h3>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
              Какие уроки проходят чаще всего
            </div>
          </div>
          {completionTop.length === 0 ? (
            <div style={{ padding: 28, fontSize: 13, color: 'var(--ink-500)' }}>
              Пока нет данных — студенты ещё не проходили уроки.
            </div>
          ) : (
            completionTop.map((row, i) => (
              <div
                key={row.lesson_id}
                style={{
                  padding: '14px 22px',
                  borderTop: '1px solid var(--line-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <span
                  className="num"
                  style={{ width: 22, fontSize: 13, color: 'var(--ink-400)', fontWeight: 600 }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-900)', marginBottom: 6 }}>
                    {row.lesson_title}
                  </div>
                  <Progress
                    value={row.completed_count}
                    max={Math.max(1, maxCompletion)}
                    height={4}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>
                    {row.completed_count}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>завершений</div>
                </div>
              </div>
            ))
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding={0}>
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--line-soft)',
                display: 'flex',
              }}
            >
              <h3 style={{ fontSize: 15, flex: 1 }}>Программы</h3>
              <Button
                variant="ghost"
                size="xs"
                iconRight="arrowRight"
                onClick={() => navigate('/admin/programs')}
              >
                Все
              </Button>
            </div>
            <div>
              {programs.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 22px',
                    borderTop: '1px solid var(--line-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/admin/programs/${p.id}/courses`)}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: 'var(--teal-50)',
                      color: 'var(--teal-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="layers" size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
                      {p.is_published ? 'Опубликована' : 'Черновик'}
                    </div>
                  </div>
                  {p.is_published ? (
                    <Badge tone="success" size="sm" dot>
                      Live
                    </Badge>
                  ) : (
                    <Badge tone="neutral" size="sm">
                      Draft
                    </Badge>
                  )}
                </div>
              ))}
              {programs.length === 0 && (
                <div style={{ padding: 22, fontSize: 12.5, color: 'var(--ink-500)' }}>
                  Программ пока нет.
                </div>
              )}
            </div>
          </Card>

          <Card padding={0}>
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--line-soft)',
                display: 'flex',
              }}
            >
              <h3 style={{ fontSize: 15, flex: 1 }}>Последние студенты</h3>
              <Button
                variant="ghost"
                size="xs"
                iconRight="arrowRight"
                onClick={() => navigate('/admin/students')}
              >
                Все
              </Button>
            </div>
            <div>
              {students.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '10px 22px',
                    borderTop: '1px solid var(--line-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/admin/students/${s.id}`)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--ink-900)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.first_name} {s.last_name}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{s.email}</div>
                  </div>
                  {!s.is_active && (
                    <Badge tone="warning" size="sm">
                      Не активен
                    </Badge>
                  )}
                </div>
              ))}
              {students.length === 0 && (
                <div style={{ padding: 22, fontSize: 12.5, color: 'var(--ink-500)' }}>
                  Студентов пока нет.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
