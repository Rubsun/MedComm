import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Типы узлов
interface NodeData extends Record<string, unknown> {
  label: string;
  desc?: string;
  strategy?: string;
}

const strategyDetails: Record<string, { title: string; strategies: string[]; examples: string[] }> = {
  'Холерик': {
    title: 'Стратегия для холерика',
    strategies: [
      'Doctor-centered подход',
      'Четкие инструкции без лишних деталей',
      'Структурированный разговор',
      'Быстрая реакция на вопросы',
      'Предоставление выбора где возможно'
    ],
    examples: [
      '«Вам необходимо принимать это лекарство два раза в день»',
      '«У вас есть два варианта лечения: А или Б. Что предпочитаете?»',
      '«Сейчас я объясню план действий»'
    ]
  },
  'Сангвиник': {
    title: 'Стратегия для сангвиника',
    strategies: [
      'Яркие эмоции и позитив',
      'Игровой подход (для детей)',
      'Похвала и поощрение',
      'Активное вовлечение',
      'Использование простых слов'
    ],
    examples: [
      '«Отлично! Вы молодец, что пришли на прием!»',
      '«Давайте посмотрим, какой ты сильный!»',
      '«Это интересно, расскажу подробнее!»'
    ]
  },
  'Флегматик': {
    title: 'Стратегия для флегматика',
    strategies: [
      'Спокойный тон голоса',
      'Подробное объяснение каждого этапа',
      'Время на принятие решения',
      'Отсутствие спешки',
      'Повторение ключевой информации'
    ],
    examples: [
      '«Возьмите время подумать. Я подожду»',
      '«Давайте разберем по шагам...»',
      '«Нет спешки, мы всё обсудим»'
    ]
  },
  'Меланхолик': {
    title: 'Стратегия для меланхолика',
    strategies: [
      'Мягкий тон общения',
      'Терпеливое выслушивание',
      'Избегание давления',
      'Индивидуальный подход',
      'Эмоциональная поддержка'
    ],
    examples: [
      '«Я понимаю, это вас беспокоит»',
      '«Расскажите, как вы себя чувствуете»',
      '«Мы разберемся с этим вместе»'
    ]
  },
  'Дети 3-12': {
    title: 'Стратегия для детей',
    strategies: [
      'Обращение на уровне глаз',
      'Простые слова и объяснения',
      'Визуальные помощники',
      'Игровая форма осмотра',
      'Вовлечение родителя'
    ],
    examples: [
      '«Давай поиграем! Этот стетоскоп - это телефон!»',
      '«Покажи мне, где болит твоя игрушка»',
      '«Мама тебе поможет, хорошо?»'
    ]
  },
  'Подростки 13-17': {
    title: 'Стратегия для подростков',
    strategies: [
      'Учет копинг-стилей (мониторинг/блантинг)',
      'Обращение напрямую к подростку',
      'Уважение автономии',
      'Конфиденциальность',
      'Объяснение «почему»'
    ],
    examples: [
      '«Могу я поговорить с тобой лично?»',
      '«Хочешь, расскажу все детали или кратко?»',
      '«Это важно для твоего здоровья, потому что...»'
    ]
  },
  'Взрослые 18-65': {
    title: 'Стратегия для взрослых',
    strategies: [
      'Индивидуальный подход',
      'Вовлечение в принятие решений',
      'Предоставление информации',
      'Учет личностных особенностей',
      'Партнерские отношения'
    ],
    examples: [
      '«Какой подход вам ближе?»',
      '«Давайте обсудим варианты»',
      '«Что для вас важнее?»'
    ]
  },
  'Пожилые 65+': {
    title: 'Стратегия для пожилых',
    strategies: [
      'Формальный стиль общения',
      'Уважительное обращение',
      'Медленный темп речи',
      'Повторение информации',
      'Письменные инструкции'
    ],
    examples: [
      '«Уважаемый Иван Петрович...»',
      '«Повторю еще раз для ясности»',
      '«Вот запись с рекомендациями»'
    ]
  },
  'Patient-centered': {
    title: 'Patient-centered подход',
    strategies: [
      'Активное слушание',
      'Эмпатия и поддержка',
      'Вовлечение пациента',
      'Подробная информация',
      'Совместное принятие решений'
    ],
    examples: [
      '«Что вас беспокоит больше всего?»',
      '«Как вы себя чувствуете по этому поводу?»',
      '«Какой вариант вам подходит?»'
    ]
  },
  'Doctor-centered': {
    title: 'Doctor-centered подход',
    strategies: [
      'Четкие инструкции',
      'Структурированность',
      'Контроль консультации',
      'Минимизация отвлечений',
      'Прямые рекомендации'
    ],
    examples: [
      '«Вам нужно сделать следующее...»',
      '«Я назначаю вам...»',
      '«Следуйте этим указаниям»'
    ]
  }
};

