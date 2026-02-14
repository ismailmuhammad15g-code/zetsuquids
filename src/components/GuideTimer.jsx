import { AnimatePresence, motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import Counter from "./react-bits/Counter";

export default function GuideTimer({ guideId, userId }) {
  const [seconds, setSeconds] = useState(0); // Time collected in this session
  const [status, setStatus] = useState("waiting"); // waiting, countdown, tracking
  const [countdown, setCountdown] = useState(5);
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef(null);

  // Use refs for intervals to clear them easily
  const timerInterval = useRef(null);
  const saveInterval = useRef(null);
  const lastTick = useRef(Date.now());

  // Define start/stop refs to avoid dependency cycles in useEffect
  // We use refs to hold the functions or just defining them inside wouldn't work easily with shared scope
  // Actually, we can just define them in the scope and use them, ignoring the lint rule for the mount effect
  // or use a ref to track if we are mounted.

  const stopTimerFunctions = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (saveInterval.current) {
      clearInterval(saveInterval.current);
      saveInterval.current = null;
    }
  };

  const saveCurrentProgress = () => {
    // Calculate exact seconds passed since last save/start
    const now = Date.now();
    const secondsPassed = Math.round((now - lastTick.current) / 1000);

    // Sanity check: cap at 300s (5m) per save to prevent massive jumps from hibernate/sleep
    // and ensure we are in a valid state
    if (secondsPassed > 0 && secondsPassed < 3000) {
      saveProgress(secondsPassed);
      lastTick.current = now;
    } else if (secondsPassed >= 3000) {
      // If huge jump (system sleep?), just reset tick, don't save crazy amount
      lastTick.current = now;
    }
  };

  useEffect(() => {
    // Start countdown process on mount
    setStatus("countdown");
    setCountdown(5);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setStatus("tracking");

          // START TRACKING LOGIC INLINED TO AVOID CLOSURE ISSUES
          stopTimerFunctions(); // Safety clear
          lastTick.current = Date.now();

          // Display timer
          timerInterval.current = setInterval(() => {
            setSeconds((s) => s + 1);
          }, 1000);

          // Save timer
          saveInterval.current = setInterval(() => {
            saveCurrentProgress();
          }, 30000);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      stopTimerFunctions();

      // Try invalidating/saving on unmount
      const now = Date.now();
      const diff = Math.round((now - lastTick.current) / 1000);
      if (diff > 1 && diff < 3000) {
        // Fire and forget with silent catch
        supabase
          .rpc("track_guide_time", {
            p_guide_id: guideId,
            p_duration_add: diff,
          })
          .then(({ error }) => {
            // Only log logic errors, suppress network errors on unmount as page allows it
            if (error && !error.message?.includes("fetch")) {
              // console.warn("Unmount save warning", error);
            }
          })
          .catch(() => {
            // Totally ignore unmount errors as they are often due to cancelled requests
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Check Sticky Intersection
  useEffect(() => {
    // Only engage sticky logic if we are tracking/active
    if (status !== "waiting") {
      // Also allow during countdown?
      const currentContainer = containerRef.current;
      if (!currentContainer) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          // If the container is SCROLLED OUT of view (intersection ratio < 1 not enough, need position)
          // simpler: if container leaves viewport via top edge?
          // The containerRef is the anchor/placeholder.
          // If user scrolls down past it, top < 0
          if (entry.boundingClientRect.top < 0 && !entry.isIntersecting) {
            setIsSticky(true);
          } else if (entry.isIntersecting && entry.boundingClientRect.top > 0) {
            // Back in view from top (scrolling up)
            setIsSticky(false);
          } else if (entry.isIntersecting) {
            setIsSticky(false);
          }
        },
        {
          threshold: [0, 1],
          rootMargin: "-100px 0px 0px 0px", // Offset for header so it triggers earlier
        },
      );

      observer.observe(currentContainer);
      return () => observer.disconnect();
    }
  }, [status]);

  // Cleanup these unused functions to avoid confusion (we inlined them)
  const startTracking = () => {};
  const stopTracking = () => {};

  // Save on unmount (best effort)
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const saveProgress = async (amount) => {
    if (!userId || !guideId) return;

    // Skip if offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }

    try {
      const { error } = await supabase.rpc("track_guide_time", {
        p_guide_id: guideId,
        p_duration_add: amount,
      });

      if (error) {
        // Suppress network errors from console to avoid noise
        if (
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("NetworkError") ||
          error.message?.includes("connection")
        ) {
          // Silent fail for network issues - we'll just try again next interval
          return;
        }
        console.warn("Error saving time:", error.message);
      }
    } catch (err) {
      // Suppress network errors from console
      if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.name === "TypeError"
      ) {
        return;
      }
      console.warn("Failed to save time:", err);
    }
  };

  // Format for display
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    // Convert to string for Counter compatible format (e.g. 12:45)
    // The Counter component expects a number or array of places.
    // If we want to display H M S with colons, the Counter component might need adjustment
    // or we use multiple Counters.
    // However, the requested Usage was <Counter value={4.4} ... /> which implies numeric.
    // The user said "1 2 3 4 ..." and "automatic counting".
    // "No button".
    // "Just counter".

    // If we just want to show seconds ticking up:
    return secs;
  };

  const getPlaces = (secs) => {
    // Return place values for digits [100, 10, 1] etc based on magnitude
    // But the component calculates it automatically if we pass value.
    // We can also pass explicit places to formatting like 00:00
    // But the component supports '.' for decimals, not ':' for time.
    // User asked for "1 2 3 4 ..." so maybe just total seconds?
    // Or maybe they want the time formatted.
    // "Counter value={4.4}"
    // Let's implement it as a simple seconds counter first as per "1 2 3 4 ..." request.
    return undefined;
  };

  if (!userId) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="relative inline-flex items-center justify-end"
        style={{ minHeight: "40px", minWidth: "150px" }} // Placeholder to avoid layout shift
      >
        <AnimatePresence>
          <motion.div
            layout // Magic motion layout transitions
            initial={false}
            animate={
              isSticky
                ? {
                    position: "fixed",
                    top: "6rem",
                    right: "2rem",
                    left: "auto",
                    zIndex: 40,
                    scale: 0.9,
                    opacity: 1,
                  }
                : {
                    position: "relative",
                    top: "auto",
                    right: "auto",
                    left: "auto",
                    zIndex: 10,
                    scale: 1,
                    opacity: 1,
                  }
            }
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className={`flex items-center gap-2 px-4 py-2 bg-black border border-gray-800 rounded-lg shadow-lg ${isSticky ? "glass-effect backdrop-blur-md bg-black/80" : ""}`}
            style={isSticky ? { pointerEvents: "none" } : {}}
          >
            <Clock className="w-4 h-4 text-white" />

            {status === "tracking" && (
              <div className="flex items-center gap-1.5" dir="ltr">
                {/* Logic for Minutes / Seconds display */}
                {seconds >= 60 && (
                  <>
                    <div className="flex items-center">
                      <Counter
                        value={Math.floor(seconds / 60)}
                        fontSize={20}
                        padding={0}
                        gap={2}
                        textColor="white"
                        fontWeight={700}
                        gradientHeight={4}
                        gradientFrom="#000000"
                        gradientTo="transparent"
                      />
                      <span className="text-xs text-gray-400 ml-1 font-medium">
                        m
                      </span>
                    </div>
                    <span className="text-gray-600 text-xs font-bold">:</span>
                  </>
                )}

                <div className="flex items-center">
                  <Counter
                    value={seconds % 60}
                    fontSize={20}
                    padding={0}
                    places={[10, 1]}
                    gap={2}
                    textColor="white"
                    fontWeight={700}
                    gradientHeight={4}
                    gradientFrom="#000000"
                    gradientTo="transparent"
                  />
                  <span className="text-xs text-gray-400 ml-1 font-medium">
                    s
                  </span>
                </div>
              </div>
            )}

            {status === "countdown" && (
              <div className="flex items-center text-gray-200 text-sm font-medium">
                <span>Starting in</span>
                <span className="ml-1.5 px-1.5 py-0.5 bg-gray-800 rounded font-bold">
                  {countdown}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
