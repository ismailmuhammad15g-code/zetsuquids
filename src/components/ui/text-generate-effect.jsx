import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

// Function to detect Arabic text - improved detection
const isArabicText = (text) => {
    if (!text) return false;
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const arabicMatches = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
    const latinMatches = (text.match(/[a-zA-Z]/g) || []).length;
    return arabicMatches > latinMatches * 0.3;
};

// Function to clean text - DO NOT break Arabic characters
const cleanText = (text) => {
    if (!text) return "";

    // Only clean multiple spaces and trim - DO NOT add spaces between Arabic characters
    let cleaned = text
        .replace(/\s+/g, ' ')
        .trim();

    return cleaned;
};

export const TextGenerateEffect = ({
    words,
    className,
    filter = true,
    duration = 0.5,
    onComplete,
}) => {
    const [displayText, setDisplayText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const cleanedText = cleanText(words);
    const isRtl = isArabicText(cleanedText);

    useEffect(() => {
        setDisplayText("");
        setIsComplete(false);

        if (!cleanedText || cleanedText.length === 0) {
            setIsComplete(true);
            if (onComplete) onComplete();
            return;
        }

        let currentIndex = 0;
        const textLength = cleanedText.length;

        // Use character-by-character animation for smooth text reveal
        const interval = setInterval(() => {
            if (currentIndex < textLength) {
                // Add multiple characters at once for smoother animation
                const chunkSize = Math.min(3, textLength - currentIndex);
                currentIndex += chunkSize;
                setDisplayText(cleanedText.substring(0, currentIndex));
            } else {
                clearInterval(interval);
                setIsComplete(true);
                if (onComplete) {
                    setTimeout(onComplete, 100);
                }
            }
        }, 15);

        return () => clearInterval(interval);
    }, [cleanedText, onComplete]);

    return (
        <div
            className={cn("font-normal", className)}
            style={{
                direction: isRtl ? 'rtl' : 'ltr',
                textAlign: isRtl ? 'right' : 'left',
                fontFamily: isRtl ? '"Segoe UI", system-ui, -apple-system, sans-serif' : 'inherit',
            }}
        >
            <div className="leading-relaxed">
                <span
                    className="animate-text-fade-in"
                    style={{
                        opacity: 1,
                    }}
                >
                    {displayText}
                </span>
                {!isComplete && (
                    <span className="typing-cursor">|</span>
                )}
            </div>

            <style>{`
                @keyframes text-fade-in {
                    from {
                        opacity: 0.7;
                    }
                    to {
                        opacity: 1;
                    }
                }
                .typing-cursor {
                    display: inline-block;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 300;
                    margin-left: 2px;
                    animation: cursor-blink 0.8s ease-in-out infinite;
                }
                @keyframes cursor-blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default TextGenerateEffect;
