"use client";
import { useMemo } from "react";

type FireworksBackgroundProps = {
  className?: string;
  color?: string;
  population?: number;
};

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

export function FireworksBackground({
  className,
  color = "white",
  population = 16,
}: FireworksBackgroundProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: population }, (_, index) => ({
        id: index,
        left: `${randomBetween(10, 90).toFixed(2)}%`,
        top: `${randomBetween(15, 85).toFixed(2)}%`,
        size: `${randomBetween(5, 16).toFixed(2)}px`,
        duration: `${randomBetween(1.4, 2.8).toFixed(2)}s`,
        delay: `${randomBetween(0, 2).toFixed(2)}s`,
        blur: `${randomBetween(0, 4).toFixed(2)}px`,
        spread: `${randomBetween(24, 78).toFixed(2)}px`,
      })),
    [population],
  );

  return (
    <div className={className} style={{ position: "relative", overflow: "hidden" }}>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="firework-spark"
          style={{
            position: "absolute",
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            background: color,
            borderRadius: "999px",
            filter: `blur(${particle.blur})`,
            opacity: 0,
            boxShadow: `0 0 ${particle.spread} ${color}`,
            animation: `firework-pop ${particle.duration} ease-in-out ${particle.delay} infinite`,
          }}
        />
      ))}

      <div
        className="firework-glow"
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 20%, ${color}22, transparent 24%), radial-gradient(circle at 15% 70%, ${color}12, transparent 16%), radial-gradient(circle at 85% 65%, ${color}18, transparent 20%)`,
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes firework-pop {
          0% {
            transform: scale(0.1);
            opacity: 0;
          }
          25% {
            opacity: 0.85;
            transform: scale(1.2);
          }
          60% {
            opacity: 0.35;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.4);
          }
        }

        .firework-spark::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0.7;
          box-shadow: inherit;
        }
      `}</style>
    </div>
  );
}
