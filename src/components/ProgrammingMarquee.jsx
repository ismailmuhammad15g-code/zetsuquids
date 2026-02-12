import SimpleMarquee from "@/components/fancy/blocks/simple-marquee";
import { useRef } from "react";

// Programming/Tech related images
import img1 from "@/assets/mainimagesslite/1.png";
import img10 from "@/assets/mainimagesslite/10.png";
import img11 from "@/assets/mainimagesslite/11.png";
import img12 from "@/assets/mainimagesslite/12.png";
import img13 from "@/assets/mainimagesslite/13.png";
import img14 from "@/assets/mainimagesslite/14.png";
import img15 from "@/assets/mainimagesslite/15.png";
import img2 from "@/assets/mainimagesslite/2.png";
import img3 from "@/assets/mainimagesslite/3.png";
import img4 from "@/assets/mainimagesslite/4.png";
import img5 from "@/assets/mainimagesslite/5.png";
import img6 from "@/assets/mainimagesslite/6.png";
import img7 from "@/assets/mainimagesslite/7.png";
import img8 from "@/assets/mainimagesslite/8.png";
import img9 from "@/assets/mainimagesslite/9.png";

const programmingImages = [
  img1,
  img2,
  img3,
  img4,
  img5,
  img6,
  img7,
  img8,
  img9,
  img10,
  img11,
  img12,
  img13,
  img14,
  img15,
];

const MarqueeItem = ({ children }) => (
  <div className="mx-2 sm:mx-3 md:mx-4 hover:scale-105 cursor-pointer duration-300 ease-in-out">
    {children}
  </div>
);

export default function ProgrammingMarquee() {
  const firstThird = programmingImages.slice(
    0,
    Math.floor(programmingImages.length / 3),
  );
  const secondThird = programmingImages.slice(
    Math.floor(programmingImages.length / 3),
    Math.floor((2 * programmingImages.length) / 3),
  );
  const lastThird = programmingImages.slice(
    Math.floor((2 * programmingImages.length) / 3),
  );

  const container = useRef(null);

  return (
    <div
      className="flex w-full relative justify-center items-center flex-col overflow-hidden py-12 bg-black"
      ref={container}
    >
      <div className="w-full justify-center items-center flex flex-col space-y-4 md:space-y-6">
        <SimpleMarquee className="w-full" baseVelocity={1} slowdownOnHover>
          {firstThird.map((src, i) => (
            <MarqueeItem key={i}>
              <div className="h-40 w-64 md:h-52 md:w-80 rounded-xl overflow-hidden border border-white/10 relative group">
                <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <img
                  src={src}
                  alt={`Tech Image ${i}`}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 select-none pointer-events-none"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                />
              </div>
            </MarqueeItem>
          ))}
        </SimpleMarquee>

        <SimpleMarquee
          className="w-full"
          baseVelocity={1}
          direction="right"
          slowdownOnHover
        >
          {secondThird.map((src, i) => (
            <MarqueeItem key={i}>
              <div className="h-40 w-64 md:h-52 md:w-80 rounded-xl overflow-hidden border border-white/10 relative group">
                <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <img
                  src={src}
                  alt={`Tech Image ${i}`}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 select-none pointer-events-none"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                />
              </div>
            </MarqueeItem>
          ))}
        </SimpleMarquee>

        <SimpleMarquee className="w-full" baseVelocity={1} slowdownOnHover>
          {lastThird.map((src, i) => (
            <MarqueeItem key={i}>
              <div className="h-40 w-64 md:h-52 md:w-80 rounded-xl overflow-hidden border border-white/10 relative group">
                <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <img
                  src={src}
                  alt={`Tech Image ${i}`}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 select-none pointer-events-none"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable="false"
                />
              </div>
            </MarqueeItem>
          ))}
        </SimpleMarquee>
      </div>
    </div>
  );
}
