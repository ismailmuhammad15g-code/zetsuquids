

"use client";

import { motion, useAnimationControls } from "framer-motion";
import React, { useCallback, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import { useDimensions } from "@/hooks/use-dimensions";
import { cn } from "@/lib/utils";

type PixelElement = HTMLElement & { __animatePixel?: () => void };

const PixelDot = React.memo(({ id, size, fadeDuration, delay, className }: { id: string; size: number; fadeDuration: number; delay: number; className?: string }) => {
  const controls = useAnimationControls();

  const animatePixel = useCallback(() => {
    controls.start({
      opacity: [1, 0],
      transition: { duration: fadeDuration / 1000, delay: delay / 1000 },
    });
  }, [controls, fadeDuration, delay]);

  // Attach the animatePixel function to the DOM element
  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        (node as any).__animatePixel = animatePixel;
      }
    },
    [animatePixel],
  );

  return (
    <motion.div
      id={id}
      ref={ref}
      className={cn(className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      initial={{ opacity: 0 }}
      animate={controls}
    />
  );
});

PixelDot.displayName = "PixelDot";

const PixelTrail = ({
  pixelSize = 20,
  fadeDuration = 500,
  delay = 0,
  className,
  pixelClassName,
}: {
  pixelSize?: number;
  fadeDuration?: number;
  delay?: number;
  className?: string;
  pixelClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dimensions = useDimensions(containerRef);
  // Use a stable ID for this trail instance
  const trailId = useRef(uuidv4());

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / pixelSize);
      const y = Math.floor((e.clientY - rect.top) / pixelSize);

      // Construct the likely ID of the pixel under the mouse
      const pixelElement = document.getElementById(
        `${trailId.current}-pixel-${x}-${y}`,
      );

      if (pixelElement) {
        // Call the animation method attached to the DOM element
        const animatePixel = (pixelElement as PixelElement).__animatePixel;
        if (animatePixel) animatePixel();
      }
    },
    [pixelSize],
  );

  const columns = useMemo(
    () => Math.ceil(dimensions.width / pixelSize),
    [dimensions.width, pixelSize],
  );
  const rows = useMemo(
    () => Math.ceil(dimensions.height / pixelSize),
    [dimensions.height, pixelSize],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-auto",
        className,
      )}
      onMouseMove={handleMouseMove}
    >
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <PixelDot
              key={`${colIndex}-${rowIndex}`}
              id={`${trailId.current}-pixel-${colIndex}-${rowIndex}`}
              size={pixelSize}
              fadeDuration={fadeDuration}
              delay={delay}
              className={pixelClassName}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default PixelTrail;
