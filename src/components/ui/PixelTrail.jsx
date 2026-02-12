import { useEffect, useMemo, useRef, useState } from "react";

const PixelTrail = ({
  pixelSize = 24,
  fadeDuration = 500,
  pixelClassName = "bg-white",
  delay = 0,
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Recalculate grid only when dimensions change
  const { cols, rows } = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0)
      return { cols: 0, rows: 0 };
    return {
      cols: Math.ceil(dimensions.width / pixelSize),
      rows: Math.ceil(dimensions.height / pixelSize),
    };
  }, [dimensions, pixelSize]);

  // Create pixels structure
  // We don't need to render Pixel components with state, just plain divs with IDs for performance

  useEffect(() => {
    if (!containerRef.current || cols === 0) return;

    const handleMouseMove = (e) => {
      // Calculate which pixel we are over
      // We use client coordinates because the background is usually fixed/full screen
      // But better to be relative to container
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const col = Math.floor(x / pixelSize);
      const row = Math.floor(y / pixelSize);

      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        const pixelId = `pixel-${col}-${row}`;
        const element = document.getElementById(pixelId);
        if (element) {
          element.style.opacity = "0.35"; // Soft comfortable glow
          element.style.transition = "none";

          // Clear previous timeout if exists (optional optimization)
          // Set timeout to fade out
          clearTimeout(element.fadeTimeout);
          element.fadeTimeout = setTimeout(() => {
            element.style.opacity = "0";
            element.style.transition = `opacity ${fadeDuration}ms ease-out`;
          }, 0); // Start fading immediately in next tick or after small delay?
          // Actually logic in original was: set active=true (opacity high, transition none).
          // Then useEffect sets active=false after delay.
          // Here we just trigger the fade out trigger.
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cols, rows, pixelSize, fadeDuration]);

  if (!cols || !rows)
    return (
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: "hidden", zIndex: 0 }}
    >
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${pixelSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${pixelSize}px)`,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          return (
            <div
              key={`pixel-${col}-${row}`}
              id={`pixel-${col}-${row}`}
              className={pixelClassName}
              style={{
                opacity: 0,
                width: "100%",
                height: "100%",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PixelTrail;
