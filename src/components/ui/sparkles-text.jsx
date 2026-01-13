import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

const Sparkle = ({ style, color, size }) => (
    <svg
        className="absolute animate-sparkle pointer-events-none"
        style={style}
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
    >
        <path
            d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
            fill={color}
        />
    </svg>
);

const generateSparkle = (colors) => {
    return {
        id: Math.random(),
        createdAt: Date.now(),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 15 + 10,
        style: {
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            zIndex: 2,
        },
    };
};

export const SparklesText = ({
    children,
    className,
    sparklesCount = 10,
    colors = {
        first: "#A07CFE",
        second: "#FE8FB5",
    },
    ...props
}) => {
    const [sparkles, setSparkles] = useState([]);
    const colorsArray = [colors.first, colors.second];

    useEffect(() => {
        const generateInitialSparkles = () => {
            return Array.from({ length: sparklesCount }, () => generateSparkle(colorsArray));
        };
        setSparkles(generateInitialSparkles());

        const interval = setInterval(() => {
            setSparkles((currentSparkles) => {
                const now = Date.now();
                const filtered = currentSparkles.filter(
                    (sparkle) => now - sparkle.createdAt < 750
                );

                if (filtered.length < sparklesCount) {
                    return [...filtered, generateSparkle(colorsArray)];
                }
                return filtered;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [sparklesCount]);

    return (
        <span
            className={cn(
                "relative inline-block font-bold",
                className
            )}
            style={{
                color: '#ffffff',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                background: 'none',
                WebkitBackgroundClip: 'unset',
                WebkitTextFillColor: 'unset',
                backgroundClip: 'unset',
            }}
            {...props}
        >
            <span
                className="relative z-10"
                style={{
                    color: '#ffffff',
                    background: 'none',
                    WebkitBackgroundClip: 'unset',
                    WebkitTextFillColor: '#ffffff',
                }}
            >
                {children}
            </span>
            {sparkles.map((sparkle) => (
                <Sparkle
                    key={sparkle.id}
                    color={sparkle.color}
                    size={sparkle.size}
                    style={sparkle.style}
                />
            ))}
            <style>{`
                @keyframes sparkle {
                    0% {
                        opacity: 0;
                        transform: scale(0) rotate(0deg);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1) rotate(90deg);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0) rotate(180deg);
                    }
                }
                .animate-sparkle {
                    animation: sparkle 0.75s ease-in-out forwards;
                }
            `}</style>
        </span>
    );
};

export default SparklesText;
