import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function GuideTimer({ guideId, userId }) {
  const [seconds, setSeconds] = useState(0); // Time collected in this session
  const [status, setStatus] = useState("waiting"); // waiting, countdown, tracking
  const [countdown, setCountdown] = useState(5);

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
      // Note: We can't easily call saveCurrentProgress here because of stale closures potentially
      // affecting guideId/userId if they changed (though they shouldn't usually).
      // But we can try:
      const now = Date.now();
      const diff = Math.round((now - lastTick.current) / 1000);
      if (diff > 1 && diff < 3000) {
        // Fire and forget
        supabase
          .rpc("track_guide_time", {
            p_guide_id: guideId,
            p_duration_add: diff,
          })
          .then(({ error }) => {
            if (error) console.error("Unmount save error", error);
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

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

    try {
      const { error } = await supabase.rpc("track_guide_time", {
        p_guide_id: guideId,
        p_duration_add: amount,
      });
      if (error) console.error("Error saving time:", error);
    } catch (err) {
      console.error("Failed to save time:", err);
    }
  };

  // Format for display
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  if (!userId) return null;

  return (
    <>
      <style>{`
        @keyframes shimmer-slide {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .timer-shimmer {
          background: linear-gradient(
            110deg,
            #000000 35%,
            #2a2a2a 50%,
            #000000 65%
          );
          background-size: 200% 100%;
          animation: shimmer-slide 8s infinite linear;
        }
      `}</style>
      <div className="timer-shimmer flex items-center gap-2 px-4 py-1.5 text-white text-xs font-bold rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-gray-800 animate-in fade-in slide-in-from-top-2">
        <Clock className="w-3.5 h-3.5 text-gray-300" />

        {status === "countdown" && (
          <span className="text-gray-200">Starting in {countdown}s...</span>
        )}

        {status === "tracking" && (
          <span className="font-mono tracking-wide text-white drop-shadow-md">
            {formatTime(seconds)}
          </span>
        )}
      </div>
    </>
  );
}
