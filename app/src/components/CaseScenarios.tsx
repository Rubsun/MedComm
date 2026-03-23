import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  User, 
  Stethoscope, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface CaseScenario {
  id: string;
  title: string;
  patient: {
    name: string;
    age: string;
    temperament: string;
    complaint: string;
    behavior: string;
  };
  challenge: string;
  wrongApproach: string;
  correctApproach: string;
  keyPhrases: string[];
  outcome: string;
  tips: string[];
}

const caseScenarios: CaseScenario[] = [
  {
    id: 'case-1',
    title: 'Тревожная пациентка',
    patient: {
      name: 'Мария, 34 года',
      age: 'Взрослые 18-65',
      temperament: 'Меланхолик (тревожный)',
      complaint: 'Боли в животе, множество вопросов',
      behavior: 'Плачет, перебивает, боится диагноза'
    },
    challenge: 'Пациентка в высокой тревоге, не дает говорить, постоянно перебивает',
    wrongApproach: '«Успокойтесь, не перебивайте, я же говорю!» — усилит тревогу',
    correctApproach: 'Patient-centered: эмпатия, признание чувств, структурирование информации',
    keyPhrases: [
      '«Я вижу, что вы очень переживаете, это нормально»',
      '«Давайте разберем по шагам, чтобы вы чувствовали контроль»',
      '«Задавайте вопросы, я отвечу на каждый»',
      '«Вот что мы знаем точно...»'
    ],
    outcome: 'Пациентка успокоилась, задала вопросы, пошла на обследование',
    tips: [
      'Начните с признания эмоций',
      'Дайте структуру: "Сначала я расскажу..., потом вы спросите..."',
      'Не торопите с диагнозом',
      'Предложите письменную информацию'
    ]
  },
  {
    id: 'case-2',
    title: 'Агрессивный пациент',
    patient: {
      name: 'Александр, 45 лет',
      age: 'Взрослые 18-65',
      temperament: 'Холерик (доминирующий)',
      complaint: 'Головные боли, требует немедленного решения',
      behavior: 'Громкий голос, требовательный, критикует систему'
    },
    challenge: 'Пациент доминирует, давит, не слушает, требует немедленных действий',
    wrongApproach: '«Вы не врач, не учите меня работать» — вызовет конфликт',
    correctApproach: 'Doctor-centered: четкие инструкции, уверенность, структура, контроль',
    keyPhrases: [
      '«Я понимаю ваше беспокойство, вот план действий»',
      '«Сейчас мы сделаем: 1)... 2)... 3)...»',
      '«Контрольный осмотр через 3 дня»',
      '«Вот мои рекомендации, они основаны на опыте»'
    ],
    outcome: 'Пациент принял авторитет врача, выполнил назначения',
    tips: [
      'Сохраняйте уверенность и спокойствие',
      'Не вступайте в спор',
      'Давайте четкую структуру',
      'Установите временные рамки'
    ]
  },
  {
    id: 'case-3',
    title: 'Плачущий ребенок',
    patient: {
      name: 'Дима, 5 лет',
      age: 'Дети 3-12',
      temperament: 'Меланхолик (чувствительный)',
      complaint: 'Боль в горле, боится осмотра',
      behavior: 'Плачет, прячется за маму, отказывается открывать рот'
    },
    challenge: 'Ребенок в страхе, не дает себя осмотреть, мама нервничает',
    wrongApproach: '«Перестань плакать, ты же большой!» — усилит страх',
    correctApproach: 'Patient-centered: игровой подход, вовлечение мамы, эмпатия',
    keyPhrases: [
      '«Я вижу, тебе страшно, это нормально»',
      '«Давай посмотрим, как здоровается твоя игрушка»',
      '«Мама будет рядом и держать тебя за руку»',
      '«Ты такой храбрый! Можешь открыть рот как крокодил?»'
    ],
    outcome: 'Ребенок успокоился, разрешил осмотр, получил похвалу',
    tips: [
      'Присядьте на уровень глаз ребенка',
      'Используйте игрушку как посредника',
      'Вовлеките маму активно',
      'Похвалите за малейшее сотрудничество'
    ]
  },
  {
    id: 'case-4',
    title: 'Замкнутый подросток',
    patient: {
      name: 'Катя, 15 лет',
      age: 'Подростки 13-17',
      temperament: 'Флегматик (блантинг)',
      complaint: 'Проблемы с кожей, мама настаивает на приеме',
      behavior: 'Молчит, отвечает односложно, смотрит в телефон'
    },
    challenge: 'Подросток не хочет общаться, мама отвечает за нее, нужна конфиденциальность',
    wrongApproach: '«Ну чего молчишь, тебе лечиться или нет?!» — закроется окончательно',
    correctApproach: 'Patient-centered: конфиденциальность, уважение автономии, копинг-стиль',
    keyPhrases: [
      '«Могу я поговорить с Катей наедине?»',
      '«Между нами то, что ты скажешь»',
      '«Хочешь, расскажу кратко или подробно?»',
      '«Твое мнение важно, это твое тело»'
    ],
    outcome: 'Подросток раскрылась, получила рекомендации, доверяет врачу',
    tips: [
      'Попросите родителя выйти',
      'Объясните конфиденциальность',
      'Учитывайте копинг-стиль (блантинг = меньше деталей)',
      'Уважайте границы'
    ]
  },
  {
    id: 'case-5',
    title: 'Пожилой пациент',
    patient: {
      name: 'Иван Петрович, 72 года',
      age: 'Пожилые 65+',
      temperament: 'Флегматик (спокойный)',
      complaint: 'Давление, много вопросов о лекарствах',
      behavior: 'Вежливый, но путается в информации, просит повторить'
    },
    challenge: 'Пациент не запоминает информацию, боится принимать новые лекарства',
    wrongApproach: '«Я же только что объяснил!» — дискредитирует пациента',
    correctApproach: 'Patient-centered: медленно, повторение, письменные инструкции, вовлечение семьи',
    keyPhrases: [
      '«Уважаемый Иван Петрович, повторю еще раз»',
      '«Вот запись с названиями и дозировками»',
      '«Возьмите с собой внучку, она поможет разобраться»',
      '«Давайте вместе повторим, что и когда принимать»'
    ],
    outcome: 'Пациент получил письменные рекомендации, внучка помогает с лекарствами',
    tips: [
      'Обращайтесь формально и уважительно',
      'Повторяйте ключевую информацию 2-3 раза',
      'Давайте письменные инструкции крупным шрифтом',
      'Вовлекайте членов семьи'
    ]
  },
  {
    id: 'case-6',
    title: 'Активный сангвиник',
    patient: {
      name: 'Ольга, 28 лет',
      age: 'Взрослые 18-65',
      temperament: 'Сангвиник (энергичный)',
      complaint: 'Хочет похудеть, много идей и вопросов',
      behavior: 'Болтливая, перескакивает с темы на тему, много обещает'
    },
    challenge: 'Пациентка отвлекается, не дает сосредоточиться, может не выполнить рекомендации',
    wrongApproach: '«Перестаньте болтать и слушайте!» — обидит и оттолкнет',
    correctApproach: 'Patient-centered: поддержать энтузиазм, дать конкретику, структурировать',
    keyPhrases: [
      '«Какая вы активная, это здорово!»',
      '«Давайте сфокусируемся на трех главных шагах»',
      '«Запишите, пожалуйста, чтобы не забыть»',
      '«Через неделю расскажете, что получилось!»'
    ],
    outcome: 'Пациентка получила конкретный план, мотивирована на выполнение',
    tips: [
      'Поддержите энтузиазм и энергию',
      'Структурируйте разговор',
      'Давайте конкретные, измеримые цели',
      'Назначьте контрольный срок'
    ]
  }
];

