import Image from 'next/image';

interface LoadingProps {
  size?: number;
  text?: string;
  fullScreen?: boolean;
}

export default function Loading({ size = 64, text, fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Image
        src="/gif/loading.gif"
        alt="Loading..."
        width={size}
        height={size}
        unoptimized
        priority
        className="block"
      />
      {text && <p className="text-[#636e72] text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex justify-center items-center py-24">
        {content}
      </div>
    );
  }

  return content;
}
