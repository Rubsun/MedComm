import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { progressApi } from '@/api/progress';
import { achievementsApi } from '@/api/achievements';
import type { AchievementWithStatus, MyProgress, StreakOut } from '@/types/api';
import {
  Avatar,
  Badge,
  Card,
  Empty,
  Icon,
  type IconName,
  Progress,
} from '@/components/medcomm';

export default function Profile() {
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<MyProgress | null>(null);
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [streak, setStreak] = useState<StreakOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [progRes, achRes, streakRes] = await Promise.all([
          progressApi.me(),
          achievementsApi.myList(),
          achievementsApi.myStreak(),
        ]);
        setProgress(progRes.data);
        setAchievements(achRes.data);
        setStreak(streakRes.data);
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    if (!progress) {
      return { lessons: 0, perfect: 0, practice: 0, avgQuiz: null as number | null };
    }
    const perfect = progress.quiz_results.filter(
      (q) => q.max_score > 0 && q.best_score === q.max_score
    ).length;
    const valid = progress.quiz_results.filter((q) => q.max_score > 0);
    const avg =
      valid.length === 0
        ? null
        : Math.round(
            valid.reduce((s, q) => s + (q.best_score / q.max_score) * 100, 0) / valid.length
          );
    return {
      lessons: progress.completed_lessons.length,
      perfect,
      practice: progress.practice_results.length,
      avgQuiz: avg,
    };
  }, [progress]);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  if (loading) {
    return <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка профиля…</div>;
  }

  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* HEADER */}
      <Card padding={24} style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <Avatar name={fullName} size={84} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontSize: 24, marginBottom: 2 }}>{fullName || 'Пользователь'}</h1>
            <div style={{ fontSize: 13.5, color: 'var(--ink-500)', marginBottom: 10 }}>
              {user?.email}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge tone={user?.role === 'admin' ? 'dark' : 'teal'} size="md" icon="user">
                {user?.role === 'admin' ? 'Администратор' : 'Студент'}
              </Badge>
              {streak && streak.current_streak > 0 && (
                <Badge tone="warning" size="md" icon="flame">
                  Стрик {streak.current_streak}{' '}
                  {pluralize(streak.current_streak, 'день', 'дня', 'дней')}
                </Badge>
              )}
              {streak && streak.longest_streak > 0 && (
                <Badge tone="neutral" size="md">
                  Рекорд: {streak.longest_streak}{' '}
                  {pluralize(streak.longest_streak, 'день', 'дня', 'дней')}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              void logout();
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 9,
              border: '1px solid var(--line-strong)',
              background: 'var(--surface)',
              color: 'var(--ink-700)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Выйти
          </button>
        </div>
      </Card>

      {/* STATS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 22,
        }}
      >
        <ProfileStat
          icon="checkCircle"
          color="var(--teal-600)"
          label="Уроков пройдено"
          value={String(stats.lessons)}
        />
        <ProfileStat
          icon="target"
          color="var(--info)"
          label="Средний балл"
          value={stats.avgQuiz != null ? String(stats.avgQuiz) : '—'}
          sub="по тестам"
        />
        <ProfileStat
          icon="msg"
          color="var(--indigo)"
          label="Практик"
          value={String(stats.practice)}
        />
        <ProfileStat
          icon="trophy"
          color="#7C3AED"
          label="Достижений"
          value={`${unlocked.length} / ${achievements.length}`}
        />
      </div>

      {/* ACHIEVEMENTS */}
      <Card padding={0}>
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--line-soft)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16 }}>Достижения</h3>
            <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginTop: 2 }}>
              {unlocked.length} из {achievements.length} разблокировано
            </div>
          </div>
        </div>
        {achievements.length === 0 ? (
          <Empty
            icon="trophy"
            title="Достижений ещё нет"
            description="Администратор создаст набор достижений — они появятся здесь."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
              padding: 18,
            }}
          >
            {/* Сначала разблокированные, потом ближайшие к получению */}
            {[...unlocked, ...locked.sort(sortByProgress)].map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────

function ProfileStat({
  icon,
  color,
  label,
  value,
  sub,
}: {
  icon: IconName;
  color: string;
  label: string;
  value: string;
  sub?: string;
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
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
            {sub && <span style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{sub}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AchievementCard({ achievement: a }: { achievement: AchievementWithStatus }) {
  const pct = a.threshold === 0 ? 0 : Math.min(100, Math.round((a.current_value / a.threshold) * 100));
  return (
    <div
      style={{
        position: 'relative',
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${a.unlocked ? 'var(--teal-200)' : 'var(--line)'}`,
        background: a.unlocked ? 'linear-gradient(135deg, var(--teal-50), white)' : 'var(--surface)',
        opacity: a.unlocked ? 1 : 0.95,
        transition: 'all .14s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: a.unlocked ? a.color || 'var(--teal-100)' : 'var(--bg-soft)',
            border: `1px solid ${a.unlocked ? 'transparent' : 'var(--line)'}`,
            color: a.unlocked ? 'white' : 'var(--ink-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            filter: a.unlocked ? 'none' : 'grayscale(0.6)',
          }}
        >
          {/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(a.icon)
            ? a.icon
            : <Icon name={(isIconName(a.icon) ? a.icon : 'trophy')} size={22} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-900)' }}>
              {a.title}
            </span>
            {a.unlocked && <Icon name="checkCircle" size={14} color="var(--success)" />}
          </div>
          <Badge tone={tierTone(a.tier)} size="sm">
            {tierLabel(a.tier)}
            {a.xp > 0 ? ` · +${a.xp} XP` : ''}
          </Badge>
        </div>
      </div>
      {a.description && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--ink-600)',
            lineHeight: 1.45,
            margin: '0 0 10px',
          }}
        >
          {a.description}
        </p>
      )}
      {!a.unlocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
          <Progress value={pct} height={4} />
          <span className="num" style={{ color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
            {a.current_value}/{a.threshold}
          </span>
        </div>
      )}
      {a.unlocked && a.unlocked_at && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
          Получено {formatDate(a.unlocked_at)}
        </div>
      )}
    </div>
  );
}

function sortByProgress(a: AchievementWithStatus, b: AchievementWithStatus) {
  const pa = a.threshold === 0 ? 0 : a.current_value / a.threshold;
  const pb = b.threshold === 0 ? 0 : b.current_value / b.threshold;
  return pb - pa;
}

function tierTone(tier: string): 'success' | 'info' | 'warning' | 'neutral' {
  if (tier === 'gold') return 'warning';
  if (tier === 'silver') return 'info';
  if (tier === 'bronze') return 'success';
  return 'neutral';
}

function tierLabel(tier: string): string {
  if (tier === 'gold') return 'Золото';
  if (tier === 'silver') return 'Серебро';
  if (tier === 'bronze') return 'Бронза';
  return tier;
}

function pluralize(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return s;
  }
}

const KNOWN_ICONS = new Set([
  'home','book','map','user','award','bell','settings','search','plus','check','checkCircle',
  'chevronRight','chevronLeft','chevronDown','chevronUp','arrowRight','arrowLeft','play','pause',
  'lock','unlock','flame','clock','chart','bar','users','grad','trash','edit','eye','eyeOff','file',
  'image','video','list','grid','download','upload','moreH','moreV','drag','sparkles','target',
  'heart','msg','cmd','logout','layers','folder','bookmark','note','trophy','cert','info','warning',
  'x','filter','sort','calendar','mail','refresh','star','arrowUp','arrowDown','smile','light',
]);

function isIconName(s: string): s is IconName {
  return KNOWN_ICONS.has(s);
}
