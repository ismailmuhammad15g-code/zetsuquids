import { cn } from "../../lib/utils";

interface MeteorsProps {
    number?: number;
    className?: string;
}

export const Meteors: React.FC<MeteorsProps> = ({ number = 20, className }) => {
    const meteors = new Array(number).fill(true);
    const meteorStyle = (idx: number) => {
        // Deterministic values prevent server/client hydration mismatches.
        const left = ((idx * 97 + number * 13) % 801) - 400;
        const animationDelay = (((idx * 37 + number) % 60) / 100) + 0.2;
        const animationDuration = ((idx * 53 + number) % 8) + 2;

        return {
            top: 0,
            left: `${left}px`,
            animationDelay: `${animationDelay.toFixed(3)}s`,
            animationDuration: `${animationDuration}s`,
        };
    };

    return (
        <>
            {meteors.map((_, idx) => (
                <span
                    key={"meteor" + idx}
                    className={cn(
                        "animate-meteor-effect absolute h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
                        "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
                        className
                    )}
                    style={meteorStyle(idx)}
                ></span>
            ))}
        </>
    );
};

export default Meteors;
