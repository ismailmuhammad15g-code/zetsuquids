import React, { useRef } from "react"
import SimpleMarquee from "@/components/fancy/blocks/simple-marquee"

// Programming/Tech related images
const programmingImages = [
  "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=800&auto=format&fit=crop", // Coding code
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop", // Code screen
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop", // Laptop code
  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop", // Code syntax
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop", // Server room
  "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=800&auto=format&fit=crop", // Meeting tech
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop", // Matrix binary
  "https://images.unsplash.com/photo-1531297461136-82088fd53dc3?q=80&w=800&auto=format&fit=crop", // Macbook
  "https://images.unsplash.com/photo-1607799275518-d58665d099db?q=80&w=800&auto=format&fit=crop", // Keyboard
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop", // Code coffee
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=800&auto=format&fit=crop", // Code conference
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop", // Team working
  "https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=800&auto=format&fit=crop", // Code abstract
  "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?q=80&w=800&auto=format&fit=crop", // Server lights
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop", // Chip
]

const MarqueeItem = ({ children }) => (
  <div className="mx-2 sm:mx-3 md:mx-4 hover:scale-105 cursor-pointer duration-300 ease-in-out">
    {children}
  </div>
)

export default function ProgrammingMarquee() {
  const firstThird = programmingImages.slice(
    0,
    Math.floor(programmingImages.length / 3)
  )
  const secondThird = programmingImages.slice(
    Math.floor(programmingImages.length / 3),
    Math.floor((2 * programmingImages.length) / 3)
  )
  const lastThird = programmingImages.slice(
    Math.floor((2 * programmingImages.length) / 3)
  )

  const container = useRef(null)

  return (
    <div
      className="flex w-full relative justify-center items-center flex-col overflow-hidden py-12 bg-black"
      ref={container}
    >
      <div className="w-full justify-center items-center flex flex-col space-y-4 md:space-y-6">
        <SimpleMarquee
          className="w-full"
          baseVelocity={1}
          slowdownOnHover
        >
          {firstThird.map((src, i) => (
            <MarqueeItem key={i}>
              <div className="h-40 w-64 md:h-52 md:w-80 rounded-xl overflow-hidden border border-white/10 relative group">
                 <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                 <img
                    src={src}
                    alt={`Tech Image ${i}`}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
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
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                 />
              </div>
            </MarqueeItem>
          ))}
        </SimpleMarquee>

        <SimpleMarquee
          className="w-full"
          baseVelocity={1}
          slowdownOnHover
        >
          {lastThird.map((src, i) => (
            <MarqueeItem key={i}>
              <div className="h-40 w-64 md:h-52 md:w-80 rounded-xl overflow-hidden border border-white/10 relative group">
                 <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                 <img
                    src={src}
                    alt={`Tech Image ${i}`}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                 />
              </div>
            </MarqueeItem>
          ))}
        </SimpleMarquee>
      </div>
    </div>
  );
}
