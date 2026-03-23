import { useState } from 'react';
import { ChevronDown, ChevronRight, User, Users, Stethoscope, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ExampleNode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  children?: ExampleNode[];
}

const examplesData: ExampleNode[] = [
  {
    id: 'general',
    title: 'Общий принцип',
    description: 'Адаптировать стиль коммуникации под индивидуальные особенности пациента',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-blue-500',
    children: [
      {
        id: 'temp-group',
        title: 'Уровень 1: Тип темперамента',
        description: 'Определить психотип пациента',
        icon: <User className="w-5 h-5" />,
        color: 'bg-purple-500',
        children: [
          {
            id: 'choleric-example',
            title: 'Холерик → Doctor-centered',
            description: 'Четкие инструкции, структура, минимум эмоций',
            icon: <Stethoscope className="w-5 h-5" />,
            color: 'bg-amber-500',
            children: [
              {
                id: 'choleric-action',
                title: 'Конкретные действия',
                description: '«Вам назначено: 1) Анализ крови 2) Рентген 3) Прием через неделю»',
                icon: <MessageCircle className="w-5 h-5" />,
                color: 'bg-green-500',
              }
            ]
          },
          {
            id: 'melancholic-example',
            title: 'Меланхолик → Patient-centered',
            description: 'Эмпатия, поддержка, время на размышление',
            icon: <Stethoscope className="w-5 h-5" />,
            color: 'bg-amber-500',
            children: [
              {
                id: 'melancholic-action',
                title: 'Конкретные действия',
                description: '«Я понимаю ваше беспокойство. Давайте обсудим все варианты. Не спешите с решением»',
                icon: <MessageCircle className="w-5 h-5" />,
                color: 'bg-green-500',
              }
            ]
          }
        ]
      },
      {
        id: 'age-group',
        title: 'Уровень 1: Возрастная группа',
        description: 'Учесть возрастные особенности восприятия',
        icon: <User className="w-5 h-5" />,
        color: 'bg-purple-500',
        children: [
          {
            id: 'child-example',
            title: 'Ребенок 5 лет → Игровой подход',
            description: 'Простые слова, визуализация, вовлечение родителя',
            icon: <Stethoscope className="w-5 h-5" />,
            color: 'bg-amber-500',
            children: [
              {
                id: 'child-action',
                title: 'Конкретные действия',
                description: '«Этот стетоскоп - волшебный телефон! Давай послушаем, как бьется твое сердечко!»',
                icon: <MessageCircle className="w-5 h-5" />,
                color: 'bg-green-500',
              }
            ]
          },
          {
            id: 'elderly-example',
            title: 'Пожилой 70 лет → Формальный уважительный',
            description: 'Медленный темп, повторение, письменные инструкции',
            icon: <Stethoscope className="w-5 h-5" />,
            color: 'bg-amber-500',
            children: [
              {
                id: 'elderly-action',
                title: 'Конкретные действия',
                description: '«Уважаемый Иван Петрович, повторю еще раз. Вот запись с рекомендациями для вашей дочери»',
                icon: <MessageCircle className="w-5 h-5" />,
                color: 'bg-green-500',
              }
            ]
          }
        ]
      }
    ]
  }
];

function TreeNode({ node, level = 0 }: { node: ExampleNode; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="ml-0">
      <div
        className={`
          flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300
          hover:shadow-md hover:scale-[1.02]
          ${level === 0 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200' : ''}
          ${level === 1 ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 ml-6' : ''}
          ${level === 2 ? 'bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200 ml-12' : ''}
          ${level === 3 ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 ml-18' : ''}
        `}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className={`${node.color} text-white p-2 rounded-lg flex-shrink-0`}>
          {node.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-800">{node.title}</h4>
            {hasChildren && (
              <span className="text-slate-400">
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">{node.description}</p>
        </div>
        <Badge 
          variant="outline" 
          className={`
            ${level === 0 ? 'border-blue-300 text-blue-700' : ''}
            ${level === 1 ? 'border-purple-300 text-purple-700' : ''}
            ${level === 2 ? 'border-amber-300 text-amber-700' : ''}
            ${level === 3 ? 'border-green-300 text-green-700' : ''}
          `}
        >
          {level === 0 ? 'Принцип' : level === 1 ? 'Категория' : level === 2 ? 'Стратегия' : 'Действие'}
        </Badge>
      </div>

      {hasChildren && expanded && (
        <div className="mt-3 space-y-3">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExamplesTree() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-2 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              От общего к частному
            </span>
            <p className="text-sm text-slate-500 font-normal">
              Иерархия принятия решений в коммуникации с пациентом
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {examplesData.map((node) => (
            <TreeNode key={node.id} node={node} />
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h5 className="font-semibold text-slate-700 mb-3">Легенда уровней:</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-slate-600">Общий принцип</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm text-slate-600">Категория</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-sm text-slate-600">Стратегия</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-slate-600">Конкретное действие</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