const initialNodes: Node<NodeData>[] = [
  {
    id: 'root',
    type: 'default',
    data: { label: 'Стратегии коммуникации\nврача с пациентом' },
    position: { x: 400, y: 300 },
    style: {
      background: '#1e3a5f',
      color: 'white',
      border: '3px solid #3b82f6',
      borderRadius: '50%',
      width: 180,
      height: 180,
      fontSize: '14px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(30, 58, 95, 0.4)',
    },
  },
  {
    id: 'temp',
    type: 'default',
    data: { label: 'По темпераменту' },
    position: { x: 150, y: 100 },
    style: {
      background: '#7c3aed',
      color: 'white',
      borderRadius: '16px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 'bold',
      boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)',
    },
  },
  {
    id: 'age',
    type: 'default',
    data: { label: 'По возрасту' },
    position: { x: 650, y: 100 },
    style: {
      background: '#059669',
      color: 'white',
      borderRadius: '16px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 'bold',
      boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)',
    },
  },
  {
    id: 'style',
    type: 'default',
    data: { label: 'Стиль коммуникации' },
    position: { x: 400, y: 520 },
    style: {
      background: '#dc2626',
      color: 'white',
      borderRadius: '16px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 'bold',
      boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)',
    },
  },
  // Темпераменты
  {
    id: 'choleric',
    type: 'default',
    data: { label: 'Холерик', desc: 'Доминирующий, импульсивный' },
    position: { x: 50, y: 0 },
    style: {
      background: '#fef3c7',
      border: '2px solid #f59e0b',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#92400e',
      cursor: 'pointer',
    },
  },
  {
    id: 'sanguine',
    type: 'default',
    data: { label: 'Сангвиник', desc: 'Активный, эмоциональный' },
    position: { x: 150, y: -80 },
    style: {
      background: '#fef3c7',
      border: '2px solid #f59e0b',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#92400e',
      cursor: 'pointer',
    },
  },
  {
    id: 'phlegmatic',
    type: 'default',
    data: { label: 'Флегматик', desc: 'Спокойный, медлительный' },
    position: { x: 250, y: 0 },
    style: {
      background: '#fef3c7',
      border: '2px solid #f59e0b',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#92400e',
      cursor: 'pointer',
    },
  },
  {
    id: 'melancholic',
    type: 'default',
    data: { label: 'Меланхолик', desc: 'Чувствительный, интроверт' },
    position: { x: 150, y: 80 },
    style: {
      background: '#fef3c7',
      border: '2px solid #f59e0b',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#92400e',
      cursor: 'pointer',
    },
  },
  // Возраст
  {
    id: 'children',
    type: 'default',
    data: { label: 'Дети 3-12', desc: 'Игровой подход' },
    position: { x: 550, y: -80 },
    style: {
      background: '#d1fae5',
      border: '2px solid #10b981',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#065f46',
      cursor: 'pointer',
    },
  },
  {
    id: 'teen',
    type: 'default',
    data: { label: 'Подростки 13-17', desc: 'Учет копинг-стилей' },
    position: { x: 650, y: 0 },
    style: {
      background: '#d1fae5',
      border: '2px solid #10b981',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#065f46',
      cursor: 'pointer',
    },
  },
  {
    id: 'adult',
    type: 'default',
    data: { label: 'Взрослые 18-65', desc: 'Индивидуальный подход' },
    position: { x: 750, y: -80 },
    style: {
      background: '#d1fae5',
      border: '2px solid #10b981',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#065f46',
      cursor: 'pointer',
    },
  },
  {
    id: 'elderly',
    type: 'default',
    data: { label: 'Пожилые 65+', desc: 'Формальный стиль' },
    position: { x: 850, y: 0 },
    style: {
      background: '#d1fae5',
      border: '2px solid #10b981',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#065f46',
      cursor: 'pointer',
    },
  },
  // Стили
  {
    id: 'patient-centered',
    type: 'default',
    data: { label: 'Patient-centered', desc: 'Вовлечение пациента' },
    position: { x: 300, y: 650 },
    style: {
      background: '#fee2e2',
      border: '2px solid #ef4444',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#991b1b',
      cursor: 'pointer',
    },
  },
  {
    id: 'doctor-centered',
    type: 'default',
    data: { label: 'Doctor-centered', desc: 'Четкие инструкции' },
    position: { x: 500, y: 650 },
    style: {
      background: '#fee2e2',
      border: '2px solid #ef4444',
      borderRadius: '12px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#991b1b',
      cursor: 'pointer',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'root', target: 'temp', animated: true, style: { stroke: '#7c3aed', strokeWidth: 3 } },
  { id: 'e2', source: 'root', target: 'age', animated: true, style: { stroke: '#059669', strokeWidth: 3 } },
  { id: 'e3', source: 'root', target: 'style', animated: true, style: { stroke: '#dc2626', strokeWidth: 3 } },
  { id: 'e4', source: 'temp', target: 'choleric', style: { stroke: '#f59e0b', strokeWidth: 2 } },
  { id: 'e5', source: 'temp', target: 'sanguine', style: { stroke: '#f59e0b', strokeWidth: 2 } },
  { id: 'e6', source: 'temp', target: 'phlegmatic', style: { stroke: '#f59e0b', strokeWidth: 2 } },
  { id: 'e7', source: 'temp', target: 'melancholic', style: { stroke: '#f59e0b', strokeWidth: 2 } },
  { id: 'e8', source: 'age', target: 'children', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e9', source: 'age', target: 'teen', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e10', source: 'age', target: 'adult', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e11', source: 'age', target: 'elderly', style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e12', source: 'style', target: 'patient-centered', style: { stroke: '#ef4444', strokeWidth: 2 } },
  { id: 'e13', source: 'style', target: 'doctor-centered', style: { stroke: '#ef4444', strokeWidth: 2 } },
];

