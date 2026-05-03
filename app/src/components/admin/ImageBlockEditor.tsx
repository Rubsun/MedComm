import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mediaApi } from '@/api/media';

interface Props {
  data: { url?: string; alt?: string; caption?: string };
  onSave: (data: Record<string, unknown>) => void;
}

export default function ImageBlockEditor({ data, onSave }: Props) {
  const [url, setUrl] = useState(data.url ?? '');
  const [alt, setAlt] = useState(data.alt ?? '');
  const [caption, setCaption] = useState(data.caption ?? '');
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
      setError('Не удалось загрузить файл (макс. 50 МБ, форматы jpg/png/webp)');
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
          placeholder="URL или /media/..."
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
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleUpload(f);
            e.target.value = '';
          }}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {url && (
        <img
          src={url}
          alt={alt}
          style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 6, marginTop: 4 }}
        />
      )}
      <Input
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        placeholder="Alt-текст для скринридеров"
      />
      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Подпись (необязательно)"
      />
      <Button size="sm" onClick={() => onSave({ url, alt, caption })}>
        Сохранить
      </Button>
    </div>
  );
}
