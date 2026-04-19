import { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface LinkPreviewProps extends React.HTMLAttributes<HTMLAnchorElement> {
    children?: React.ReactNode;
    url: string;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({
    children,
    url,
    className,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const linkRef = useRef<HTMLAnchorElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const getDomain = useCallback(() => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    }, [url]);

    const getFavicon = useCallback(() => {
        try {
            const urlObj = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
        } catch {
            return null;
        }
    }, [url]);

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const spaceAbove = rect.top;

        // Determine if tooltip should show above or below
        const showBelow = spaceAbove < 150;

        let left = rect.left + rect.width / 2;
        // Keep within viewport
        if (left < 160) left = 160;
        if (left > window.innerWidth - 160) left = window.innerWidth - 160;

        setTooltipStyle({
            left: `${left}px`,
            top: showBelow ? `${rect.bottom + 10}px` : `${rect.top - 10}px`,
        });
        
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 200);
    }, []);

    return (
        <>
            <a
                ref={linkRef}
                href={url}
                className={cn("relative", className)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
            {isHovered && (
                <div
                    className="fixed z-50 p-4 rounded-lg shadow-lg bg-white border border-slate-200 w-80"
                    style={tooltipStyle}
                    onMouseEnter={() => {
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    }}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="flex gap-2">
                        {getFavicon() && (
                            <img
                                src={getFavicon()!}
                                alt="favicon"
                                className="w-8 h-8 rounded"
                            />
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{getDomain()}</p>
                            <p className="text-xs text-slate-600">{url}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LinkPreview;
