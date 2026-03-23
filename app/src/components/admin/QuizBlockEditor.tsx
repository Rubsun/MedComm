import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface QuizOption { id: string; text: string }
interface QuizQuestion {
  id: string;
  type: 'single_choice' | 'multiple_choice';
  text: string;
  points: number;
  options: QuizOption[];
  correct_option_ids: string[];
  explanation: string;
}
interface QuizData { passing_score?: number; max_attempts?: number; questions?: QuizQuestion[] }

interface Props { data: QuizData; onSave: (data: Record<string, unknown>) => void }

export default function QuizBlockEditor({ data, onSave }: Props) {
  const [passingScore, setPassingScore] = useState(data.passing_score ?? 70);
  const [maxAttempts, setMaxAttempts] = useState(data.max_attempts ?? 3);
  const [questions, setQuestions] = useState<QuizQuestion[]>(data.questions ?? []);

  const addQuestion = () => setQuestions(prev => [
    ...prev,
    { id: Date.now().toString(), type: 'single_choice', text: '', points: 10, options: [], correct_option_ids: [], explanation: '' }
  ]);

  const updateQuestion = (id: string, field: keyof QuizQuestion, val: unknown) =>
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: val } : q));

  const addOption = (qid: string) =>
    setQuestions(prev => prev.map(q => q.id === qid
      ? { ...q, options: [...q.options, { id: Date.now().toString(), text: '' }] }
      : q
    ));

  const toggleCorrect = (qid: string, oid: string, isSingle: boolean) =>
    setQuestions(prev => prev.map(q => {
      if (q.id !== qid) return q;
      const correct = isSingle ? [oid] : q.correct_option_ids.includes(oid)
        ? q.correct_option_ids.filter(x => x !== oid)
        : [...q.correct_option_ids, oid];
      return { ...q, correct_option_ids: correct };
    }));

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div>
          <label className="text-xs text-slate-500">Проходной балл (%)</label>
          <Input type="number" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} className="w-24 h-8" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Макс. попыток (0=∞)</label>
          <Input type="number" value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} className="w-24 h-8" />
        </div>
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="border rounded p-3 space-y-2 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-6">{i + 1}.</span>
            <Input value={q.text} onChange={e => updateQuestion(q.id, 'text', e.target.value)} placeholder="Текст вопроса" className="flex-1 h-8" />
            <Input type="number" value={q.points} onChange={e => updateQuestion(q.id, 'points', Number(e.target.value))} className="w-16 h-8" />
            <select value={q.type} onChange={e => updateQuestion(q.id, 'type', e.target.value)} className="text-sm border rounded px-2 h-8">
              <option value="single_choice">Один</option>
              <option value="multiple_choice">Несколько</option>
            </select>
            <Button size="icon" variant="ghost" onClick={() => setQuestions(prev => prev.filter(x => x.id !== q.id))}><Trash2 className="w-3 h-3" /></Button>
          </div>
          {q.options.map(opt => (
            <div key={opt.id} className="flex items-center gap-2 ml-6">
              <input
                type={q.type === 'single_choice' ? 'radio' : 'checkbox'}
                checked={q.correct_option_ids.includes(opt.id)}
                onChange={() => toggleCorrect(q.id, opt.id, q.type === 'single_choice')}
                name={`q-${q.id}`}
              />
              <Input
                value={opt.text}
                onChange={e => setQuestions(prev => prev.map(qq => qq.id === q.id
                  ? { ...qq, options: qq.options.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o) }
                  : qq
                ))}
                placeholder="Вариант ответа"
                className="h-7 text-sm"
              />
              <Button size="icon" variant="ghost" onClick={() => setQuestions(prev => prev.map(qq => qq.id === q.id
                ? { ...qq, options: qq.options.filter(o => o.id !== opt.id), correct_option_ids: qq.correct_option_ids.filter(x => x !== opt.id) }
                : qq
              ))}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="ml-6 text-xs gap-1" onClick={() => addOption(q.id)}><Plus className="w-3 h-3" />Вариант</Button>
        </div>
      ))}

      <Button variant="outline" size="sm" className="gap-1" onClick={addQuestion}><Plus className="w-3 h-3" />Вопрос</Button>
      <Button size="sm" onClick={() => onSave({ passing_score: passingScore, max_attempts: maxAttempts, questions })}>Сохранить тест</Button>
    </div>
  );
}
