import { cn } from "../../lib/utils";

export const ComicText = ({
    children,
    className,
    fontSize = 3,
    ...props
}) => {
    const sizeClasses = {
        1: "text-xl",
        2: "text-2xl",
        3: "text-3xl",
        4: "text-4xl",
        5: "text-5xl",
        6: "text-6xl"
    };

    return (
        <span
            className={cn(
                "comic-text font-black tracking-wider inline-block",
                sizeClasses[fontSize] || "text-3xl",
                className
            )}
            style={{
                fontFamily: '"Impact", "Arial Black", sans-serif',
                textShadow: `
                    2px 2px 0px #000,
                    -2px -2px 0px #000,
                    2px -2px 0px #000,
                    -2px 2px 0px #000
                `,
                color: '#ffffff',
                WebkitTextStroke: '1px #000',
                display: 'inline-block',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
            }}
            {...props}
        >
            {children}

            <style>{`
                .comic-text {
                    transition: transform 0.2s ease;
                }

                .comic-text:hover {
                    transform: scale(1.05);
                }
            `}</style>
        </span>
    );
};

export default ComicText;
