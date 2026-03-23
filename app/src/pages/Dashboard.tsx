import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen, 
  Award, 
  Clock, 
  Target,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Star,
  Zap
} from 'lucide-react';
import { courseData, achievements } from '@/data/courseData';

export default function Dashboard() {
  const { 
    user, 
    progress, 
    currentCourse, 
    currentModule, 
    currentLesson,
    setCurrentCourse,
    setCurrentModule,
    setCurrentLesson,
    getCourseProgress
  } = useStore();

  useEffect(() => {
    // Инициализация курса при первой загрузке
    if (!currentCourse) {
      setCurrentCourse(courseData);
      setCurrentModule(courseData.modules[0]);
      setCurrentLesson(courseData.modules[0].lessons[0]);
    }
  }, []);

  const courseProgress = getCourseProgress();
  
  // Находим текущий урок для продолжения
  const continueLesson = currentLesson || courseData.modules[0].lessons[0];
  const continueModule = currentModule || courseData.modules[0];

  // Статистика
  const completedLessons = progress?.completedLessons.length || 0;
  const completedExercises = progress?.completedExercises.length || 0;
  const totalLessons = courseData.totalLessons;

  // Последние достижения
  const unlockedAchievements = achievements.slice(0, 3);

  // Ближайшие модули
  const upcomingModules = courseData.modules.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Добро пожаловать, {user?.firstName || 'Студент'}! 👋
            </h1>
            <p className="text-blue-100">
              Продолжите обучение и улучшите свои навыки коммуникации с пациентами
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{courseProgress}%</div>
              <div className="text-sm text-blue-200">прогресса</div>
            </div>
            <div className="h-12 w-px bg-blue-400" />
            <div className="text-center">
              <div className="text-3xl font-bold">{completedLessons}/{totalLessons}</div>
              <div className="text-sm text-blue-200">уроков</div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Learning */}
      <Card className="border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
                Продолжить обучение
              </Badge>
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {continueLesson.title}
              </h2>
              <p className="text-slate-500 text-sm mb-2">
                {continueModule.title} • {continueLesson.duration} мин
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                {continueLesson.type === 'mixed' ? (
                  <>
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Теория + Практика</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span>Теоретический урок</span>
                  </>
                )}
              </div>
            </div>
            <Link to="/lesson">
              <Button size="lg" className="gap-2">
                <PlayCircle className="w-5 h-5" />
                Продолжить
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedLessons}</div>
              <div className="text-sm text-slate-500">Уроков пройдено</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedExercises}</div>
              <div className="text-sm text-slate-500">Упражнений</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{courseData.duration}</div>
              <div className="text-sm text-slate-500">Общая длительность</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
              <div className="text-sm text-slate-500">Достижений</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Course Modules */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Содержание курса
          </h2>
          
          {upcomingModules.map((module, index) => {
            const moduleProgress = useStore.getState().getModuleProgress(module.id);
            const isCompleted = moduleProgress === 100;
            
            return (
              <Card key={module.id} className={isCompleted ? 'border-green-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isCompleted ? "bg-green-100" : "bg-blue-100"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <span className="font-bold text-blue-600">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{module.title}</h3>
                      <p className="text-sm text-slate-500 mb-2">{module.description}</p>
                      <div className="flex items-center gap-4">
                        <Progress value={moduleProgress} className="h-2 flex-1" />
                        <span className="text-sm text-slate-500">{moduleProgress}%</span>
                      </div>
                    </div>
                    <Link to="/lesson">
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Link to="/lesson">
            <Button variant="outline" className="w-full">
              Показать все модули
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Достижения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unlockedAchievements.map(achievement => (
                <div key={achievement.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{achievement.title}</div>
                    <div className="text-xs text-slate-500">{achievement.description}</div>
                  </div>
                </div>
              ))}
              <Link to="/achievements">
                <Button variant="ghost" className="w-full text-sm">
                  Все достижения
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">О курсе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={courseData.instructor.avatar} />
                  <AvatarFallback>{courseData.instructor.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{courseData.instructor.name}</div>
                  <div className="text-xs text-slate-500">{courseData.instructor.title}</div>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                {courseData.shortDescription}
              </div>
              <div className="flex flex-wrap gap-2">
                {courseData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper
import { cn } from '@/lib/utils';
