import { useState } from 'react';
import { progressApi } from '@/api/progress';
import { Button } from '@/components/ui/button';
import type { LessonBlockOut } from '@/types/api';

interface Option { id: string; text: string; is_correct: boolean; feedback?: string }
interface PracticeData {
  answer_mode: 'single' | 'multiple';
  options: Option[];
  explanation?: string;
  patient?: { name: string; age: number; complaint: string };
  situation?: string;
  goal?: string;
}

export default function PracticeBlock({ block }: { block: LessonBlockOut }) {
  const data = block.data as unknown as PracticeData;
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<{ is_correct: boolean; selected_option_ids: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleOption = (id: string) => {
    if (data.answer_mode === 'single') {
      setSelected([id]);
    } else {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await progressApi.submitPractice(block.id, selected);
      setResult(res.data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-amber-50 space-y-4">
      {data.patient && (
        <div className="text-sm bg-white rounded p-3 border">
          <strong>{data.patient.name}</strong>, {data.patient.age} лет
          <br />{data.patient.complaint}
        </div>
      )}
      {data.situation && <p className="text-slate-700">{data.situation}</p>}
      {data.goal && <p className="text-sm font-medium text-slate-600">Цель: {data.goal}</p>}

      <div className="space-y-2">
        {data.options.map(opt => (
          <label key={opt.id} className="flex items-start gap-2 cursor-pointer">
            <input
              type={data.answer_mode === 'single' ? 'radio' : 'checkbox'}
              name={`practice-${block.id}`}
              checked={selected.includes(opt.id)}
              onChange={() => toggleOption(opt.id)}
              disabled={!!result}
              className="mt-1"
            />
            <span>{opt.text}</span>
          </label>
        ))}
      </div>

      {!result && (
        <Button onClick={handleSubmit} disabled={selected.length === 0 || submitting} size="sm">
          {submitting ? 'Отправка...' : 'Ответить'}
        </Button>
      )}

      {result && (
        <div className={`rounded p-3 text-sm ${result.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.is_correct ? '✓ Верно!' : '✗ Неверно'}
          {data.explanation && <p className="mt-1 text-slate-700">{data.explanation}</p>}
        </div>
      )}
    </div>
  );
}
