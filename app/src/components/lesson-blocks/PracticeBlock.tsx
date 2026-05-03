import { useState } from 'react';
import { progressApi } from '@/api/progress';
import { Button } from '@/components/ui/button';
import type { LessonBlockOut } from '@/types/api';

interface Option { id: string; text: string; is_correct: boolean; feedback?: string }
interface PracticeData {
  answer_mode?: 'single' | 'multiple';
  options: Option[];
  explanation?: string;
  patient?: { name: string; age: number; complaint: string };
  situation?: string;
  goal?: string;
}

export interface PracticeResultState {
  is_correct: boolean;
  selected_option_ids: string[];
}

interface Props {
  block: LessonBlockOut;
  initialResult?: PracticeResultState;
  onResult?: (result: PracticeResultState) => void;
}

export default function PracticeBlock({ block, initialResult, onResult }: Props) {
  const data = block.data as unknown as PracticeData;
  const isSingle = data.answer_mode === 'single' || (data.answer_mode === undefined &&
    data.options.filter(o => o.is_correct).length <= 1);

  const [selected, setSelected] = useState<string[]>(initialResult?.selected_option_ids ?? []);
  const [result, setResult] = useState<PracticeResultState | null>(initialResult ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleOption = (id: string) => {
    if (isSingle) {
      setSelected([id]);
    } else {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await progressApi.submitPractice(block.id, selected);
      const next = {
        is_correct: res.data.is_correct,
        selected_option_ids: res.data.selected_option_ids,
      };
      setResult(next);
      onResult?.(next);
    } catch (err) {
      console.error('Failed to submit practice', err);
      setSubmitError('Не удалось отправить ответ. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setSelected([]);
    setSubmitError(null);
  };

  // выбираем feedback для показанных вариантов
  const selectedOptions = (result ? result.selected_option_ids : []).map(
    id => data.options.find(o => o.id === id)
  ).filter((o): o is Option => Boolean(o));

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
        {data.options.map(opt => {
          const isChecked = (result ? result.selected_option_ids : selected).includes(opt.id);
          const showCorrectness = !!result;
          return (
            <label
              key={opt.id}
              className={`flex items-start gap-2 cursor-pointer rounded p-2 ${
                showCorrectness && isChecked
                  ? opt.is_correct ? 'bg-green-100' : 'bg-red-100'
                  : showCorrectness && opt.is_correct
                    ? 'bg-green-50'
                    : ''
              }`}
            >
              <input
                type={isSingle ? 'radio' : 'checkbox'}
                name={`practice-${block.id}`}
                checked={isChecked}
                onChange={() => toggleOption(opt.id)}
                disabled={!!result}
                className="mt-1"
              />
              <div className="flex-1">
                <div>{opt.text}</div>
                {showCorrectness && isChecked && opt.feedback && (
                  <div className="text-xs text-slate-600 mt-1">{opt.feedback}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {!result && (
        <>
          <Button onClick={handleSubmit} disabled={selected.length === 0 || submitting} size="sm">
            {submitting ? 'Отправка...' : 'Ответить'}
          </Button>
          {submitError && <p className="text-sm text-red-500 mt-1">{submitError}</p>}
        </>
      )}

      {result && (
        <div className={`rounded p-3 text-sm space-y-2 ${result.is_correct ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
          <div className="font-medium">
            {result.is_correct ? '✓ Верно!' : '✗ Неверно'}
          </div>
          {!result.is_correct && selectedOptions.some(o => o.feedback) && (
            <div className="text-slate-700 space-y-1">
              {selectedOptions.filter(o => o.feedback).map(o => (
                <div key={o.id} className="text-xs">{o.feedback}</div>
              ))}
            </div>
          )}
          {data.explanation && (
            <div className="text-slate-700 text-sm">{data.explanation}</div>
          )}
          {!result.is_correct && (
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Попробовать снова
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
