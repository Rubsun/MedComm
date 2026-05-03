import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mediaApi } from '@/api/media';

interface Props {
  data: { url?: string; title?: string };
  onSave: (data: Record<string, unknown>) => void;
}

export default function VideoBlockEditor({ data, onSave }: Props) {
  const [url, setUrl] = useState(data.url ?? '');
  const [title, setTitle] = useState(data.title ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const res = await mediaApi.upload(file);
      setUrl(res.data.url);
    } catch (err) {
      console.error('upload failed', err);
      setError('Не удалось загрузить файл (макс. 50 МБ, форматы mp4/webm)');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL видео (YouTube или /media/...)"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Загрузка…' : 'Загрузить'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f);
            e.target.value = '';
          }}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Заголовок (необязательно)"
      />
      <Button size="sm" onClick={() => onSave({ url, title })}>
        Сохранить
      </Button>
    </div>
  );
}
