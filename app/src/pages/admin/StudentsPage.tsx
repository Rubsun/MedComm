import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentsApi } from '@/api/students';
import type { StudentOut } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ChevronRight, UserX, UserCheck } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentOut[]>([]);
  const [search, setSearch] = useState('');

  const load = (q?: string) => studentsApi.list(q).then(r => setStudents(r.data));

  useEffect(() => { load(); }, []);

  const handleSearch = () => load(search || undefined);

  const handleDeactivate = async (id: number) => {
    await studentsApi.deactivate(id);
    load(search || undefined);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Студенты</h1>

      <div className="flex gap-2">
        <Input
          placeholder="Поиск по email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleSearch}><Search className="w-4 h-4" /></Button>
      </div>

      <div className="space-y-2">
        {students.map(s => (
          <Card key={s.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-medium">{s.first_name} {s.last_name}</div>
                <div className="text-sm text-slate-500">{s.email}</div>
              </div>
              <Badge variant={s.is_active ? 'default' : 'secondary'}>
                {s.is_active ? 'Активен' : 'Деактивирован'}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                title={s.is_active ? 'Деактивировать' : 'Активировать'}
                onClick={() => handleDeactivate(s.id)}
              >
                {s.is_active ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
              </Button>
              <Link to={`/admin/students/${s.id}`}>
                <Button size="icon" variant="ghost"><ChevronRight className="w-4 h-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {students.length === 0 && <p className="text-slate-400 text-center py-8">Студенты не найдены</p>}
      </div>
    </div>
  );
}
