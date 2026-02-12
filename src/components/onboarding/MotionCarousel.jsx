import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Simple cn utility if not imported
function localCn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const MotionCarousel = ({ slides, options, className }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  return (
    <div className={localCn("relative group", className)}>
      <div className="overflow-hidden rounded-xl bg-background" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div className="min-w-0 flex-[0_0_100%] relative" key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: selectedIndex === index ? 1 : 0.5,
                  scale: selectedIndex === index ? 1 : 0.95,
                }}
                transition={{ duration: 0.4 }}
                className="p-1"
              >
                {slide}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={localCn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "bg-primary w-6 bg-blue-600"
                : "bg-gray-300",
            )}
            onClick={() => emblaApi && emblaApi.scrollTo(index)}
          />
        ))}
      </div>

      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
        onClick={scrollPrev}
        disabled={selectedIndex === 0}
      >
        <ChevronLeft className="w-5 h-5 text-gray-800" />
      </button>

      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
        onClick={scrollNext}
        disabled={selectedIndex === slides.length - 1}
      >
        <ChevronRight className="w-5 h-5 text-gray-800" />
      </button>
    </div>
  );
};
