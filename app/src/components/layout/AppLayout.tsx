import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/store/useStore';
import { programsApi } from '@/api/programs';
import { coursesApi } from '@/api/courses';
import { modulesApi } from '@/api/modules';
import { lessonsApi } from '@/api/lessons';
import type { ProgramOut, CourseOut, ModuleOut, LessonOut } from '@/types/api';
import { ChevronDown, ChevronRight, Lock, Stethoscope, LogOut, LayoutDashboard, User } from 'lucide-react';

interface NavModule extends ModuleOut { lessons: LessonOut[] }
interface NavCourse extends CourseOut { modules: NavModule[] }
interface NavProgram extends ProgramOut { courses: NavCourse[] }

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { sidebarOpen } = useStore();
  const navigate = useNavigate();
  const [tree, setTree] = useState<NavProgram[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const programs = (await programsApi.list()).data;
      const fullTree: NavProgram[] = await Promise.all(programs.map(async p => {
        const courses = (await coursesApi.list(p.id)).data;
        const fullCourses: NavCourse[] = await Promise.all(courses.map(async c => {
          const modules = (await modulesApi.list(c.id)).data;
          const fullModules: NavModule[] = await Promise.all(modules.map(async m => {
            const lessons = (await lessonsApi.list(m.id)).data;
            return { ...m, lessons };
          }));
          return { ...c, modules: fullModules };
        }));
        return { ...p, courses: fullCourses };
      }));
      setTree(fullTree);
    })();
  }, []);

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-72 bg-white border-r flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2 rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">MedComm</div>
              <div className="text-xs text-slate-500">{user?.first_name} {user?.last_name}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <NavLink to="/" end className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`
            }>
              <LayoutDashboard className="w-4 h-4" />Главная
            </NavLink>

            {tree.map(program => (
              <div key={program.id}>
                <button
                  onClick={() => toggle(`p-${program.id}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  {expanded[`p-${program.id}`] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {program.title}
                </button>
                {expanded[`p-${program.id}`] && program.courses.map(course => (
                  <div key={course.id} className="ml-4">
                    <button
                      onClick={() => toggle(`c-${course.id}`)}
                      className="w-full flex items-center gap-2 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                    >
                      {expanded[`c-${course.id}`] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {course.title}
                    </button>
                    {expanded[`c-${course.id}`] && course.modules.map(module => (
                      <div key={module.id} className="ml-4">
                        <div className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          {module.is_locked && <Lock className="w-3 h-3" />}
                          {module.title}
                        </div>
                        {!module.is_locked && module.lessons.map(lesson => (
                          <NavLink
                            key={lesson.id}
                            to={`/lesson/${lesson.id}`}
                            className={({ isActive }) =>
                              `block ml-3 px-3 py-1 text-sm rounded truncate ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`
                            }
                          >
                            {lesson.title}
                          </NavLink>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="p-3 border-t space-y-1">
            <NavLink to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              <User className="w-4 h-4" />Профиль
            </NavLink>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              <LogOut className="w-4 h-4" />Выйти
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
