import { useEffect, useState } from 'react';
import { analyticsApi } from '@/api/analytics';
import type { AnalyticsOverview, CompletionRate, QuizAnalytics } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, TrendingDown } from 'lucide-react';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [completion, setCompletion] = useState<CompletionRate[]>([]);
  const [dropoff, setDropoff] = useState<CompletionRate[]>([]);
  const [quizzes, setQuizzes] = useState<QuizAnalytics[]>([]);

  useEffect(() => {
    analyticsApi.overview().then(r => setOverview(r.data)).catch(console.error);
    analyticsApi.completion().then(r => setCompletion(r.data)).catch(console.error);
    analyticsApi.dropoff().then(r => setDropoff(r.data.slice(0, 5))).catch(console.error);
    analyticsApi.quizResults().then(r => setQuizzes(r.data)).catch(console.error);
  }, []);

  const totalEnrollments = overview?.enrollments_per_course.reduce((s, e) => s + e.enrollment_count, 0) ?? 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Аналитика</h1>

      {/* Overview stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold">{overview?.total_students ?? '—'}</div>
              <div className="text-sm text-slate-500">Студентов</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg"><BookOpen className="w-5 h-5 text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold">{overview ? totalEnrollments : '—'}</div>
              <div className="text-sm text-slate-500">Записей на курсы</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-100 p-3 rounded-lg"><TrendingDown className="w-5 h-5 text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold">
                {overview?.active_students_last_30_days ?? '—'}
              </div>
              <div className="text-sm text-slate-500">Активных за 30 дней</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments per course */}
      {overview && overview.enrollments_per_course.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Записи по курсам</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={overview.enrollments_per_course}>
                <XAxis dataKey="course_title" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="enrollment_count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Completion counts */}
      {completion.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Завершения уроков</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={completion} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="lesson_title" width={160} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="completed_count" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Drop-off top 5 */}
      {dropoff.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Уроки с наибольшим отсевом</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dropoff.map((l, i) => (
                <div key={l.lesson_id} className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-4">{i + 1}</span>
                  <span className="flex-1 text-sm">{l.lesson_title}</span>
                  <span className="font-medium text-red-600 text-sm">{l.completed_count} завершений</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz results */}
      {quizzes.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Результаты тестов</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b">
                  <th className="text-left pb-2">Блок</th>
                  <th className="text-right pb-2">Попыток</th>
                  <th className="text-right pb-2">Ср. балл</th>
                  <th className="text-right pb-2">Сдали</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map(q => (
                  <tr key={q.lesson_block_id} className="border-b last:border-0">
                    <td className="py-2">Блок #{q.lesson_block_id}</td>
                    <td className="py-2 text-right">{q.attempt_count}</td>
                    <td className="py-2 text-right">{q.avg_score_pct != null ? `${Math.round(q.avg_score_pct)}%` : '—'}</td>
                    <td className="py-2 text-right">
                      {q.attempt_count > 0 ? `${Math.round(q.passed_count / q.attempt_count * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
