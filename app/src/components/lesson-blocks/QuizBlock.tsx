import { useState } from 'react';
import { progressApi } from '@/api/progress';
import { Button } from '@/components/ui/button';
import type { LessonBlockOut, QuizResultOut } from '@/types/api';

interface QuizQuestion {
  id: string;
  type?: 'single_choice' | 'multiple_choice';
  text: string;
  points?: number;
  options?: { id: string; text: string }[];
  correct_option_ids?: string[];
  correct_option_id?: string;
  explanation?: string;
}

interface QuizData {
  passing_score: number;
  max_attempts?: number;
  questions: QuizQuestion[];
}

function correctIds(q: QuizQuestion): string[] {
  if (q.correct_option_ids?.length) return q.correct_option_ids;
  if (q.correct_option_id) return [q.correct_option_id];
  return [];
}

function questionType(q: QuizQuestion): 'single_choice' | 'multiple_choice' {
  if (q.type) return q.type;
  return correctIds(q).length > 1 ? 'multiple_choice' : 'single_choice';
}

interface Props {
  block: LessonBlockOut;
  initialResult?: QuizResultOut;
  onResult?: (result: QuizResultOut) => void;
}

export default function QuizBlock({ block, initialResult, onResult }: Props) {
  const data = block.data as unknown as QuizData;
  const maxAttempts = data.max_attempts ?? 0;
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizResultOut | null>(initialResult ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleAnswer = (questionId: string, optionId: string, isSingle: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] ?? [];
      if (isSingle) return { ...prev, [questionId]: [optionId] };
      return {
        ...prev,
        [questionId]: current.includes(optionId)
          ? current.filter(x => x !== optionId)
          : [...current, optionId],
      };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    let score = 0;
    let maxScore = 0;
    for (const q of data.questions) {
      const points = q.points ?? 1;
      maxScore += points;
      const userAnswers = answers[q.id] ?? [];
      const correct = correctIds(q);
      const isCorrect =
        correct.length > 0 &&
        userAnswers.length === correct.length &&
        userAnswers.every(a => correct.includes(a));
      if (isCorrect) score += points;
    }
    try {
      const res = await progressApi.submitQuiz(block.id, score, maxScore);
      setResult(res.data);
      onResult?.(res.data);
    } catch (err) {
      console.error('Failed to submit quiz', err);
      setSubmitError('Не удалось отправить тест. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-indigo-50 space-y-6">
      <div className="text-sm text-slate-500">
        Проходной балл: {data.passing_score} · Попыток: {maxAttempts === 0 ? '∞' : maxAttempts}
      </div>

      {data.questions.map((q, i) => {
        const qType = questionType(q);
        const isSingle = qType === 'single_choice';
        const points = q.points ?? 1;
        return (
          <div key={q.id} className="space-y-2">
            <p className="font-medium">
              {i + 1}. {q.text}{' '}
              <span className="text-slate-400 text-sm">({points} б.)</span>
            </p>
            {(q.options ?? []).map(opt => (
              <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type={isSingle ? 'radio' : 'checkbox'}
                  name={`quiz-${block.id}-q${q.id}`}
                  checked={(answers[q.id] ?? []).includes(opt.id)}
                  onChange={() => toggleAnswer(q.id, opt.id, isSingle)}
                  disabled={!!result}
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        );
      })}

      {!result && (
        <>
          <Button onClick={handleSubmit} disabled={submitting} size="sm">
            {submitting ? 'Проверка...' : 'Сдать тест'}
          </Button>
          {submitError && <p className="text-sm text-red-500 mt-1">{submitError}</p>}
        </>
      )}

      {result && (
        <div className={`rounded p-3 ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <strong>{result.passed ? 'Сдан!' : 'Не сдан'}</strong>
          {' '}{result.score}/{result.max_score} баллов (попытка {result.attempts})
          {!result.passed && (maxAttempts === 0 || result.attempts < maxAttempts) && (
            <Button variant="outline" size="sm" className="ml-4" onClick={() => setResult(null)}>
              Попробовать снова
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
