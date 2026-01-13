import { cn } from "../../lib/utils";

export const ShimmerButton = ({
    children,
    className,
    onClick,
    ...props
}) => {
    return (
        <button
            className={cn(
                "inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50",
                className
            )}
            onClick={onClick}
            {...props}
        >
            {children}

            <style>{`
                @keyframes shimmer {
                    from {
                        background-position: 0 0;
                    }
                    to {
                        background-position: -200% 0;
                    }
                }

                .animate-shimmer {
                    animation: shimmer 2s ease-in-out infinite;
                }
            `}</style>
        </button>
    );
};

export default ShimmerButton;
