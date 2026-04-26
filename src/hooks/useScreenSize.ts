import { useEffect, useState } from "react";

type BreakpointKey = "sm" | "md" | "lg" | "xl" | "2xl";

interface WindowSize {
    width: number;
    height: number;
}

interface ScreenSizeReturn {
    width: number;
    height: number;
    lessThan: (breakpoint: BreakpointKey) => boolean;
}

const breakpoints: Record<BreakpointKey, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
};

export default function useScreenSize(): ScreenSizeReturn {
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

    useEffect(() => {
        function handleResize(): void {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        // Add event listener
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return {
        width: windowSize.width,
        height: windowSize.height,
        lessThan: (breakpoint: BreakpointKey): boolean =>
            windowSize.width < breakpoints[breakpoint],
    };
}
