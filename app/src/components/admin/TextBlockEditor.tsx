import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Props {
  data: { html?: string; content?: string; markdown?: string };
  onSave: (data: Record<string, unknown>) => void;
}

export default function TextBlockEditor({ data, onSave }: Props) {
  const [html, setHtml] = useState(data.html ?? data.content ?? data.markdown ?? '');
  return (
    <div className="space-y-2">
      <Textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        rows={10}
        placeholder="HTML урока (поддерживаются <p>, <h2>, <ul>, <li>, <strong>, <em> и т.д.)"
      />
      <Button size="sm" onClick={() => onSave({ html })}>
        Сохранить
      </Button>
    </div>
  );
}
