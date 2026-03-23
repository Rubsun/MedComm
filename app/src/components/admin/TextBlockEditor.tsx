import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Props { data: { content?: string }; onSave: (data: Record<string, unknown>) => void }
export default function TextBlockEditor({ data, onSave }: Props) {
  const [content, setContent] = useState(data.content ?? '');
  return (
    <div className="space-y-2">
      <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} placeholder="Текст урока..." />
      <Button size="sm" onClick={() => onSave({ content })}>Сохранить</Button>
    </div>
  );
}
