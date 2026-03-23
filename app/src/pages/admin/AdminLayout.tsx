import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, BarChart2, LogOut, Stethoscope } from 'lucide-react';

const navItems = [
  { to: '/admin/programs', icon: BookOpen, label: 'Программы' },
  { to: '/admin/students', icon: Users, label: 'Студенты' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Аналитика' },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-60 bg-white border-r flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2 rounded-lg">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">MedComm</div>
            <div className="text-xs text-slate-500">Администратор</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="text-xs text-slate-500 mb-2">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Выйти
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