export default function CaseScenarios() {
  const [selectedCase, setSelectedCase] = useState<CaseScenario | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCaseClick = (caseData: CaseScenario) => {
    setSelectedCase(caseData);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {caseScenarios.map((caseData) => (
          <Card 
            key={caseData.id} 
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-blue-300"
            onClick={() => handleCaseClick(caseData)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800">
                  {caseData.title}
                </CardTitle>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{caseData.patient.name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {caseData.patient.temperament}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {caseData.patient.age}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">
                {caseData.challenge}
              </p>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                <span>Разбор кейса</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCase && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Stethoscope className="w-6 h-6 text-blue-600" />
                  </div>
                  {selectedCase.title}
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Разбор сложной ситуации в коммуникации с пациентом
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Пациент */}
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Описание пациента
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm text-slate-500">Возраст:</span>
                      <p className="text-sm font-medium text-slate-700">{selectedCase.patient.age}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500">Темперамент:</span>
                      <p className="text-sm font-medium text-slate-700">{selectedCase.patient.temperament}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-slate-500">Жалоба:</span>
                      <p className="text-sm font-medium text-slate-700">{selectedCase.patient.complaint}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-slate-500">Поведение:</span>
                      <p className="text-sm font-medium text-slate-700">{selectedCase.patient.behavior}</p>
                    </div>
                  </div>
                </div>

                {/* Проблема */}
                <div className="bg-amber-50 p-4 rounded-xl border-l-4 border-amber-400">
                  <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Сложность ситуации
                  </h4>
                  <p className="text-slate-700">{selectedCase.challenge}</p>
                </div>

                {/* Неправильный подход */}
                <div className="bg-red-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-red-700 mb-2">❌ Неправильный подход:</h4>
                  <p className="text-slate-700 italic">{selectedCase.wrongApproach}</p>
                </div>

                {/* Правильный подход */}
                <div className="bg-green-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Правильный подход:
                  </h4>
                  <p className="text-slate-700">{selectedCase.correctApproach}</p>
                </div>

                {/* Ключевые фразы */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Ключевые фразы:
                  </h4>
                  <div className="space-y-2">
                    {selectedCase.keyPhrases.map((phrase, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        <p className="text-slate-700 italic">"{phrase}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Результат */}
                <div className="bg-green-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Результат:</h4>
                  <p className="text-slate-700">{selectedCase.outcome}</p>
                </div>

                {/* Советы */}
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    Практические советы:
                  </h4>
                  <ul className="space-y-2">
                    {selectedCase.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="text-blue-500 font-bold">{idx + 1}.</span>
                        <span className="text-slate-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
