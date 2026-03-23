import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  BookOpen, 
  Home, 
  User, 
  Award, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  PlayCircle,
  Stethoscope,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { courseData } from '@/data/courseData';

// ============================================
// SIDEBAR NAVIGATION
// ============================================
function CourseSidebar() {
  const { 
    sidebarOpen, 
    toggleSidebar, 
    currentModule, 
    currentLesson,
    progress,
    setCurrentModule,
    setCurrentLesson
  } = useStore();
  
  const [expandedModules, setExpandedModules] = useState<string[]>(
    courseData.modules.map(m => m.id)
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getLessonStatus = (lessonId: string) => {
    if (!progress) return 'locked';
    if (progress.completedLessons.includes(lessonId)) return 'completed';
    if (currentLesson?.id === lessonId) return 'current';
    return 'available';
  };

  const getModuleProgress = (module: typeof courseData.modules[0]) => {
    if (!progress) return 0;
    const completed = module.lessons.filter(
      l => progress.completedLessons.includes(l.id)
    ).length;
    return Math.round((completed / module.lessons.length) * 100);
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300",
      sidebarOpen ? "w-80" : "w-0 overflow-hidden"
    )}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-1.5 rounded-lg">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 text-sm">MedComm</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Course Info */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">
          {courseData.title}
        </h3>
        <div className="mt-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Прогресс курса</span>
            <span>{useStore.getState().getCourseProgress()}%</span>
          </div>
          <Progress value={useStore.getState().getCourseProgress()} className="h-2" />
        </div>
      </div>

      {/* Modules List */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-2">
          {courseData.modules.map((module) => {
            const isExpanded = expandedModules.includes(module.id);
            const moduleProgress = getModuleProgress(module);
            
            return (
              <div key={module.id} className="mb-2">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                    currentModule?.id === module.id 
                      ? "bg-blue-50 border border-blue-200" 
                      : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 text-sm">
                        {module.title}
                      </span>
                      {module.isLocked && (
                        <span className="text-slate-400">
                          <Circle className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={moduleProgress} className="h-1 w-16" />
                      <span className="text-xs text-slate-500">{moduleProgress}%</span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Lessons */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {module.lessons.map((lesson) => {
                      const status = getLessonStatus(lesson.id);
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setCurrentModule(module);
                            setCurrentLesson(lesson);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors",
                            status === 'current' 
                              ? "bg-blue-100 text-blue-700" 
                              : status === 'completed'
                              ? "text-slate-600 hover:bg-slate-50"
                              : "text-slate-400 hover:bg-slate-50"
                          )}
                        >
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : status === 'current' ? (
                            <PlayCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                          {lesson.type === 'mixed' && (
                            <Badge variant="secondary" className="text-xs ml-auto">
                              Практика
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================
// TOP NAVIGATION
// ============================================
function TopNav() {
  const { user, logout, notifications, toggleSidebar } = useStore();
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Главная';
    if (path === '/lesson') return 'Урок';
    if (path === '/practice') return 'Практика';
    if (path === '/profile') return 'Профиль';
    if (path === '/achievements') return 'Достижения';
    return 'MedComm';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-slate-800">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Уведомления</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                Нет новых уведомлений
              </div>
            ) : (
              notifications.slice(0, 5).map(n => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start p-3">
                  <span className="font-medium text-sm">{n.title}</span>
                  <span className="text-xs text-slate-500">{n.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm">{user?.firstName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Профиль
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/achievements" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Достижения
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Настройки
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ============================================
// MOBILE NAVIGATION
// ============================================
function MobileNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex justify-around p-2">
        <Link to="/" className="flex flex-col items-center p-2 text-slate-600">
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Главная</span>
        </Link>
        <Link to="/lesson" className="flex flex-col items-center p-2 text-slate-600">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs mt-1">Учеба</span>
        </Link>
        <Link to="/achievements" className="flex flex-col items-center p-2 text-slate-600">
          <Award className="w-5 h-5" />
          <span className="text-xs mt-1">Награды</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center p-2 text-slate-600">
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Профиль</span>
        </Link>
      </div>
    </div>
  );
}

// ============================================
// MAIN LAYOUT
// ============================================
export default function AppLayout() {
  const { sidebarOpen } = useStore();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <CourseSidebar />

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarOpen ? "lg:ml-80" : ""
      )}>
        <TopNav />
        
        <main className="p-4 pb-24 lg:pb-4">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
