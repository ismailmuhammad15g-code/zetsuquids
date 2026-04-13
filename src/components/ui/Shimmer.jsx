import { memo, useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Shimmer
 * ─────────────────────────────────────────────────────────────
 * Animated shimmer sweep across any text element.
 *
 * Props
 *   children   {string}      – text to shimmer
 *   as         {ElementType} – HTML tag (default "p")
 *   className  {string}      – extra Tailwind classes
 *   duration   {number}      – seconds per sweep (default 2)
 *   spread     {number}      – gradient width = spread × text.length px (default 2)
 *
 * Usage
 *   <Shimmer>Loading…</Shimmer>
 *   <Shimmer as="h1" duration={1.5} className="text-4xl font-bold">Hello</Shimmer>
 *   <Shimmer as="span" spread={3}>Generating response…</Shimmer>
 */
const Shimmer = memo(({ children, as: Tag = "p", className = "", duration = 2, spread = 2 }) => {
  const spreadPx = useMemo(
    () => Math.max(80, (children?.length ?? 10) * spread),
    [children, spread]
  );

  return (
    <Tag className={`relative inline-block overflow-hidden ${className}`}>
      {/* invisible copy holds layout / height */}
      <span className="invisible select-none" aria-hidden="true">
        {children}
      </span>

      {/* animated layer sits on top */}
      <motion.span
        aria-label={typeof children === "string" ? children : undefined}
        className="absolute inset-0 bg-clip-text text-transparent whitespace-pre-wrap"
        style={{
          backgroundSize: `${spreadPx}px 100%`,
          backgroundRepeat: "no-repeat",
          backgroundImage: `linear-gradient(
            90deg,
            var(--shimmer-base,      #9ca3af) 0%,
            var(--shimmer-base,      #9ca3af) 33%,
            var(--shimmer-highlight, #f9fafb) 50%,
            var(--shimmer-base,      #9ca3af) 67%,
            var(--shimmer-base,      #9ca3af) 100%
          )`,
        }}
        animate={{
          backgroundPositionX: [
            `-${spreadPx}px`,
            `calc(100% + ${spreadPx}px)`,
          ],
        }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        {children}
      </motion.span>
    </Tag>
  );
});

Shimmer.displayName = "Shimmer";

export default Shimmer;
