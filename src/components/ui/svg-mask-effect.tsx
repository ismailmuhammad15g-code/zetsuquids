"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface MaskContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    revealText?: React.ReactNode;
    size?: number;
    revealSize?: number;
}

export const MaskContainer: React.FC<MaskContainerProps> = ({
    children,
    revealText,
    size = 10,
    revealSize = 600,
    className,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const handleMouseMove = (e: MouseEvent) => {
                const rect = container.getBoundingClientRect();
                setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            };
            container.addEventListener("mousemove", handleMouseMove);
            return () => {
                container.removeEventListener("mousemove", handleMouseMove);
            };
        }
    }, []);

    let maskSize = isHovered ? revealSize : size;

    return (
        <motion.div
            ref={containerRef}
            className={cn("relative h-screen", className)}
            animate={{
                backgroundColor: isHovered ? "var(--slate-900)" : "var(--white)",
            }}
        >
            <motion.div
                className="absolute flex h-full w-full items-center justify-center bg-black text-6xl text-white bg-grid-white/[0.2]"
                animate={{
                    maskPosition: `${(mousePosition.x ?? 0) - maskSize / 2}px ${(mousePosition.y ?? 0) - maskSize / 2}px`,
                    maskSize: `${maskSize}px`,
                }}
                transition={{
                    type: "tween",
                    ease: "backOut",
                    duration: 0.1,
                }}
                style={{
                    maskImage: 'url(/mask.svg)',
                    maskRepeat: 'no-repeat',
                }}
            >
                <div className="absolute inset-0 z-0 h-full w-full bg-black opacity-50" />
                <div
                    onMouseEnter={() => {
                        setIsHovered(true);
                    }}
                    onMouseLeave={() => {
                        setIsHovered(false);
                    }}
                    className="relative z-20 mx-auto max-w-4xl text-center text-4xl font-bold text-white"
                >
                    {children}
                </div>
            </motion.div>

            <div className="flex h-full w-full items-center justify-center text-white">
                {revealText}
            </div>
        </motion.div>
    );
};

export default MaskContainer;
