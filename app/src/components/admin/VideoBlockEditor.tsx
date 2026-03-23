import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props { data: { url?: string; title?: string }; onSave: (data: Record<string, unknown>) => void }
export default function VideoBlockEditor({ data, onSave }: Props) {
  const [url, setUrl] = useState(data.url ?? '');
  const [title, setTitle] = useState(data.title ?? '');
  return (
    <div className="space-y-2">
      <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL видео (/media/...)" />
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Заголовок (необязательно)" />
      <Button size="sm" onClick={() => onSave({ url, title })}>Сохранить</Button>
    </div>
  );
}
