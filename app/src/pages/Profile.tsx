import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  BookOpen,
  Target,
  Star,
  Zap
} from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-slate-800">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-slate-500">{user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                <Badge className="bg-blue-100 text-blue-700">
                  {user?.role === 'admin' ? 'Администратор' : 'Студент'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">—</div>
            <div className="text-sm text-slate-500">Уроков пройдено</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">—</div>
            <div className="text-sm text-slate-500">Упражнений</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">—</div>
            <div className="text-sm text-slate-500">Средний балл</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">—</div>
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
          <p className="text-slate-500 text-sm">Достижения будут отображены здесь по мере прохождения курсов.</p>
        </CardContent>
      </Card>
    </div>
  );
}
