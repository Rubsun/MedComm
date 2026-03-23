import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Flame, 
  Sun, 
  Moon, 
  Cloud, 
  Baby, 
  UserCircle, 
  User, 
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface StrategyCell {
  temperament: string;
  age: string;
  style: string;
  approach: string;
  phrases: string[];
  warnings: string[];
}

const matrixData: StrategyCell[] = [
  // Холерик
  {
    temperament: 'Холерик',
    age: 'Дети 3-12',
    style: 'Doctor-centered',
    approach: 'Четкие правила, быстрые действия, похвала за послушание',
    phrases: ['«Быстро открывай рот»', '«Молодец, что слушаешься»', '«Сейчас, сразу, быстро»'],
    warnings: ['Не спорить', 'Не тормозить процесс', 'Давать четкие инструкции']
  },
  {
    temperament: 'Холерик',
    age: 'Подростки 13-17',
    style: 'Doctor-centered',
    approach: 'Уважение + четкие рамки, дать выбор из опций',
    phrases: ['«Ты можешь выбрать: А или Б»', '«Мое решение основано на опыте»', '«Объясняю, почему это важно»'],
    warnings: ['Не давить авторитетом', 'Объяснять причины', 'Уважать мнение']
  },
  {
    temperament: 'Холерик',
    age: 'Взрослые 18-65',
    style: 'Doctor-centered',
    approach: 'Прямые рекомендации, структура, минимум эмоций',
    phrases: ['«Вам необходимо...»', '«План лечения следующий...»', '«Контроль через неделю»'],
    warnings: ['Не уходить в эмоции', 'Быть конкретным', 'Сохранять уверенность']
  },
  {
    temperament: 'Холерик',
    age: 'Пожилые 65+',
    style: 'Doctor-centered',
    approach: 'Уважительно-авторитетный, четкие инструкции',
    phrases: ['«Уважаемый Иван Петрович, назначаю...»', '«Вот письменные рекомендации»', '«Повторю главное»'],
    warnings: ['Не спешить', 'Повторять', 'Дать письменное']
  },
  // Сангвиник
  {
    temperament: 'Сангвиник',
    age: 'Дети 3-12',
    style: 'Patient-centered',
    approach: 'Игровой подход, яркие эмоции, похвала',
    phrases: ['«Ух ты, какой ты молодец!»', '«Давай поиграем в доктора!»', '«Ты такой сильный!»'],
    warnings: ['Поддерживать энтузиазм', 'Не гасить эмоции', 'Использовать игру']
  },
  {
    temperament: 'Сангвиник',
    age: 'Подростки 13-17',
    style: 'Patient-centered',
    approach: 'Эмоциональная поддержка, обсуждение, дружелюбие',
    phrases: ['«Классно, что ты заботишься о здоровье!»', '«Давай вместе разберемся»', '«Ты молодец!»'],
    warnings: ['Поддерживать контакт', 'Не критиковать', 'Поощрять активность']
  },
  {
    temperament: 'Сангвиник',
    age: 'Взрослые 18-65',
    style: 'Patient-centered',
    approach: 'Дружелюбие, эмоциональная поддержка, вовлечение',
    phrases: ['«Отлично, что вы пришли!»', '«Давайте обсудим варианты»', '«Вы справитесь!»'],
    warnings: ['Поддерживать позитив', 'Не игнорировать проблему', 'Баланс эмоций']
  },
  {
    temperament: 'Сангвиник',
    age: 'Пожилые 65+',
    style: 'Patient-centered',
    approach: 'Теплое общение, внимание, похвала за активность',
    phrases: ['«Какой вы активный! Восхищаюсь!»', '«Расскажите, чем занимаетесь»', '«Вы молодец!»'],
    warnings: ['Не перегружать информацией', 'Дать выговориться', 'Поддерживать контакт']
  },
  // Флегматик
  {
    temperament: 'Флегматик',
    age: 'Дети 3-12',
    style: 'Patient-centered',
    approach: 'Спокойно, без спешки, подробно объяснять',
    phrases: ['«Ничего страшного, мы не спешим»', '«Давай медленно»', '«Ты молодец, что спокойный»'],
    warnings: ['Не торопить', 'Дать время', 'Спокойный тон']
  },
  {
    temperament: 'Флегматик',
    age: 'Подростки 13-17',
    style: 'Patient-centered',
    approach: 'Спокойно, терпеливо, без давления',
    phrases: ['«Нет спешки, подумаем»', '«Возьми время»', '«Я подожду»'],
    warnings: ['Не давить', 'Дать время на ответ', 'Не перегружать']
  },
  {
    temperament: 'Флегматик',
    age: 'Взрослые 18-65',
    style: 'Patient-centered',
    approach: 'Спокойный тон, подробности, время на размышление',
    phrases: ['«Давайте разберем по шагам»', '«Возьмите время подумать»', '«Нет спешки»'],
    warnings: ['Не торопить', 'Объяснять подробно', 'Дать паузы']
  },
  {
    temperament: 'Флегматик',
    age: 'Пожилые 65+',
    style: 'Patient-centered',
    approach: 'Очень спокойно, много времени, повторение',
    phrases: ['«Не спешим, у нас есть время»', '«Повторю еще раз»', '«Вот запись на память»'],
    warnings: ['Максимум времени', 'Много повторять', 'Письменное']
  },
  // Меланхолик
  {
    temperament: 'Меланхолик',
    age: 'Дети 3-12',
    style: 'Patient-centered',
    approach: 'Мягко, поддерживающе, с родителем',
    phrases: ['«Я понимаю, тебе страшно»', '«Мама рядом»', '«Ты храбрый»'],
    warnings: ['Не пугать', 'Поддержка родителя', 'Мягкий тон']
  },
  {
    temperament: 'Меланхолик',
    age: 'Подростки 13-17',
    style: 'Patient-centered',
    approach: 'Осторожно, эмпатия, конфиденциальность',
    phrases: ['«Я понимаю, это сложно»', '«Между нами»', '«Расскажи, что беспокоит»'],
    warnings: ['Конфиденциальность', 'Не давить', 'Эмпатия']
  },
  {
    temperament: 'Меланхолик',
    age: 'Взрослые 18-65',
    style: 'Patient-centered',
    approach: 'Эмпатия, поддержка, время, без давления',
    phrases: ['«Я понимаю ваше беспокойство»', '«Давайте обсудим вместе»', '«Нет спешки с решением»'],
    warnings: ['Признать чувства', 'Не торопить', 'Эмоциональная поддержка']
  },
  {
    temperament: 'Меланхолик',
    age: 'Пожилые 65+',
    style: 'Patient-centered',
    approach: 'Максимум эмпатии, внимание, поддержка',
    phrases: ['«Я рядом, не переживайте»', '«Все будет хорошо»', '«Давайте вместе разберемся»'],
    warnings: ['Много внимания', 'Поддержка', 'Не оставлять одного']
  },
];

