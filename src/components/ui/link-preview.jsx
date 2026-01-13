import { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export const LinkPreview = ({
    children,
    url,
    className,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const linkRef = useRef(null);
    const timeoutRef = useRef(null);

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

    const handleMouseEnter = useCallback((e) => {
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
            transform: showBelow ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
        });

        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 150);
    }, []);

    return (
        <>
            <a
                ref={linkRef}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors cursor-pointer",
                    className
                )}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </a>

            {isHovered && (
                <div
                    className="link-preview-tooltip"
                    style={{
                        position: 'fixed',
                        ...tooltipStyle,
                        zIndex: 2147483647,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        style={{
                            width: '300px',
                            background: '#0f0f0f',
                            borderRadius: '12px',
                            border: '1px solid #333',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Top bar */}
                        <div style={{
                            height: '3px',
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
                        }} />

                        <div style={{ padding: '14px 16px' }}>
                            {/* Domain row */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '10px',
                            }}>
                                <img
                                    src={getFavicon()}
                                    alt=""
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '4px',
                                    }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <span style={{
                                    color: '#60a5fa',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                }}>
                                    {getDomain()}
                                </span>
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: '10px',
                                    padding: '2px 8px',
                                    background: '#1e3a5f',
                                    borderRadius: '10px',
                                    color: '#60a5fa',
                                }}>
                                    ↗ External
                                </span>
                            </div>

                            {/* Title */}
                            <div style={{
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: '500',
                                marginBottom: '8px',
                                lineHeight: '1.4',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {typeof children === 'string' ? children : url}
                            </div>

                            {/* URL */}
                            <div style={{
                                color: '#666',
                                fontSize: '11px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                🔗 {url}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .link-preview-tooltip {
                    animation: tooltipFadeIn 0.2s ease-out;
                }
                @keyframes tooltipFadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-100%) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(-100%) scale(1);
                    }
                }
            `}</style>
        </>
    );
};

export default LinkPreview;
