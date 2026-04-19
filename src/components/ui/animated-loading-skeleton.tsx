import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

const AnimatedLoadingSkeleton: React.FC = () => {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024,
    );
    const controls = useAnimation();

    const getGridConfig = (width: number) => {
        const numCards = 6;
        const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
        return {
            numCards,
            cols,
            xBase: 40,
            yBase: 60,
            xStep: 210,
            yStep: 230,
        };
    };

    const generateSearchPath = (config: ReturnType<typeof getGridConfig>) => {
        const { numCards, cols, xBase, yBase, xStep, yStep } = config;
        const rows = Math.ceil(numCards / cols);
        let allPositions: Array<{ x: number; y: number }> = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (row * cols + col < numCards) {
                    allPositions.push({
                        x: xBase + col * xStep,
                        y: yBase + row * yStep,
                    });
                }
            }
        }

        const shuffledPositions = allPositions.sort(() => Math.random() - 0.5);

        // Ensure loop completion by adding the starting position
        if (shuffledPositions.length > 0) {
            shuffledPositions.push(shuffledPositions[0]);
        }

        return {
            x: shuffledPositions.map((pos) => pos.x),
            y: shuffledPositions.map((pos) => pos.y),
            scale: Array(shuffledPositions.length).fill(1.2),
            transition: {
                duration: shuffledPositions.length * 2,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1] as const,
                times: shuffledPositions.map(
                    (_, i) => i / (shuffledPositions.length - 1),
                ),
            },
        };
    };

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const config = getGridConfig(windowWidth);
        // Only run animation if we have positions
        controls.start(generateSearchPath(config));
    }, [windowWidth, controls]);

    const frameVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    };

    return (
        <motion.div variants={frameVariants} initial="hidden" animate="visible">
            <div className="grid gap-4">
                {/* Placeholder cards */}
            </div>
        </motion.div>
    );
};

export default AnimatedLoadingSkeleton;
