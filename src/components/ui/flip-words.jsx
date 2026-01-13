import { useCallback, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export const FlipWords = ({
    words,
    duration = 3000,
    className,
}) => {
    const [currentWord, setCurrentWord] = useState(words[0]);
    const [isAnimating, setIsAnimating] = useState(false);

    const startAnimation = useCallback(() => {
        const word = words[words.indexOf(currentWord) + 1] || words[0];
        setCurrentWord(word);
        setIsAnimating(true);
    }, [currentWord, words]);

    useEffect(() => {
        if (!isAnimating) {
            const timeout = setTimeout(() => {
                startAnimation();
            }, duration);
            return () => clearTimeout(timeout);
        }
    }, [isAnimating, duration, startAnimation]);

    return (
        <span
            className={cn(
                "inline-block relative",
                className
            )}
            style={{ minWidth: '200px' }}
        >
            <span
                className={cn(
                    "inline-block transition-all duration-500 ease-in-out",
                    isAnimating ? "opacity-0 blur-sm -translate-y-2" : "opacity-100 blur-0 translate-y-0"
                )}
                onTransitionEnd={() => setIsAnimating(false)}
            >
                {currentWord}
            </span>
        </span>
    );
};

export default FlipWords;
