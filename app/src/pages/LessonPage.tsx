import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Target,
  FileText,
  PlayCircle,
  Clock,
  Award,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TheoryBlock, Scenario, Resource } from '@/types';

// ============================================
// THEORY BLOCK COMPONENT
// ============================================
function TheoryContent({ blocks }: { blocks: TheoryBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <div key={block.id} className="space-y-3">
          <h3 className="text-xl font-bold text-slate-800">{block.title}</h3>
          
          {block.type === 'text' && (
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: block.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                     .replace(/\n/g, '<br/>') 
              }}
            />
          )}
          
          {block.type === 'video' && (
            <div className="space-y-2">
              <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-white/50" />
              </div>
              {block.caption && (
                <p className="text-sm text-slate-500 italic">{block.caption}</p>
              )}
            </div>
          )}
          
          {block.type === 'image' && (
            <div className="space-y-2">
              <div className="bg-slate-100 rounded-xl overflow-hidden">
                <img 
                  src={block.mediaUrl || '/placeholder-image.jpg'} 
                  alt={block.title}
                  className="w-full h-auto"
                />
              </div>
              {block.caption && (
                <p className="text-sm text-slate-500 italic">{block.caption}</p>
              )}
            </div>
          )}
          
          {block.type === 'infographic' && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Инфографика</span>
                </div>
                <p className="text-slate-700">{block.content}</p>
                {block.mediaUrl && (
                  <div className="mt-4 bg-white rounded-lg p-4">
                    <img 
                      src={block.mediaUrl} 
                      alt={block.title}
                      className="w-full h-auto rounded"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {block.type === 'mindmap' && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">Mind Map</span>
                </div>
                <p className="text-slate-700">{block.content}</p>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// PRACTICE SCENARIO COMPONENT
// ============================================
function PracticeScenario({ 
  scenario, 
  onComplete 
}: { 
  scenario: Scenario; 
  onComplete: (correct: boolean) => void;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setShowFeedback(true);
    const isCorrect = optionId === scenario.correctOptionId;
    onComplete(isCorrect);
  };

  return (
    <div className="space-y-6">
      {/* Patient Card */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {scenario.patient.name[0]}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800">{scenario.patient.name}, {scenario.patient.age} лет</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{scenario.patient.temperament}</Badge>
                <Badge variant="outline">{scenario.patient.gender === 'male' ? 'М' : 'Ж'}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p><span className="text-slate-500">Жалоба:</span> {scenario.patient.complaint}</p>
                <p><span className="text-slate-500">Поведение:</span> {scenario.patient.behavior}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Situation */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
        <h5 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5" />
          Ситуация
        </h5>
        <p className="text-slate-700">{scenario.situation}</p>
      </div>

      {/* Goal */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
        <h5 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
          <Target className="w-5 h-5" />
          Цель
        </h5>
        <p className="text-slate-700">{scenario.goal}</p>
      </div>

      {/* Hints */}
      {showHint && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5" />
            Подсказка
          </h5>
          <ul className="space-y-1">
            {scenario.hints.map((hint, i) => (
              <li key={i} className="text-sm text-slate-600">• {hint}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        <h5 className="font-semibold text-slate-700">Выберите ваш ответ:</h5>
        {scenario.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const showResult = showFeedback && isSelected;
          
          return (
            <button
              key={option.id}
              onClick={() => !showFeedback && handleSelect(option.id)}
              disabled={showFeedback}
              className={cn(
                "w-full p-4 rounded-xl text-left transition-all",
                !showFeedback && "hover:bg-slate-50 border-2 border-slate-200",
                showResult && option.isCorrect && "bg-green-50 border-2 border-green-400",
                showResult && !option.isCorrect && "bg-red-50 border-2 border-red-400",
                isSelected && !showResult && "border-2 border-blue-400 bg-blue-50"
              )}
            >
              <p className={cn(
                "text-slate-700",
                showResult && option.isCorrect && "text-green-800 font-medium",
                showResult && !option.isCorrect && "text-red-800"
              )}>
                {option.text}
              </p>
              
              {showResult && (
                <p className={cn(
                  "mt-2 text-sm",
                  option.isCorrect ? "text-green-600" : "text-red-600"
                )}>
                  {option.feedback}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Hint Button */}
      {!showFeedback && (
        <Button 
          variant="ghost" 
          onClick={() => setShowHint(true)}
          className="text-slate-500"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Показать подсказку
        </Button>
      )}

      {/* Explanation */}
      {showFeedback && (
        <div className="bg-slate-100 p-4 rounded-lg">
          <h5 className="font-semibold text-slate-700 mb-2">Объяснение:</h5>
          <p className="text-slate-600">{scenario.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// PRACTICE TAB
// ============================================
function PracticeTab() {
  const { currentLesson, currentScenarioIndex, setCurrentScenarioIndex, recordScenarioResult } = useStore();
  const [completed, setCompleted] = useState(false);

  if (!currentLesson?.content.practice) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600">В этом уроке нет практических заданий</h3>
      </div>
    );
  }

  const practice = currentLesson.content.practice;
  const scenarios = practice.scenarios;
  const currentScenario = scenarios[currentScenarioIndex];

  const handleScenarioComplete = (isCorrect: boolean) => {
    recordScenarioResult(currentScenario.id, isCorrect);
  };

  const handleNext = () => {
    if (currentScenarioIndex < scenarios.length - 1) {
      setCurrentScenarioIndex(currentScenarioIndex + 1);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Практика завершена!</h3>
        <p className="text-slate-600 mb-6">Вы отработали все сценарии этого урока</p>
        <Button onClick={() => setCompleted(false)}>Пройти еще раз</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-4">
        <Progress 
          value={((currentScenarioIndex + 1) / scenarios.length) * 100} 
          className="flex-1" 
        />
        <span className="text-sm text-slate-500">
          {currentScenarioIndex + 1} / {scenarios.length}
        </span>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-slate-700">{practice.instructions}</p>
      </div>

      {/* Scenario */}
      <PracticeScenario 
        scenario={currentScenario} 
        onComplete={handleScenarioComplete}
      />

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={handleNext}>
          {currentScenarioIndex < scenarios.length - 1 ? 'Следующий сценарий' : 'Завершить'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// RESOURCES TAB
// ============================================
function ResourcesTab({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600">Нет дополнительных материалов</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resources.map((resource) => (
        <Card key={resource.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800">{resource.title}</h4>
              <p className="text-sm text-slate-500">{resource.type.toUpperCase()} • {resource.size}</p>
            </div>
            <Button variant="outline" size="sm">
              Скачать
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// MAIN LESSON PAGE
// ============================================
export default function LessonPage() {
  const { 
    currentLesson, 
    currentModule,
    completeLesson,
    navigateToNextLesson,
    navigateToPreviousLesson,
    addNotification
  } = useStore();

  const [activeTab, setActiveTab] = useState('theory');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  if (!currentLesson || !currentModule) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Выберите урок для начала обучения</p>
      </div>
    );
  }

  const handleComplete = () => {
    completeLesson(currentLesson.id);
    addNotification({
      type: 'success',
      title: 'Урок завершен!',
      message: `Вы завершили "${currentLesson.title}"`,
      isRead: false
    });
    setShowCompleteDialog(true);
  };

  const handleNext = () => {
    const hasNext = navigateToNextLesson();
    if (!hasNext) {
      addNotification({
        type: 'success',
        title: 'Поздравляем!',
        message: 'Вы завершили модуль',
        isRead: false
      });
    }
    setShowCompleteDialog(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <span>{currentModule.title}</span>
          <ChevronRight className="w-4 h-4" />
          <span>Урок {currentLesson.order}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{currentLesson.title}</h1>
        <p className="text-slate-600 mt-1">{currentLesson.description}</p>
        <div className="flex items-center gap-4 mt-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {currentLesson.duration} мин
          </Badge>
          {currentLesson.type === 'mixed' && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
              <Target className="w-3 h-3 mr-1" />
              Есть практика
            </Badge>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="theory" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Теория
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Практика
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Материалы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="theory" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <TheoryContent blocks={currentLesson.content.theory} />
            </CardContent>
          </Card>
          
          {/* Complete Button */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={navigateToPreviousLesson}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Предыдущий урок
            </Button>
            <Button onClick={handleComplete} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Завершить урок
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="practice">
          <Card>
            <CardContent className="p-6">
              <PracticeTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardContent className="p-6">
              <ResourcesTab resources={currentLesson.resources} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              Урок завершен!
            </DialogTitle>
            <DialogDescription>
              Отличная работа! Вы успешно прошли "{currentLesson.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Остаться здесь
            </Button>
            <Button onClick={handleNext}>
              Следующий урок
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
