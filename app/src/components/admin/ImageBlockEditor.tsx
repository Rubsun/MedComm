import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props { data: { url?: string; caption?: string }; onSave: (data: Record<string, unknown>) => void }
export default function ImageBlockEditor({ data, onSave }: Props) {
  const [url, setUrl] = useState(data.url ?? '');
  const [caption, setCaption] = useState(data.caption ?? '');
  return (
    <div className="space-y-2">
      <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL изображения (/media/...)" />
      <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Подпись (необязательно)" />
      <Button size="sm" onClick={() => onSave({ url, caption })}>Сохранить</Button>
    </div>
  );
}
