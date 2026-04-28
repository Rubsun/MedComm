import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsApi } from '@/api/students';
import type { StudentOut } from '@/types/api';
import { Avatar, Badge, Button, Card, Empty, Icon } from '@/components/medcomm';

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentOut[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (q?: string) => {
    setLoading(true);
    try {
      const res = await studentsApi.list(q);
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSearch = () => void load(search || undefined);

  const handleDeactivate = async (id: number) => {
    try {
      await studentsApi.deactivate(id);
      void load(search || undefined);
    } catch (err) {
      console.error('Failed to toggle student', err);
    }
  };

  const activeCount = students.filter((s) => s.is_active).length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 24 }}>Студенты</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-500)', marginTop: 4 }}>
          {students.length} {pluralize(students.length, 'студент', 'студента', 'студентов')} ·{' '}
          {activeCount} активных
        </p>
      </div>

      {/* Search */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 18,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: 1,
            maxWidth: 420,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            background: 'var(--surface)',
            border: '1px solid var(--line-strong)',
            borderRadius: 9,
            height: 38,
          }}
        >
          <Icon name="search" size={15} color="var(--ink-500)" />
          <input
            placeholder="Поиск по email, имени или фамилии"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: 'var(--ink-900)',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleSearch}>
          Найти
        </Button>
      </div>

      <Card padding={0}>
        {loading ? (
          <div style={{ padding: 24, fontSize: 13, color: 'var(--ink-500)' }}>Загрузка…</div>
        ) : students.length === 0 ? (
          <Empty
            icon="users"
            title="Студенты не найдены"
            description={search ? 'Попробуйте другой запрос.' : 'Студенты появятся здесь, как только зарегистрируются.'}
          />
        ) : (
          students.map((s) => (
            <div
              key={s.id}
              style={{
                padding: '14px 22px',
                borderTop: '1px solid var(--line-soft)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <Avatar name={`${s.first_name} ${s.last_name}`} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: 'var(--ink-900)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.first_name} {s.last_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{s.email}</div>
              </div>
              {s.is_active ? (
                <Badge tone="success" size="sm" dot>
                  Активен
                </Badge>
              ) : (
                <Badge tone="neutral" size="sm">
                  Деактивирован
                </Badge>
              )}
              <Button
                variant={s.is_active ? 'danger' : 'secondary'}
                size="sm"
                icon={s.is_active ? 'lock' : 'unlock'}
                onClick={() => void handleDeactivate(s.id)}
              >
                {s.is_active ? 'Деактивировать' : 'Активировать'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconRight="arrowRight"
                onClick={() => navigate(`/admin/students/${s.id}`)}
              >
                Прогресс
              </Button>
            </div>
          ))
        )}
      </Card>
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
