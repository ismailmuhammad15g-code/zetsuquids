import { cn } from "@/lib/utils"; // Adjust if valid path
import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
    useVelocity,
} from "framer-motion";
import { useRef, useState } from "react";

// Helper to wrap value within a range
const wrap = (min, max, v) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export default function SimpleMarquee({
  children,
  baseVelocity = 5,
  direction = "left",
  scrollAwareDirection = true,
  slowdownOnHover = false,
  className,
  ...props
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });

  // Velocity factor from scroll: map 0-1000 scroll speed to 0-5 multiplier
  // This helps changing speed when scrolling.
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  // We have 4 copies of children.
  // One cycle is 25% of the total width of the container (which holds 4 copies).
  // We wrap between -25% and 0%.
  // When we reach -25%, we are logically at the start of the 2nd copy,
  // which looks exactly like the start of the 1st copy (0%), so we snap back to 0%.
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);

  const directionFactor = useRef(1);
  const [isHovered, setIsHovered] = useState(false);

  useAnimationFrame((t, delta) => {
    // Calculate movement based on time
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    // Apply scroll-based acceleration / direction change
    if (scrollAwareDirection) {
      if (velocityFactor.get() < 0) {
        directionFactor.current = -1;
      } else if (velocityFactor.get() > 0) {
        directionFactor.current = 1;
      }
    }

    // If we want the marquee to just speed up on scroll but not necessarily reverse forever:
    // The standard implementation often REVERSES direction on scroll up.
    // If you always want 'left' but just faster/slower, logic would be different.
    // The requirement 'scrollAwareDirection' usually implies the reversing behavior seen in Framer examples.

    if (scrollAwareDirection) {
      moveBy += directionFactor.current * moveBy * velocityFactor.get();
    }

    // Apply slowdown on hover
    if (slowdownOnHover && isHovered) {
      moveBy *= 0.1;
    }

    // Apply prop direction
    // If direction is left, we want negative movement (decreasing x).
    // If direction is right, positive movement.
    // Our 'moveBy' is currently positive magnitude with directionFactor.
    // If base direction is 'left', we should probably invert or ensure it moves negative.

    // Simplification:
    // If baseVelocity is positive.
    // We expect it to move 'direction'.
    // If direction is left, we want decreasing x.
    // If direction is right, we want increasing x.

    // But 'directionFactor' is dynamic from scroll.
    // Let's assume natural direction is Right.
    // If user wants Left, we invert.

    if (direction === "left") {
      baseX.set(baseX.get() - moveBy);
    } else {
      baseX.set(baseX.get() + moveBy);
    }
  });

  return (
    <div
      className={cn("overflow-hidden flex flex-nowrap w-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <motion.div className="flex flex-nowrap" style={{ x }}>
        {/* Helper component or just fragments?
            Flex container needs immediate children to be elements if we want spacing, but here we just want content.
        */}
        <div className="flex flex-nowrap shrink-0">{children}</div>
        <div className="flex flex-nowrap shrink-0">{children}</div>
        <div className="flex flex-nowrap shrink-0">{children}</div>
        <div className="flex flex-nowrap shrink-0">{children}</div>
      </motion.div>
    </div>
  );
}
