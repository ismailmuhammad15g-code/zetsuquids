"use client";

import React from "react";
import { cn } from "../lib/utils";

interface TopLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  color?: string;
  height?: number;
  speed?: number;
  showSpinner?: boolean;
  easing?: string;
  minimum?: number;
  parent?: string;
  trickle?: boolean;
  trickleRate?: number;
  trickleSpeed?: number;
  zIndex?: number;
  progress?: number;
}

const TopLoader = React.forwardRef<HTMLDivElement, TopLoaderProps>(
  (
    {
      isLoading = false,
      color = "#33C3F0",
      height = 4,
      speed = 200,
      showSpinner = true,
      easing = "ease",
      minimum = 0.08,
      parent = "body",
      trickle = true,
      trickleRate = 0.02,
      trickleSpeed = 800,
      zIndex = 1031,
      progress,
      className,
      ...props
    },
    ref,
  ) => {
    void parent;
    const [mounted, setMounted] = React.useState(false);
    const [currentProgress, setCurrentProgress] = React.useState(0);
    const progressRef = React.useRef(0);
    const isStartedRef = React.useRef(false);
    const requestRef = React.useRef<number | null>(null);
    const loaderIdRef = React.useRef(
      `top-loader-${Math.random().toString(36).substring(2, 9)}`,
    );

    const styles = React.useMemo(
      () =>
        ({
          container: {
            pointerEvents: "none",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: `${height}px`,
            zIndex,
          } as React.CSSProperties,
          bar: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: color,
            boxShadow: `0 0 15px ${color}, 0 0 8px ${color}`,
            transition: `transform ${speed}ms ${easing}`,
            transform: `translate3d(-${100 - currentProgress * 100}%, 0, 0)`,
            zIndex,
          } as React.CSSProperties,
          spinner: {
            display: showSpinner ? "block" : "none",
            position: "fixed",
            top: "15px",
            right: "15px",
            width: "18px",
            height: "25px",
            boxSizing: "border-box",
            border: "solid 2px transparent",
            borderTopColor: color,
            borderLeftColor: color,
            borderRadius: "50%",
            animation: "top-loader-spinner 400ms linear infinite",
            zIndex,
          } as React.CSSProperties,
        }) satisfies {
          container: React.CSSProperties;
          bar: React.CSSProperties;
          spinner: React.CSSProperties;
        },
      [color, currentProgress, easing, height, showSpinner, speed, zIndex],
    );

    const clamp = (n: number, min: number, max: number): number => {
      if (n < min) return min;
      if (n > max) return max;
      return n;
    };

    const setProgress = React.useCallback(
      (n: number) => {
        const next = clamp(n, minimum, 1);
        progressRef.current = next;
        setCurrentProgress(next);

        if (next === 1) {
          window.setTimeout(() => {
            setCurrentProgress(0);
            isStartedRef.current = false;
          }, speed);
        } else {
          isStartedRef.current = true;
        }
      },
      [minimum, speed],
    );

    const inc = React.useCallback(
      (amount?: number) => {
        let n = progressRef.current;

        if (!isStartedRef.current) {
          setProgress(minimum);
          return;
        }

        const delta =
          typeof amount === "number"
            ? amount
            : (1 - n) * clamp(Math.random() * n, 0.1, 0.95);

        n = clamp(n + delta, 0, 0.994);
        setProgress(n);
      },
      [minimum, setProgress],
    );

    const trickleFunction = React.useCallback(() => {
      inc(trickleRate * Math.random());
    }, [inc, trickleRate]);

    React.useEffect(() => {
      if (!mounted) return;

      if (progress !== undefined) {
        setProgress(progress);
        return;
      }

      if (isLoading && trickle) {
        const tick = () => {
          if (!isLoading) return;
          trickleFunction();
          requestRef.current = window.setTimeout(() => {
            if (requestRef.current !== null) {
              tick();
            }
          }, trickleSpeed);
        };

        tick();

        return () => {
          if (requestRef.current !== null) {
            window.clearTimeout(requestRef.current);
            requestRef.current = null;
          }
        };
      }
    }, [
      isLoading,
      mounted,
      progress,
      setProgress,
      trickle,
      trickleFunction,
      trickleSpeed,
    ]);

    React.useEffect(() => {
      setMounted(true);

      const style = document.createElement("style");
      style.textContent = `\n      @keyframes top-loader-spinner {\n        0% { transform: rotate(0deg); }\n        100% { transform: rotate(360deg); }\n      }\n    `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
        if (requestRef.current !== null) {
          window.clearTimeout(requestRef.current);
        }
      };
    }, []);

    React.useEffect(() => {
      if (!mounted) return;

      if (isLoading) {
        if (currentProgress === 0) {
          setProgress(minimum);
        }
      } else if (currentProgress > 0) {
        setProgress(1);
      }
    }, [isLoading, mounted, currentProgress, minimum, setProgress]);

    if (!mounted) return null;
    if (!isLoading && currentProgress === 0) return null;

    return (
      <div
        id={loaderIdRef.current}
        ref={ref}
        className={cn("top-loader", className)}
        style={styles.container}
        {...props}
        role="progressbar"
        aria-busy={isLoading}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(currentProgress * 100)}
      >
        <div className="top-loader-bar" style={styles.bar} />
        {showSpinner && (
          <div className="top-loader-spinner" style={styles.spinner} />
        )}
      </div>
    );
  },
);

TopLoader.displayName = "TopLoader";

export { TopLoader };
