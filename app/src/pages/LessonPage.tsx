import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonsApi } from '@/api/lessons';
import { progressApi } from '@/api/progress';
import { modulesApi } from '@/api/modules';
import type { LessonBlockOut, LessonOut, ModuleOut, QuizResultOut } from '@/types/api';
import TextBlock from '@/components/lesson-blocks/TextBlock';
import ImageBlock from '@/components/lesson-blocks/ImageBlock';
import VideoBlock from '@/components/lesson-blocks/VideoBlock';
import PracticeBlock, { type PracticeResultState } from '@/components/lesson-blocks/PracticeBlock';
import QuizBlock from '@/components/lesson-blocks/QuizBlock';
import {
  Badge,
  Button,
  Icon,
  type IconName,
  ToastViewport,
  useToasts,
} from '@/components/medcomm';

const BLOCK_LABEL: Record<string, string> = {
  text: 'Текст',
  image: 'Изображение',
  video: 'Видео',
  practice: 'Практика',
  quiz: 'Тест',
};
const BLOCK_ICON: Record<string, IconName> = {
  text: 'note',
  image: 'image',
  video: 'video',
  practice: 'msg',
  quiz: 'list',
};

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { toasts, push: toast, dismiss } = useToasts();

  const [lesson, setLesson] = useState<LessonOut | null>(null);
  const [blocks, setBlocks] = useState<LessonBlockOut[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleSiblings, setModuleSiblings] = useState<LessonOut[]>([]);
  const [parentModule, setParentModule] = useState<ModuleOut | null>(null);

  // прогресс по конкретным блокам (по block.id) — загружается из /progress/me
  const [practiceResults, setPracticeResults] = useState<Record<number, PracticeResultState>>({});
  const [quizResults, setQuizResults] = useState<Record<number, QuizResultOut>>({});
  // блоки, которые студент посетил в рамках текущей сессии (для текстовых/видео — это и есть «пройдены»)
  const [visitedBlocks, setVisitedBlocks] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (!lessonId) return;
    const id = Number(lessonId);
    setActiveIdx(0);
    setCompleted(false);
    setError(null);
    setVisitedBlocks(new Set([0]));
    setPracticeResults({});
    setQuizResults({});
    (async () => {
      try {
        const [lessonRes, blocksRes, progRes] = await Promise.all([
          lessonsApi.get(id),
          lessonsApi.getBlocks(id),
          progressApi.me(),
        ]);
        const lessonData = lessonRes.data;
        const sortedBlocks = blocksRes.data.slice().sort((a, b) => a.sort_order - b.sort_order);
        setLesson(lessonData);
        setBlocks(sortedBlocks);

        const blockIds = new Set(sortedBlocks.map((b) => b.id));
        const practiceMap: Record<number, PracticeResultState> = {};
        for (const r of progRes.data.practice_results) {
          if (blockIds.has(r.lesson_block_id)) {
            practiceMap[r.lesson_block_id] = {
              is_correct: r.is_correct,
              selected_option_ids: r.selected_option_ids,
            };
          }
        }
        setPracticeResults(practiceMap);
        const quizMap: Record<number, QuizResultOut> = {};
        for (const r of progRes.data.quiz_results) {
          if (blockIds.has(r.lesson_block_id)) {
            quizMap[r.lesson_block_id] = {
              lesson_block_id: r.lesson_block_id,
              score: r.score,
              best_score: r.best_score,
              max_score: r.max_score,
              passed: r.passed,
              attempts: r.attempts,
              completed_at: r.completed_at,
            };
          }
        }
        setQuizResults(quizMap);

        const isDone = progRes.data.completed_lessons.some((p) => p.lesson_id === id);
        setCompleted(isDone);
        if (isDone) {
          // если урок уже пройден — все блоки помечаем посещёнными
          setVisitedBlocks(new Set(sortedBlocks.map((_, i) => i)));
        }

        if (lessonData.module_id) {
          const siblingsRes = await lessonsApi.list(lessonData.module_id);
          const siblings = siblingsRes.data
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order);
          setModuleSiblings(siblings);
          try {
            const modRes = await modulesApi.get(lessonData.module_id);
            setParentModule(modRes.data);
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.error('Failed to load lesson', err);
        setError('Не удалось загрузить урок');
      }
    })();
  }, [lessonId]);

  const currentBlock = blocks[activeIdx];
  const isLastBlock = activeIdx === blocks.length - 1;
  const isFirstBlock = activeIdx === 0;

  const lessonIndexInModule = useMemo(() => {
    if (!lesson) return null;
    const idx = moduleSiblings.findIndex((l) => l.id === lesson.id);
    return idx === -1 ? null : idx;
  }, [lesson, moduleSiblings]);

  const nextLessonInModule = useMemo(() => {
    if (lessonIndexInModule == null) return null;
    return moduleSiblings[lessonIndexInModule + 1] ?? null;
  }, [moduleSiblings, lessonIndexInModule]);

  const prevLessonInModule = useMemo(() => {
    if (lessonIndexInModule == null) return null;
    return moduleSiblings[lessonIndexInModule - 1] ?? null;
  }, [moduleSiblings, lessonIndexInModule]);

  // условие готовности к завершению урока:
  // — все practice-блоки правильно отвечены
  // — все quiz-блоки сданы
  // — все остальные (text/image/video) посещены
  const completionStatus = useMemo(() => {
    const reasons: string[] = [];
    let pendingPractices = 0;
    let pendingQuizzes = 0;
    let unvisited = 0;
    blocks.forEach((b, i) => {
      if (b.type === 'practice') {
        if (!practiceResults[b.id]?.is_correct) pendingPractices++;
      } else if (b.type === 'quiz') {
        if (!quizResults[b.id]?.passed) pendingQuizzes++;
      } else if (!visitedBlocks.has(i)) {
        unvisited++;
      }
    });
    if (pendingPractices > 0) reasons.push(`пройдите практику (${pendingPractices})`);
    if (pendingQuizzes > 0) reasons.push(`сдайте тест (${pendingQuizzes})`);
    if (unvisited > 0) reasons.push(`пролистайте блоки (${unvisited})`);
    return { canComplete: reasons.length === 0, reasons };
  }, [blocks, practiceResults, quizResults, visitedBlocks]);

  const isBlockDone = (i: number, b: LessonBlockOut) => {
    if (completed) return true;
    if (b.type === 'practice') return practiceResults[b.id]?.is_correct === true;
    if (b.type === 'quiz') return quizResults[b.id]?.passed === true;
    return visitedBlocks.has(i);
  };

  const handleComplete = async () => {
    if (!lesson) return;
    setCompleting(true);
    try {
      await progressApi.completeLesson(lesson.id);
      setCompleted(true);
      setVisitedBlocks(new Set(blocks.map((_, i) => i)));
    } catch (err) {
      console.error('Failed to complete lesson', err);
      toast({ message: 'Не удалось сохранить прогресс', icon: 'warning', color: 'var(--danger)' });
    } finally {
      setCompleting(false);
    }
  };

  const goToBlock = (i: number) => {
    setActiveIdx(i);
    setVisitedBlocks((prev) => new Set([...prev, i]));
  };

  const handleNext = () => {
    if (!isLastBlock) {
      goToBlock(activeIdx + 1);
    } else if (!completed) {
      void handleComplete();
    } else if (nextLessonInModule) {
      navigate(`/lesson/${nextLessonInModule.id}`);
    } else {
      navigate('/program');
    }
  };

  const handlePrev = () => {
    if (!isFirstBlock) goToBlock(activeIdx - 1);
    else if (prevLessonInModule) navigate(`/lesson/${prevLessonInModule.id}`);
  };

  if (error) {
    return (
      <div style={{ padding: 32, fontSize: 13, color: 'var(--danger)' }}>{error}</div>
    );
  }
  if (!lesson) {
    return <div style={{ padding: 32, color: 'var(--ink-500)', fontSize: 13 }}>Загрузка урока…</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <aside
        style={{
          width: 280,
          borderRight: '1px solid var(--line)',
          background: 'var(--surface)',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--line-soft)' }}>
          <button
            onClick={() => navigate('/program')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--ink-500)',
              fontSize: 12,
              marginBottom: 10,
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <Icon name="chevronLeft" size={14} /> К программе
          </button>
          {lessonIndexInModule != null && moduleSiblings.length > 0 && (
            <Badge tone="teal" size="sm">
              Урок {lessonIndexInModule + 1} из {moduleSiblings.length}
            </Badge>
          )}
          <h3 style={{ fontSize: 14, marginTop: 8, lineHeight: 1.35 }}>{lesson.title}</h3>
          {parentModule && (
            <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 4 }}>
              {parentModule.title}
            </div>
          )}
          {completed && (
            <div style={{ marginTop: 10 }}>
              <Badge tone="success" size="sm" icon="check">
                Урок пройден
              </Badge>
            </div>
          )}
        </div>
        <div style={{ padding: 12 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--ink-500)',
              textTransform: 'uppercase',
              padding: '6px 8px',
              letterSpacing: '0.05em',
            }}
          >
            Содержание
          </div>
          {blocks.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12.5, color: 'var(--ink-500)' }}>
              В уроке пока нет блоков.
            </div>
          ) : (
            blocks.map((b, i) => {
              const done = isBlockDone(i, b);
              const isActive = activeIdx === i;
              return (
                <button
                  key={b.id}
                  onClick={() => goToBlock(i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 10px',
                    borderRadius: 8,
                    background: isActive ? 'var(--teal-50)' : 'transparent',
                    border: 'none',
                    color: isActive ? 'var(--teal-700)' : 'var(--ink-700)',
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: done ? 'var(--teal-600)' : 'var(--bg-soft)',
                      border: done ? 'none' : '1px solid var(--line)',
                      color: done ? 'white' : 'var(--ink-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {done ? (
                      <Icon name="check" size={12} />
                    ) : (
                      <Icon name={BLOCK_ICON[b.type] ?? 'note'} size={12} />
                    )}
                  </div>
                  <span style={{ flex: 1, lineHeight: 1.3 }}>
                    {BLOCK_LABEL[b.type] ?? b.type}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '12px 32px',
            borderBottom: '1px solid var(--line-soft)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'sticky',
            top: 0,
            zIndex: 5,
          }}
        >
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            {blocks.length === 0 ? (
              <div style={{ height: 4, flex: 1, borderRadius: 2, background: 'var(--line-soft)' }} />
            ) : (
              blocks.map((b, i) => {
                const done = isBlockDone(i, b);
                const isCurrent = i === activeIdx;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: done
                        ? 'var(--teal-600)'
                        : isCurrent
                          ? 'var(--teal-300)'
                          : 'var(--line-soft)',
                    }}
                  />
                );
              })
            )}
          </div>
          <span className="num" style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
            {blocks.length === 0 ? '0 / 0' : `${activeIdx + 1} / ${blocks.length}`}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            padding: '32px',
            maxWidth: 760,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 80,
          }}
        >
          {currentBlock ? (
            <BlockRenderer
              key={currentBlock.id}
              block={currentBlock}
              practiceInitial={practiceResults[currentBlock.id]}
              quizInitial={quizResults[currentBlock.id]}
              onPracticeResult={(r) =>
                setPracticeResults((prev) => ({ ...prev, [currentBlock.id]: r }))
              }
              onQuizResult={(r) =>
                setQuizResults((prev) => ({ ...prev, [currentBlock.id]: r }))
              }
            />
          ) : (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'var(--ink-500)',
                fontSize: 13,
              }}
            >
              В уроке нет содержимого.
            </div>
          )}
        </div>

        <div
          style={{
            position: 'sticky',
            bottom: 0,
            padding: '14px 32px',
            background: 'var(--surface)',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Button
            variant="secondary"
            icon="chevronLeft"
            onClick={handlePrev}
            disabled={isFirstBlock && !prevLessonInModule}
          >
            Назад
          </Button>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--ink-500)',
            }}
          >
            {currentBlock && (
              <>
                Раздел {activeIdx + 1}:{' '}
                <span style={{ color: 'var(--ink-800)', fontWeight: 600 }}>
                  {BLOCK_LABEL[currentBlock.type] ?? currentBlock.type}
                </span>
              </>
            )}
            {isLastBlock && !completed && !completionStatus.canComplete && (
              <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
                Чтобы завершить: {completionStatus.reasons.join(', ')}
              </div>
            )}
          </div>
          {!isLastBlock ? (
            <Button variant="primary" iconRight="chevronRight" onClick={handleNext}>
              Продолжить
            </Button>
          ) : !completed ? (
            <Button
              variant="primary"
              icon="checkCircle"
              onClick={handleNext}
              disabled={completing || !completionStatus.canComplete}
            >
              {completing ? 'Сохранение…' : 'Завершить урок'}
            </Button>
          ) : nextLessonInModule ? (
            <Button variant="primary" iconRight="arrowRight" onClick={handleNext}>
              Следующий урок
            </Button>
          ) : (
            <Button variant="primary" icon="map" onClick={() => navigate('/program')}>
              К программе
            </Button>
          )}
        </div>
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────

