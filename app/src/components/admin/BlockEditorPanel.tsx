import { useState } from 'react';
import type { ReactNode } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { lessonsApi } from '@/api/lessons';
import type { LessonBlockOut } from '@/types/api';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import TextBlockEditor from './TextBlockEditor';
import ImageBlockEditor from './ImageBlockEditor';
import VideoBlockEditor from './VideoBlockEditor';
import PracticeBlockEditor from './PracticeBlockEditor';
import QuizBlockEditor from './QuizBlockEditor';

const BLOCK_TYPES = [
  { type: 'text', label: 'Текст' },
  { type: 'image', label: 'Изображение' },
  { type: 'video', label: 'Видео' },
  { type: 'practice', label: 'Практика' },
  { type: 'quiz', label: 'Тест' },
] as const;

function SortableBlock({
  block, onDelete, onSave,
}: {
  block: LessonBlockOut;
  lessonId: number;
  onDelete: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const [expanded, setExpanded] = useState(false);
  const style = { transform: CSS.Transform.toString(transform), transition };

  const editors: Record<string, ReactNode> = {
    text: <TextBlockEditor data={block.data as { content?: string }} onSave={onSave} />,
    image: <ImageBlockEditor data={block.data as { url?: string; caption?: string }} onSave={onSave} />,
    video: <VideoBlockEditor data={block.data as { url?: string; title?: string }} onSave={onSave} />,
    practice: <PracticeBlockEditor
      data={block.data as {
        answer_mode?: 'single' | 'multiple';
        situation?: string;
        goal?: string;
        explanation?: string;
        options?: Array<{ id: string; text: string; is_correct: boolean; feedback: string }>;
        patient?: { name: string; age: number; complaint: string };
      }}
      onSave={onSave}
    />,
    quiz: <QuizBlockEditor
      data={block.data as {
        passing_score?: number;
        max_attempts?: number;
        questions?: Array<{
          id: string;
          type: 'single_choice' | 'multiple_choice';
          text: string;
          points: number;
          options: Array<{ id: string; text: string }>;
          correct_option_ids: string[];
          explanation: string;
        }>;
      }}
      onSave={onSave}
    />,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded bg-white">
      <div className="flex items-center gap-2 p-3">
        <button {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600">
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium flex-1 capitalize">{block.type}</span>
        <Button size="icon" variant="ghost" onClick={() => setExpanded(x => !x)}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
      {expanded && <div className="p-3 border-t">{editors[block.type]}</div>}
    </div>
  );
}

export default function BlockEditorPanel({
  lessonId, blocks, onBlocksChange,
}: {
  lessonId: number;
  blocks: LessonBlockOut[];
  onBlocksChange: () => void;
}) {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex(b => b.id === active.id);
    const newIndex = blocks.findIndex(b => b.id === over.id);
    const reordered = arrayMove(blocks, oldIndex, newIndex);

    await Promise.all(reordered.map((b, i) =>
      lessonsApi.updateBlock(lessonId, b.id, { sort_order: i })
    ));
    onBlocksChange();
  };

  const handleAddBlock = async (type: string) => {
    await lessonsApi.createBlock(lessonId, {
      type,
      sort_order: blocks.length,
      data: {},
    });
    onBlocksChange();
  };

  const handleDelete = async (blockId: number) => {
    if (!confirm('Удалить блок?')) return;
    await lessonsApi.deleteBlock(lessonId, blockId);
    onBlocksChange();
  };

  const handleSave = async (blockId: number, data: Record<string, unknown>) => {
    await lessonsApi.updateBlock(lessonId, blockId, { data });
    onBlocksChange();
  };

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-2">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map(block => (
              <SortableBlock
                key={block.id}
                block={block}
                lessonId={lessonId}
                onDelete={() => handleDelete(block.id)}
                onSave={(data) => handleSave(block.id, data)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {blocks.length === 0 && (
          <div className="text-center text-slate-400 py-12 border-2 border-dashed rounded-lg">
            Добавьте блоки урока справа
          </div>
        )}
      </div>

      <div className="w-40 space-y-2">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Добавить блок</div>
        {BLOCK_TYPES.map(({ type, label }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleAddBlock(type)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
