import { useEffect, useState } from 'react';
import { analyticsApi } from '@/api/analytics';
import type {
  AnalyticsOverview,
  CompletionRate,
  QuizAnalytics,
} from '@/types/api';
import { Badge, Card, KpiCard, Progress } from '@/components/medcomm';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [completion, setCompletion] = useState<CompletionRate[]>([]);
  const [dropoff, setDropoff] = useState<CompletionRate[]>([]);
  const [quizzes, setQuizzes] = useState<QuizAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, cmp, drp, qz] = await Promise.all([
          analyticsApi.overview(),
          analyticsApi.completion(),
          analyticsApi.dropoff(),
          analyticsApi.quizResults(),
        ]);
        setOverview(ov.data);
        setCompletion(cmp.data);
        setDropoff(drp.data.slice(0, 8));
        setQuizzes(qz.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка аналитики…</div>;
  }

  const totalEnrollments =
    overview?.enrollments_per_course.reduce((s, e) => s + e.enrollment_count, 0) ?? 0;
  const maxEnrolment = Math.max(
    1,
    ...(overview?.enrollments_per_course.map((e) => e.enrollment_count) ?? [0])
  );

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 24 }}>Аналитика</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-500)', marginTop: 4 }}>
          Метрики обучения по платформе
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <KpiCard label="Студентов" value={overview?.total_students ?? 0} />
        <KpiCard
          label="Активных за 30 дней"
          value={overview?.active_students_last_30_days ?? 0}
          tone="info"
        />
        <KpiCard label="Записей на курсы" value={totalEnrollments} tone="teal" />
        <KpiCard label="Тестов сдано" value={quizzes.reduce((s, q) => s + q.passed_count, 0)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        <Card padding={0}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3 style={{ fontSize: 15 }}>Записи по курсам</h3>
          </div>
          {(overview?.enrollments_per_course.length ?? 0) === 0 ? (
            <div style={{ padding: 28, fontSize: 13, color: 'var(--ink-500)' }}>Пока нет записей.</div>
          ) : (
            (overview?.enrollments_per_course ?? []).map((e) => (
              <div
                key={e.course_id}
                style={{
                  padding: '14px 22px',
                  borderTop: '1px solid var(--line-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--ink-900)',
                      marginBottom: 6,
                    }}
                  >
                    {e.course_title}
                  </div>
                  <Progress value={e.enrollment_count} max={maxEnrolment} height={4} />
                </div>
                <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>
                  {e.enrollment_count}
                </div>
              </div>
            ))
          )}
        </Card>

        <Card padding={0}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3 style={{ fontSize: 15 }}>Уроки с малым прохождением</h3>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
              Топ потенциальных точек отвала
            </div>
          </div>
          {dropoff.length === 0 ? (
            <div style={{ padding: 28, fontSize: 13, color: 'var(--ink-500)' }}>
              Пока недостаточно данных.
            </div>
          ) : (
            dropoff.map((row, i) => (
              <div
                key={row.lesson_id}
                style={{
                  padding: '12px 22px',
                  borderTop: '1px solid var(--line-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  className="num"
                  style={{ width: 22, fontSize: 12, color: 'var(--ink-400)', fontWeight: 600 }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-900)' }}>
                  {row.lesson_title}
                </div>
                <Badge tone="warning" size="sm">
                  {row.completed_count} {pluralize(row.completed_count, 'студент', 'студента', 'студентов')}
                </Badge>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Quiz table */}
      <Card padding={0}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-soft)' }}>
          <h3 style={{ fontSize: 15 }}>Результаты тестов</h3>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
            По каждому quiz-блоку: попыток, средний балл, доля сдавших
          </div>
        </div>
        {quizzes.length === 0 ? (
          <div style={{ padding: 28, fontSize: 13, color: 'var(--ink-500)' }}>Тестов пока не было.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: 'var(--ink-500)', textAlign: 'left' }}>
                <th style={{ padding: '12px 22px', fontWeight: 500, fontSize: 11.5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Блок</th>
                <th style={{ padding: '12px 0', fontWeight: 500, fontSize: 11.5, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right' }}>Попыток</th>
                <th style={{ padding: '12px 0', fontWeight: 500, fontSize: 11.5, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right' }}>Ср. балл</th>
                <th style={{ padding: '12px 22px', fontWeight: 500, fontSize: 11.5, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right' }}>Сдали</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => {
                const passRate =
                  q.attempt_count > 0 ? Math.round((q.passed_count / q.attempt_count) * 100) : null;
                return (
                  <tr key={q.lesson_block_id} style={{ borderTop: '1px solid var(--line-soft)' }}>
                    <td style={{ padding: '12px 22px', color: 'var(--ink-800)' }}>
                      Блок #{q.lesson_block_id}
                    </td>
                    <td className="num" style={{ padding: '12px 0', textAlign: 'right' }}>
                      {q.attempt_count}
                    </td>
                    <td className="num" style={{ padding: '12px 0', textAlign: 'right' }}>
                      {q.avg_score_pct != null ? `${Math.round(q.avg_score_pct)}%` : '—'}
                    </td>
                    <td style={{ padding: '12px 22px', textAlign: 'right' }}>
                      {passRate != null ? (
                        <Badge tone={passRate >= 70 ? 'success' : passRate >= 40 ? 'warning' : 'danger'} size="sm">
                          {passRate}%
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Полный список completion */}
      {completion.length > 0 && (
        <Card padding={0} style={{ marginTop: 22 }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-soft)' }}>
            <h3 style={{ fontSize: 15 }}>Завершения по урокам</h3>
          </div>
          {completion.map((row) => (
            <div
              key={row.lesson_id}
              style={{
                padding: '10px 22px',
                borderTop: '1px solid var(--line-soft)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
              }}
            >
              <span style={{ flex: 1, color: 'var(--ink-800)' }}>{row.lesson_title}</span>
              <span className="num" style={{ color: 'var(--ink-700)', fontWeight: 600 }}>
                {row.completed_count}
              </span>
            </div>
          ))}
        </Card>
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
