import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonsApi } from '@/api/lessons';
import type { LessonBlockOut, LessonOut } from '@/types/api';
import BlockEditorPanel from '@/components/admin/BlockEditorPanel';
import { Badge, Button } from '@/components/medcomm';

export default function LessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lid = Number(lessonId);
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonOut | null>(null);
  const [blocks, setBlocks] = useState<LessonBlockOut[]>([]);

  const loadBlocks = useCallback(
    () =>
      lessonsApi
        .getBlocks(lid)
        .then((r) => setBlocks(r.data.sort((a, b) => a.sort_order - b.sort_order))),
    [lid],
  );

  useEffect(() => {
    void lessonsApi.get(lid).then((r) => setLesson(r.data));
    void loadBlocks();
  }, [lid, loadBlocks]);

  const handlePublish = async () => {
    await lessonsApi.publish(lid);
    const r = await lessonsApi.get(lid);
    setLesson(r.data);
  };

  if (!lesson) {
    return (
      <div style={{ padding: 24, fontSize: 13, color: 'var(--ink-500)' }}>Загрузка…</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 24px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface)',
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          icon="chevronLeft"
          onClick={() => navigate(-1)}
        >
          Назад
        </Button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-500)',
            }}
          >
            Редактор урока
          </div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--ink-900)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {lesson.title}
          </h1>
        </div>
        {lesson.is_published ? (
          <Badge tone="success" size="sm" dot>
            Опубликован
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            Черновик
          </Badge>
        )}
        <Button
          variant={lesson.is_published ? 'secondary' : 'primary'}
          size="sm"
          icon={lesson.is_published ? 'eyeOff' : 'eye'}
          onClick={handlePublish}
        >
          {lesson.is_published ? 'Снять с публикации' : 'Опубликовать'}
        </Button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 24,
          background: 'var(--bg)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <BlockEditorPanel lessonId={lid} blocks={blocks} onBlocksChange={loadBlocks} />
        </div>
      </div>
    </div>
  );
}
