import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  BookOpen, 
  Target, 
  TrendingUp,
  Star,
  Zap
} from 'lucide-react';
import { achievements } from '@/data/courseData';

export default function Profile() {
  const { user, progress } = useStore();
  
  const completedLessons = progress?.completedLessons.length || 0;
  const completedExercises = progress?.completedExercises.length || 0;
  const quizResults = progress?.quizResults || [];
  
  const averageScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((acc, r) => acc + r.score, 0) / quizResults.length)
    : 0;

  const passedQuizzes = quizResults.filter(r => r.passed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-2xl">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-slate-800">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-slate-500">{user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                <Badge variant="outline">{user?.group}</Badge>
                <Badge variant="outline">{user?.yearOfStudy} курс</Badge>
                <Badge className="bg-blue-100 text-blue-700">Студент</Badge>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {useStore.getState().getCourseProgress()}%
              </div>
              <div className="text-sm text-slate-500">Прогресс курса</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{completedLessons}</div>
            <div className="text-sm text-slate-500">Уроков пройдено</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{completedExercises}</div>
            <div className="text-sm text-slate-500">Упражнений</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{averageScore}%</div>
            <div className="text-sm text-slate-500">Средний балл</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{passedQuizzes}</div>
            <div className="text-sm text-slate-500">Тестов сдано</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Достижения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const isUnlocked = (progress?.completedLessons?.length || 0) >= 1 && 
                achievement.id === 'first-steps';
              
              return (
                <div 
                  key={achievement.id} 
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    isUnlocked 
                      ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' 
                      : 'bg-slate-50 border border-slate-200 opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isUnlocked ? 'bg-amber-100' : 'bg-slate-200'
                  }`}>
                    <Award className={`w-6 h-6 ${isUnlocked ? 'text-amber-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{achievement.title}</h4>
                    <p className="text-sm text-slate-500">{achievement.description}</p>
                  </div>
                  {isUnlocked && (
                    <Badge className="ml-auto bg-amber-100 text-amber-700">Получено</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quiz Results */}
      {quizResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Результаты тестов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quizResults.map((result, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    result.passed ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {result.passed ? (
                      <Award className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">Тест #{index + 1}</div>
                    <div className="text-sm text-slate-500">
                      Попыток: {result.attempts}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      result.passed ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.score}%
                    </div>
                    <div className="text-xs text-slate-500">
                      {result.passed ? 'Сдано' : 'Не сдано'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
