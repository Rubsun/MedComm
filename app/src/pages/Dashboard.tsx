import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { programsApi } from '@/api/programs';
import { coursesApi } from '@/api/courses';
import { modulesApi } from '@/api/modules';
import { lessonsApi } from '@/api/lessons';
import { progressApi } from '@/api/progress';
import type { ProgramOut, CourseOut } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramOut[]>([]);
  const [courses, setCourses] = useState<Record<number, CourseOut[]>>({});
  const [enrolling, setEnrolling] = useState<number | null>(null);

  useEffect(() => {
    programsApi.list().then(res => {
      setPrograms(res.data);
      res.data.forEach(p => {
        coursesApi.list(p.id).then(cr =>
          setCourses(prev => ({ ...prev, [p.id]: cr.data }))
        ).catch(err => console.error('Failed to load courses for program', p.id, err));
      });
    }).catch(err => console.error('Failed to load programs', err));
  }, []);

  const handleEnroll = async (courseId: number) => {
    setEnrolling(courseId);
    try {
      await progressApi.enroll(courseId);
      // After enrolling, navigate to first lesson of course
      const modules = (await modulesApi.list(courseId)).data;
      if (modules.length > 0) {
        const lessons = (await lessonsApi.list(modules[0].id)).data;
        if (lessons.length > 0) navigate(`/lesson/${lessons[0].id}`);
      }
    } catch (err) {
      console.error('Failed to enroll in course', courseId, err);
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Добро пожаловать, {user?.first_name}!
        </h1>
        <p className="text-slate-500">Выберите курс для обучения</p>
      </div>

      {programs.map(program => (
        <div key={program.id}>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">{program.title}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(courses[program.id] ?? []).map(course => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 mb-4">{course.description}</p>
                  <Button
                    className="w-full"
                    disabled={enrolling === course.id}
                    onClick={() => handleEnroll(course.id)}
                  >
                    {enrolling === course.id ? 'Запись...' : 'Записаться на курс'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
