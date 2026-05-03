interface TextBlockData {
  html?: string;
  markdown?: string;
  content?: string;
}

export default function TextBlock({ data }: { data: TextBlockData }) {
  if (data.html) {
    return (
      <div
        className="prose max-w-none text-slate-700"
        dangerouslySetInnerHTML={{ __html: data.html }}
      />
    );
  }
  const text = data.markdown ?? data.content ?? '';
  return (
    <div className="prose max-w-none text-slate-700 whitespace-pre-wrap">{text}</div>
  );
}
