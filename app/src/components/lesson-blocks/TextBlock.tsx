interface TextBlockData { content: string }
export default function TextBlock({ data }: { data: TextBlockData }) {
  return (
    <div className="prose max-w-none text-slate-700 whitespace-pre-wrap">
      {data.content}
    </div>
  );
}
