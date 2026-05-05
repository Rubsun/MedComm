import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { lessonsApi } from '@/api/lessons';
import type { LessonBlockOut, LessonOut } from '@/types/api';
import BlockEditorPanel from '@/components/admin/BlockEditorPanel';
import { Badge, Button, ToastViewport, useToasts } from '@/components/medcomm';

export default function LessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lid = Number(lessonId);
  const navigate = useNavigate();
  const { toasts, push: toast, dismiss } = useToasts();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lesson, setLesson] = useState<LessonOut | null>(null);
  const [blocks, setBlocks] = useState<LessonBlockOut[]>([]);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

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

  const handleExport = async () => {
    if (!lesson) return;
    setBusy('export');
    try {
      const res = await lessonsApi.exportDocx(lid);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lesson-${lesson.slug || lesson.id}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      toast({ message: 'Не удалось выгрузить .docx', icon: 'warning', color: 'var(--danger)' });
    } finally {
      setBusy(null);
    }
  };

  const triggerImport = () => fileInputRef.current?.click();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('import');
    try {
      const res = await lessonsApi.importDocx(lid, file);
      const { updated, created, skipped_placeholder } = res.data;
      toast({
        message: `Импорт завершён: обновлено ${updated}, создано ${created}, пропущено ${skipped_placeholder}`,
        icon: 'check',
      });
      await loadBlocks();
    } catch (err) {
      let detail = 'Не удалось импортировать .docx';
      if (isAxiosError(err) && err.response?.data?.detail) {
        detail = String(err.response.data.detail);
      }
      console.error('Import failed', err);
      toast({ message: detail, icon: 'warning', color: 'var(--danger)' });
    } finally {
      setBusy(null);
    }
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
          variant="secondary"
          size="sm"
          icon="download"
          onClick={handleExport}
          disabled={busy !== null}
        >
          {busy === 'export' ? 'Готовим…' : 'Скачать .docx'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon="upload"
          onClick={triggerImport}
          disabled={busy !== null}
        >
          {busy === 'import' ? 'Загрузка…' : 'Загрузить .docx'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
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
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
