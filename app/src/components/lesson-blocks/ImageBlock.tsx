interface ImageBlockData { url: string; alt?: string; caption?: string }
export default function ImageBlock({ data }: { data: ImageBlockData }) {
  return (
    <figure>
      <img src={data.url} alt={data.alt ?? data.caption ?? ''} className="rounded-lg max-w-full" />
      {data.caption && (
        <figcaption className="text-sm text-slate-500 mt-2 text-center">{data.caption}</figcaption>
      )}
    </figure>
  );
}
