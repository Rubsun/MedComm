interface VideoBlockData { url: string; title?: string }
export default function VideoBlock({ data }: { data: VideoBlockData }) {
  return (
    <div>
      {data.title && <p className="font-medium mb-2">{data.title}</p>}
      <video src={data.url} controls className="w-full rounded-lg" />
    </div>
  );
}
