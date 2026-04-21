import SimpleMarquee from "@/components/fancy/blocks/simple-marquee";
import { ReactNode } from "react";

const programmingImages = [
  "https://picsum.photos/seed/zetsu-1/900/600",
  "https://picsum.photos/seed/zetsu-2/900/600",
  "https://picsum.photos/seed/zetsu-3/900/600",
  "https://picsum.photos/seed/zetsu-4/900/600",
  "https://picsum.photos/seed/zetsu-5/900/600",
  "https://picsum.photos/seed/zetsu-6/900/600",
  "https://picsum.photos/seed/zetsu-7/900/600",
  "https://picsum.photos/seed/zetsu-8/900/600",
  "https://picsum.photos/seed/zetsu-9/900/600",
  "https://picsum.photos/seed/zetsu-10/900/600",
  "https://picsum.photos/seed/zetsu-11/900/600",
  "https://picsum.photos/seed/zetsu-12/900/600",
  "https://picsum.photos/seed/zetsu-13/900/600",
  "https://picsum.photos/seed/zetsu-14/900/600",
  "https://picsum.photos/seed/zetsu-15/900/600",
];

interface MarqueeItemProps {
  children: ReactNode
}

const MarqueeItem = ({ children }: MarqueeItemProps) => (
  <div className="mx-2 sm:mx-3 md:mx-4 hover:scale-105 cursor-pointer duration-300 ease-in-out">
    {children}
  </div>
);

export default function ProgrammingMarquee() {
  const firstThird = programmingImages.slice(0, Math.floor(programmingImages.length / 3));
  const secondThird = programmingImages.slice(Math.floor(programmingImages.length / 3), Math.floor((2 * programmingImages.length) / 3));
  const lastThird = programmingImages.slice(Math.floor((2 * programmingImages.length) / 3));

  return (
    <div className="flex w-full relative justify-center items-center flex-col overflow-hidden py-12 bg-black">
      <div className="w-full justify-center items-center flex flex-col space-y-4 md:space-y-6">
        <SimpleMarquee className="w-full" baseVelocity={1} slowdownOnHover>
          {firstThird.map((src, i) => (
            <MarqueeItem key={i}>
              <div className="h-40 w-64 md:h-52 md:w-80 rounded-xl overflow-hidden border border-white/10 relative group">
                <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <img src={src} alt={`Tech Image ${i}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 select-none pointer-events-none" onContextMenu={(e) => e.preventDefault()} draggable="false" />
              </div>
            </MarqueeItem>
          ))}
        </SimpleMarquee>

        <SimpleMarquee className="w-full" baseVelocity={1} direction="right" slowdownOnHover>
          {secondThird.map((src, i) => (
            <MarqueeItem key={i}>
              <div className="h-40 w-64 md:h-52 md:w-80 rounded-xl overflow-hidden border border-white/10 relative group">
                <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <img src={src} alt={`Tech Image ${i}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 select-none pointer-events-none" onContextMenu={(e) => e.preventDefault()} draggable="false" />
              </div>
            </MarqueeItem>
          ))}
        </SimpleMarquee>

        <SimpleMarquee className="w-full" baseVelocity={1} slowdownOnHover>
          {lastThird.map((src, i) => (
            <MarqueeItem key={i}>
              <div className="h-40 w-64 md:h-52 md:w-80 rounded-xl overflow-hidden border border-white/10 relative group">
                <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <img src={src} alt={`Tech Image ${i}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 select-none pointer-events-none" onContextMenu={(e) => e.preventDefault()} draggable="false" />
              </div>
            </MarqueeItem>
          ))}
        </SimpleMarquee>
      </div>
    </div>
  );
}
