/*Ensure you had installed the package
or read our installation document. (go to lightswind.com/components/Installation)
npm i lightswind@latest*/

"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

type Direction = "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top";
type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
type Weight = "normal" | "medium" | "semibold" | "bold" | "extrabold";
type GradientType = "linear" | "radial";
type Repeat = "infinite" | number;

interface ShinyTextProps {
  children: ReactNode;
  disabled?: boolean;
  speed?: number;
  className?: string;
  size?: Size;
  weight?: Weight;
  baseColor?: string;
  shineColor?: string;
  intensity?: number;
  direction?: Direction;
  shineWidth?: number;
  delay?: number;
  repeat?: Repeat;
  pauseOnHover?: boolean;
  gradientType?: GradientType;
}

export function ShinyText({
  children,
  disabled = false,
  speed = 3,
  className,
  size = "base",
  weight = "medium",
  baseColor,
  shineColor,
  intensity = 1,
  direction = "left-to-right",
  shineWidth = 0,
  delay = 0,
  repeat = "infinite",
  pauseOnHover = false,
  gradientType = "linear",
}: ShinyTextProps) {
  const directionConfig: Record<Direction, { backgroundPosition: string[]; backgroundSize: string }> = {
    "left-to-right": {
      backgroundPosition: ["100% 0%", "-100% 0%"],
      backgroundSize: "200% 100%",
    },
    "right-to-left": {
      backgroundPosition: ["-100% 0%", "100% 0%"],
      backgroundSize: "200% 100%",
    },
    "top-to-bottom": {
      backgroundPosition: ["0% 100%", "0% -100%"],
      backgroundSize: "100% 200%",
    },
    "bottom-to-top": {
      backgroundPosition: ["0% -100%", "0% 100%"],
      backgroundSize: "100% 200%",
    },
  };

  const sizeClasses: Record<Size, string> = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
  };

  const weightClasses: Record<Weight, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
  };

  const config = directionConfig[direction] || directionConfig["left-to-right"];

  const gradientDirection =
    direction === "left-to-right" || direction === "right-to-left"
      ? "90deg"
      : direction === "top-to-bottom"
        ? "180deg"
        : "0deg";

  const defaultBaseColor = "hsl(var(--foreground)/20)";
  const defaultShineColor = "hsl(var(--primary)/20)";

  const finalBaseColor = baseColor || defaultBaseColor;
  const finalShineColor = shineColor || defaultShineColor;

  const createGradient = () => {
    const transparentStartPos = Math.max(0, 50 - shineWidth / 2);
    const transparentEndPos = Math.min(100, 50 + shineWidth / 2);

    const shineStart = `${finalShineColor} ${transparentStartPos}%`;
    const shineEnd = `${finalShineColor} ${transparentEndPos}%`;

    return gradientType === "linear"
      ? `linear-gradient(${gradientDirection}, ${finalBaseColor}, transparent ${transparentStartPos - 5}%, ${shineStart}, ${shineEnd}, transparent ${transparentEndPos + 5}%, ${finalBaseColor})`
      : `radial-gradient(ellipse at center, ${finalShineColor} ${intensity * 100}%, transparent)`;
  };

  const animationVariants = {
    initial: {
      backgroundPosition: config.backgroundPosition[0],
    },
    animate: disabled
      ? {
          backgroundPosition: config.backgroundPosition[0],
          transition: { duration: 0, delay: 0, repeat: 0, ease: "linear" as const },
        }
      : {
          backgroundPosition: config.backgroundPosition[1],
          transition: {
            duration: speed,
            delay,
            repeat: typeof repeat === "number" ? repeat : Infinity,
            ease: "linear" as const,
          },
        },
    hover: pauseOnHover ? {} : {},
  };

  if (disabled) {
    return (
      <span
        className={cn(
          "inline-block",
          sizeClasses[size],
          weightClasses[weight],
          "text-foreground",
          className,
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <motion.span
      className={cn(
        "bg-clip-text text-transparent inline-block",
        sizeClasses[size],
        weightClasses[weight],
        className,
      )}
      style={{
        backgroundImage: createGradient(),
        backgroundSize: config.backgroundSize,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        opacity: intensity,
      } as React.CSSProperties}
      variants={animationVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {children}
    </motion.span>
  );
}

export default ShinyText;
