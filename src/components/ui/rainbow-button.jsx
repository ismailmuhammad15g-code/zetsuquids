import { cn } from "../../lib/utils";

export const RainbowButton = ({
    children,
    className,
    onClick,
    ...props
}) => {
    return (
        <button
            className={cn(
                "group relative inline-flex h-11 animate-rainbow cursor-pointer items-center justify-center rounded-xl border-0 bg-[length:200%] px-8 py-2 font-medium text-primary-foreground transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent]",
                "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]",
                "bg-[linear-gradient(#121213,#121213),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] dark:bg-[linear-gradient(#000,#000),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
                className
            )}
            onClick={onClick}
            {...props}
            style={{
                '--color-1': '271 81% 56%',    // Purple
                '--color-2': '291 95% 73%',    // Pink
                '--color-3': '334 87% 75%',    // Pink-red
                '--color-4': '213 88% 70%',    // Blue
                '--color-5': '217 91% 60%',    // Light blue
            }}
        >
            {children}

            <style>{`
                @keyframes rainbow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .animate-rainbow {
                    animation: rainbow 3s ease infinite;
                }

                .animate-rainbow:before {
                    animation: rainbow 3s ease infinite;
                }
            `}</style>
        </button>
    );
};

export default RainbowButton;
