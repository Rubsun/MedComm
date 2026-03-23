import { useState } from 'react';
import { progressApi } from '@/api/progress';
import { Button } from '@/components/ui/button';
import type { LessonBlockOut, QuizResultOut } from '@/types/api';

interface QuizQuestion {
  id: string;
  type: 'single_choice' | 'multiple_choice';
  text: string;
  points: number;
  options?: { id: string; text: string }[];
  correct_option_ids: string[];
}

interface QuizData {
  passing_score: number;
  max_attempts: number;
  questions: QuizQuestion[];
}

export default function QuizBlock({ block }: { block: LessonBlockOut }) {
  const data = block.data as unknown as QuizData;
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizResultOut | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    let score = 0;
    let maxScore = 0;
    for (const q of data.questions) {
      maxScore += q.points;
      const userAnswers = answers[q.id] ?? [];
      const correct = q.correct_option_ids;
      const isCorrect =
        userAnswers.length === correct.length &&
        userAnswers.every(a => correct.includes(a));
      if (isCorrect) score += q.points;
    }
    try {
      const res = await progressApi.submitQuiz(block.id, score, maxScore);
      setResult(res.data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-indigo-50 space-y-6">
      <div className="text-sm text-slate-500">
        Проходной балл: {data.passing_score}% · Попыток: {data.max_attempts === 0 ? '∞' : data.max_attempts}
      </div>

      {data.questions.map((q, i) => (
        <div key={q.id} className="space-y-2">
          <p className="font-medium">{i + 1}. {q.text} <span className="text-slate-400 text-sm">({q.points} б.)</span></p>
          {(q.options ?? []).map(opt => (
            <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type={q.type === 'single_choice' ? 'radio' : 'checkbox'}
                name={`quiz-${block.id}-q${q.id}`}
                checked={(answers[q.id] ?? []).includes(opt.id)}
                onChange={() => toggleAnswer(q.id, opt.id, q.type === 'single_choice')}
                disabled={!!result}
              />
              <span>{opt.text}</span>
            </label>
          ))}
        </div>
      ))}

      {!result && (
        <Button onClick={handleSubmit} disabled={submitting} size="sm">
          {submitting ? 'Проверка...' : 'Сдать тест'}
        </Button>
      )}

      {result && (
        <div className={`rounded p-3 ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <strong>{result.passed ? 'Сдан!' : 'Не сдан'}</strong>
          {' '}{result.score}/{result.max_score} баллов (попытка {result.attempts})
          {!result.passed && (data.max_attempts === 0 || result.attempts < data.max_attempts) && (
            <Button variant="outline" size="sm" className="ml-4" onClick={() => setResult(null)}>
              Попробовать снова
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