interface RendererProps {
  block: LessonBlockOut;
  practiceInitial?: PracticeResultState;
  quizInitial?: QuizResultOut;
  onPracticeResult?: (r: PracticeResultState) => void;
  onQuizResult?: (r: QuizResultOut) => void;
}

function BlockRenderer({
  block,
  practiceInitial,
  quizInitial,
  onPracticeResult,
  onQuizResult,
}: RendererProps) {
  return (
    <div className="anim-fade">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11.5,
          color: 'var(--ink-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 14,
        }}
      >
        <Icon name={BLOCK_ICON[block.type] ?? 'note'} size={12} />
        {BLOCK_LABEL[block.type] ?? block.type}
      </div>
      {block.type === 'text' && (
        <TextBlock data={block.data as { html?: string; markdown?: string; content?: string }} />
      )}
      {block.type === 'image' && (
        <ImageBlock data={block.data as { url: string; caption?: string }} />
      )}
      {block.type === 'video' && (
        <VideoBlock data={block.data as { url: string; title?: string }} />
      )}
      {block.type === 'practice' && (
        <PracticeBlock
          block={block}
          initialResult={practiceInitial}
          onResult={onPracticeResult}
        />
      )}
      {block.type === 'quiz' && (
        <QuizBlock block={block} initialResult={quizInitial} onResult={onQuizResult} />
      )}
    </div>
  );
}
