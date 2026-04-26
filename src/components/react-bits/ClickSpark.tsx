import type { MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

type EasingMode = "linear" | "ease-in" | "ease-in-out" | "ease-out";

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: EasingMode;
  extraScale?: number;
  children?: ReactNode;
}

const ClickSpark = ({
  sparkColor = "#fff",
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1.0,
  children,
}: ClickSparkProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<Spark[]>([]); // Stores active sparks
  const startTimeRef = useRef<number | null>(null); // Used for global timer if needed, but we use individual spark start times

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;

    const resizeCanvas = () => {
      // Use window dimensions if we want full screen, or parent dimensions
      // For a global effect, capturing the window size is often safer if the parent isn't reliable
      const { width, height } = parent.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const handleResize = () => {
      if (resizeTimeout !== undefined) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(parent);

    resizeCanvas();

    return () => {
      ro.disconnect();
      if (resizeTimeout !== undefined) {
        clearTimeout(resizeTimeout);
      }
    };
  }, []);

  const easeFunc = useCallback(
    (t: number): number => {
      switch (easing) {
        case "linear":
          return t;
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;

    const draw = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

      // Filter out expired sparks AND draw active ones
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;

        // If finished, remove
        if (elapsed >= duration) {
          return false;
        }

        const progress = elapsed / duration;
        const eased = easeFunc(progress);

        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        // Calculate points
        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        // Draw
        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        return true;
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    sparkColor,
    sparkSize,
    sparkRadius,
    sparkCount,
    duration,
    easeFunc,
    extraScale,
  ]);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    // We want to handle clicks on the container
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get click position relative to the canvas/container
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = performance.now();
    // Create new sparks
    const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount, // Distribute in a circle
      startTime: now,
    }));

    sparksRef.current.push(...newSparks);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh", // Ensure it covers viewport
        isolation: "isolate", // Create new stacking context
      }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          userSelect: "none",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none", // Allow clicks to pass through to canvas but visual only
          zIndex: 99999, // On top of everything
        }}
      />
      {children}
    </div>
  );
};

export default ClickSpark;