const temperamentIcons: Record<string, React.ReactNode> = {
  'Холерик': <Flame className="w-5 h-5 text-red-500" />,
  'Сангвиник': <Sun className="w-5 h-5 text-amber-500" />,
  'Флегматик': <Cloud className="w-5 h-5 text-blue-400" />,
  'Меланхолик': <Moon className="w-5 h-5 text-indigo-400" />,
};

const ageIcons: Record<string, React.ReactNode> = {
  'Дети 3-12': <Baby className="w-4 h-4" />,
  'Подростки 13-17': <UserCircle className="w-4 h-4" />,
  'Взрослые 18-65': <User className="w-4 h-4" />,
  'Пожилые 65+': <Users className="w-4 h-4" />,
};

function StrategyCard({ data }: { data: StrategyCell }) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {temperamentIcons[data.temperament]}
            <span className="font-semibold text-slate-700">{data.temperament}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            {ageIcons[data.age]}
            <span className="text-sm">{data.age}</span>
          </div>
        </div>
        <Badge 
          variant={data.style === 'Doctor-centered' ? 'default' : 'secondary'}
          className={data.style === 'Doctor-centered' ? 'bg-red-500' : 'bg-blue-500'}
        >
          {data.style}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Подход:</h4>
          <p className="text-sm text-slate-700">{data.approach}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Примеры фраз:
          </h4>
          <ul className="space-y-1">
            {data.phrases.map((phrase, idx) => (
              <li key={idx} className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded">
                "{phrase}"
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Важно:
          </h4>
          <ul className="space-y-1">
            {data.warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-amber-500">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StrategyMatrix() {
  const temperaments = ['Холерик', 'Сангвиник', 'Флегматик', 'Меланхолик'];
  const ages = ['Дети 3-12', 'Подростки 13-17', 'Взрослые 18-65', 'Пожилые 65+'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Матрица стратегий
            </span>
            <p className="text-sm text-slate-500 font-normal">
              Комбинации темперамента и возраста
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Холерик" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            {temperaments.map((temp) => (
              <TabsTrigger 
                key={temp} 
                value={temp}
                className="flex items-center gap-2"
              >
                {temperamentIcons[temp]}
                <span className="hidden sm:inline">{temp}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {temperaments.map((temp) => (
            <TabsContent key={temp} value={temp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ages.map((age) => {
                  const data = matrixData.find(d => d.temperament === temp && d.age === age);
                  return data ? (
                    <StrategyCard key={`${temp}-${age}`} data={data} />
                  ) : null;
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