export default function MindMap() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const label = (node.data as NodeData).label;
    if (strategyDetails[label]) {
      setSelectedNode(label);
      setDialogOpen(true);
    }
  }, []);

  const selectedStrategy = selectedNode ? strategyDetails[selectedNode] : null;

  return (
    <div className="h-[700px] w-full border rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#94a3b8" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === 'root') return '#1e3a5f';
            if (node.id === 'temp') return '#7c3aed';
            if (node.id === 'age') return '#059669';
            if (node.id === 'style') return '#dc2626';
            if (['choleric', 'sanguine', 'phlegmatic', 'melancholic'].includes(node.id)) return '#f59e0b';
            if (['children', 'teen', 'adult', 'elderly'].includes(node.id)) return '#10b981';
            return '#ef4444';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
        />
      </ReactFlow>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedStrategy && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  {selectedStrategy.title}
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Кликните на узел на карте, чтобы увидеть детали стратегии
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4 space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Ключевые стратегии:
                  </h4>
                  <ul className="space-y-2">
                    {selectedStrategy.strategies.map((strategy, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="text-blue-500 font-bold">{idx + 1}.</span>
                        <span className="text-slate-700">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Примеры фраз:
                  </h4>
                  <ul className="space-y-2">
                    {selectedStrategy.examples.map((example, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <span className="text-green-600 italic">"{example}"</span>
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
