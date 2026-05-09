"use client";

import { List } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

export interface TocItem {
    id: string;
    text: string;
    level: 1 | 2;
}

interface GuideTOCProps {
    items: TocItem[];
}

/**
 * Sticky Table of Contents using Intersection Observer for active link detection.
 * Only shows h1 and h2 headings.
 */
const GuideTOC = memo(function GuideTOC({ items }: GuideTOCProps) {
    const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (!items.length) return;

        const headingEls = items
            .map(({ id }) => document.getElementById(id))
            .filter(Boolean) as HTMLElement[];

        if (!headingEls.length) return;

        // Clean up previous observer
        observerRef.current?.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                // Find topmost visible heading
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) {
                    setActiveId(visible[0].target.id);
                }
            },
            {
                rootMargin: "-80px 0px -60% 0px",
                threshold: 0,
            }
        );

        headingEls.forEach((el) => observerRef.current!.observe(el));

        return () => observerRef.current?.disconnect();
    }, [items]);

    if (!items.length) return null;

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top, behavior: "smooth" });
            setActiveId(id);
        }
    };

    return (
        <nav aria-label="Table of contents" className="bg-transparent mb-8">
            <div className="flex items-center gap-2 mb-4">
                <List size={16} className="text-gray-900 dark:text-white" strokeWidth={2.5} />
                <p className="text-[15px] font-bold text-gray-900 dark:text-white m-0 tracking-wide">
                    On this page
                </p>
            </div>
            <ul className="space-y-[6px] list-none m-0 p-0 relative before:absolute before:inset-y-0 before:left-0 before:w-[1px] before:bg-gray-200 dark:before:bg-gray-800">
                {items.map((item) => (
                    <li
                        key={item.id}
                        style={{ paddingLeft: item.level === 2 ? "20px" : "12px" }}
                        className="m-0 relative group"
                    >
                        {/* Active indicator bar */}
                        {activeId === item.id && (
                            <div className="absolute left-[0px] top-1/2 -translate-y-1/2 w-[2px] h-full max-h-5 bg-black dark:bg-white rounded-r-md z-10" />
                        )}
                        <a
                            href={`#${item.id}`}
                            onClick={(e) => handleClick(e, item.id)}
                            className={`block py-1 text-[13.5px] leading-snug transition-colors ${activeId === item.id
                                    ? "text-gray-900 dark:text-white font-medium"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                        >
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
});

export default GuideTOC;
