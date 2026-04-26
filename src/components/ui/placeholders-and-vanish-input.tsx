import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface PlaceholdersAndVanishInputProps extends Omit<React.HTMLAttributes<HTMLFormElement>, 'onChange'> {
    placeholders: string[];
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    value?: string;
    disabled?: boolean;
    inputRef?: React.Ref<HTMLInputElement>;
    tools?: unknown;
}

export function PlaceholdersAndVanishInput({
    placeholders,
    onChange,
    onSubmit: propsOnSubmit,
    value,
    disabled,
    inputRef: externalRef,
    tools,
    ...props
}: PlaceholdersAndVanishInputProps) {
    const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
    const [animating, setAnimating] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
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
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [placeholders.length]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!inputValue.trim() || disabled) return;

        // Trigger vanish animation
        setAnimating(true);
        draw();

        setTimeout(() => {
            setAnimating(false);
            if (propsOnSubmit) propsOnSubmit(e);
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            {...props}
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
                    if (inputRef && 'current' in inputRef) {
                        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                    }
                    if (externalRef) {
                        if (typeof externalRef === 'function') {
                            externalRef(el);
                        } else if (externalRef && 'current' in externalRef) {
                            (externalRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                        }
                    }
                }}
                value={inputValue}
                onChange={handleChange}
                disabled={disabled}
                type="text"
                className={cn(
                    "w-full bg-transparent text-white placeholder:text-neutral-600 outline-none px-4 py-3",
                )}
                placeholder={placeholders[currentPlaceholder]}
            />
        </form>
    );
}

export default PlaceholdersAndVanishInput;
