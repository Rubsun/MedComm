import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';

interface Option { id: string; text: string; is_correct: boolean; feedback: string }
interface PracticeData {
  answer_mode?: 'single' | 'multiple';
  situation?: string;
  goal?: string;
  explanation?: string;
  options?: Option[];
  patient?: { name: string; age: number; complaint: string };
}

interface Props { data: PracticeData; onSave: (data: Record<string, unknown>) => void }

export default function PracticeBlockEditor({ data, onSave }: Props) {
  const [mode, setMode] = useState<'single' | 'multiple'>(data.answer_mode ?? 'single');
  const [situation, setSituation] = useState(data.situation ?? '');
  const [goal, setGoal] = useState(data.goal ?? '');
  const [explanation, setExplanation] = useState(data.explanation ?? '');
  const [options, setOptions] = useState<Option[]>(data.options ?? []);
  const [patientName, setPatientName] = useState(data.patient?.name ?? '');
  const [patientAge, setPatientAge] = useState(String(data.patient?.age ?? ''));
  const [patientComplaint, setPatientComplaint] = useState(data.patient?.complaint ?? '');

  const addOption = () => setOptions(prev => [...prev, { id: Date.now().toString(), text: '', is_correct: false, feedback: '' }]);
  const updateOption = (id: string, field: keyof Option, val: string | boolean) =>
    setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: val } : o));
  const removeOption = (id: string) => setOptions(prev => prev.filter(o => o.id !== id));

  const handleSave = () => {
    onSave({
      answer_mode: mode,
      situation,
      goal,
      explanation,
      options,
      patient: { name: patientName, age: Number(patientAge), complaint: patientComplaint },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Имя пациента" />
        <Input value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="Возраст" type="number" />
        <Input value={patientComplaint} onChange={e => setPatientComplaint(e.target.value)} placeholder="Жалоба" />
      </div>

      <Textarea value={situation} onChange={e => setSituation(e.target.value)} placeholder="Описание ситуации" rows={3} />
      <Input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Цель студента" />

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Режим ответа:</span>
        <button onClick={() => setMode('single')} className={`px-3 py-1 rounded text-sm ${mode === 'single' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Один</button>
        <button onClick={() => setMode('multiple')} className={`px-3 py-1 rounded text-sm ${mode === 'multiple' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Несколько</button>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Варианты ответов</div>
        {options.map(opt => (
          <div key={opt.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded">
            <input type="checkbox" checked={opt.is_correct} onChange={e => updateOption(opt.id, 'is_correct', e.target.checked)} className="mt-2" title="Правильный" />
            <div className="flex-1 space-y-1">
              <Input value={opt.text} onChange={e => updateOption(opt.id, 'text', e.target.value)} placeholder="Текст варианта" className="h-8" />
              <Input value={opt.feedback} onChange={e => updateOption(opt.id, 'feedback', e.target.value)} placeholder="Обратная связь" className="h-7 text-sm" />
            </div>
            {opt.is_correct && <Badge variant="default" className="mt-1">✓</Badge>}
            <Button size="icon" variant="ghost" onClick={() => removeOption(opt.id)}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-1" onClick={addOption}><Plus className="w-3 h-3" />Добавить вариант</Button>
      </div>

      <Textarea value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Объяснение (показывается после ответа)" rows={2} />
      <Button size="sm" onClick={handleSave}>Сохранить</Button>
    </div>
  );
}
