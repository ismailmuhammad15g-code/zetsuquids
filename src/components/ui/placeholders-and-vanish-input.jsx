import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export function PlaceholdersAndVanishInput({
    placeholders,
    onChange,
    onSubmit,
    value,
    disabled,
    inputRef: externalRef,
}) {
    const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
    const [animating, setAnimating] = useState(false);
    const intervalRef = useRef(null);
    const canvasRef = useRef(null);
    const inputRef = useRef(null);
    const [inputValue, setInputValue] = useState(value || "");

    // Sync with external value
    useEffect(() => {
        setInputValue(value || "");
    }, [value]);

    // Rotate placeholders
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(intervalRef.current);
    }, [placeholders.length]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || disabled) return;

        // Trigger vanish animation
        setAnimating(true);
        draw();

        setTimeout(() => {
            setAnimating(false);
            if (onSubmit) onSubmit(e);
        }, 500);
    };

    const draw = useCallback(() => {
        if (!inputRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = 800;
        canvas.height = 800;
        ctx.clearRect(0, 0, 800, 800);

        const computedStyles = getComputedStyle(inputRef.current);
        const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));

        ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(inputValue, 16, 40);
    }, [inputValue]);

    const handleChange = (e) => {
        setInputValue(e.target.value);
        if (onChange) onChange(e);
    };

    return (
        <form
            className={cn(
                "w-full relative bg-zinc-900 rounded-2xl overflow-hidden shadow-[0px_0px_1px_1px_rgba(255,255,255,0.1)] transition duration-300",
                inputValue && "bg-zinc-800"
            )}
            onSubmit={handleSubmit}
        >
            <canvas
                className={cn(
                    "absolute pointer-events-none text-base transform scale-50 top-[20%] left-2 origin-top-left filter invert pr-20",
                    animating ? "opacity-100" : "opacity-0"
                )}
                ref={canvasRef}
            />
            <input
                ref={(el) => {
                    inputRef.current = el;
                    if (externalRef) {
                        if (typeof externalRef === 'function') {
                            externalRef(el);
                        } else {
                            externalRef.current = el;
                        }
                    }
                }}
                value={inputValue}
                onChange={handleChange}
                disabled={disabled}
                type="text"
                className={cn(
                    "w-full relative text-base z-10 border-none bg-transparent text-white h-14 rounded-2xl focus:outline-none focus:ring-0 pl-5 pr-14",
                    animating && "text-transparent"
                )}
                style={{
                    caretColor: "white"
                }}
            />

            <button
                disabled={!inputValue.trim() || disabled}
                type="submit"
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 h-9 w-9 rounded-full disabled:bg-zinc-700 bg-white transition duration-200 flex items-center justify-center disabled:opacity-50"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-black h-5 w-5"
                >
                    <path d="m5 12 7-7 7 7" />
                    <path d="M12 19V5" />
                </svg>
            </button>

            <div className="absolute inset-0 flex items-center rounded-2xl pointer-events-none">
                <div
                    className={cn(
                        "pl-5 text-base font-normal text-zinc-500 transition-all duration-500",
                        inputValue && "opacity-0"
                    )}
                >
                    <span
                        key={`placeholder-${currentPlaceholder}`}
                        className="animate-placeholder-fade"
                    >
                        {placeholders[currentPlaceholder]}
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes placeholder-fade {
                    0% {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    10% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    90% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                }
                .animate-placeholder-fade {
                    display: inline-block;
                    animation: placeholder-fade 3s ease-in-out;
                }
            `}</style>
        </form>
    );
}

export default PlaceholdersAndVanishInput;
