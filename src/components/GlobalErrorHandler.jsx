import { AlertTriangle, ArrowRight, Bug, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GlobalErrorHandler() {
  const [lastError, setLastError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Capture Global Uncaught Errors
    const handleGlobalError = (event) => {
      const errorMsg = event.reason ? event.reason.message : event.message;
      // Defer state update to avoid "Cannot update component while rendering" warning
      setTimeout(() => {
        setLastError({
          type: "Crash/Uncaught",
          message: errorMsg || "Unknown Error",
          stack: event.error?.stack || event.reason?.stack || "",
        });
        setIsVisible(true);
      }, 0);
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleGlobalError);

    // 2. Intercept console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call original to ensure devtools still show it
      originalConsoleError.apply(console, args);

      // Extract meaningful message
      const message = args
        .map((arg) =>
          typeof arg === "object"
            ? arg.message || JSON.stringify(arg)
            : String(arg),
        )
        .join(" ");

      // Ignore common harmless warnings and expected errors
      const ignoredPatterns = [
        "React Router Future Flag",
        "AI Enhancement error", // Expected AI errors
        "AI Generation error", // Expected AI errors
        "Failed to enhance content", // User-facing errors
        "Failed to generate content", // User-facing errors
        "Error creating guide", // User-facing errors
        "504", // Timeout errors (expected)
        "Gateway Timeout", // Timeout errors (expected)
        "Network error", // Network issues (expected)
        "Please enter", // Validation errors
        "Please write", // Validation errors
        "Streaming completed but no content", // Streaming errors (debugging)
        "No data received from AI service", // Streaming errors (debugging)
        "AI error: Error: No response received", // Streaming errors (debugging)
        "AI error: Error: AI service completed", // Streaming errors (debugging)
        "empty response", // Streaming errors (debugging)
        "Backend error", // Backend errors (handled)
        "Debug info:", // Debug logging
        "AbortError", // Request cancellation
        "signal is aborted", // Request cancellation
      ];

      // Check if error should be ignored
      const shouldIgnore = ignoredPatterns.some((pattern) =>
        message.includes(pattern),
      );

      if (shouldIgnore) return;

      // Defer state update to avoid "Cannot update component while rendering" warning
      setTimeout(() => {
        setLastError({
          type: "Console Error",
          message: message,
          stack: new Error().stack, // Capture current stack
        });
        setIsVisible(true);
      }, 0);
    };

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleGlobalError);
      console.error = originalConsoleError;
    };
  }, []);

  if (!isVisible || !lastError) return null;

  const handleReport = () => {
    setIsVisible(false);
    navigate("/reportbug", {
      state: {
        prefilledDescription: `Starting Auto-Report...\n\nError Type: ${lastError.type}\nMessage: ${lastError.message}\n\nStack/Details:\n${lastError.stack}`,
        issueType: "Technical Issue",
      },
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-zinc-900 border border-red-500/50 text-white p-4 rounded-xl shadow-2xl flex items-start gap-4 max-w-sm backdrop-blur-md bg-opacity-95">
        <div className="bg-red-500/10 p-2 rounded-lg shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
            System Issue Detected
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-mono">
              Auto-Catch
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 font-mono bg-black/30 p-1.5 rounded border border-zinc-800/50">
            {lastError.message}
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleReport}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all w-full"
            >
              <Bug className="w-3.5 h-3.5" />
              Report This Bug
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pulse Ring effect to grab attention */}
      <span className="absolute -inset-1 rounded-xl bg-red-500/20 animate-pulse -z-10 blur-sm"></span>
    </div>
  );
}
