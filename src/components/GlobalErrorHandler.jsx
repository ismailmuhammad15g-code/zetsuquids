import { AlertTriangle, Bug, EyeOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GlobalErrorHandler() {
  const [lastError, setLastError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorsDisabled, setErrorsDisabled] = useState(false);
  const navigate = useNavigate();

  // Check if errors are disabled on mount
  useEffect(() => {
    const disabled = localStorage.getItem("zetsu_errors_disabled") === "true";
    setErrorsDisabled(disabled);
  }, []);

  useEffect(() => {
    // 1. Capture Global Uncaught Errors
    const handleGlobalError = (event) => {
      if (errorsDisabled) return; // Skip if errors are disabled
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

      // Skip if errors are disabled
      if (errorsDisabled) return;

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
  }, [errorsDisabled]);

  if (!isVisible || !lastError) return null;

  const handleReport = () => {
    setIsModalOpen(false);
    setIsVisible(false);
    navigate("/reportbug", {
      state: {
        prefilledDescription: `Starting Auto-Report...\n\nError Type: ${lastError.type}\nMessage: ${lastError.message}\n\nStack/Details:\n${lastError.stack}`,
        issueType: "Technical Issue",
      },
    });
  };

  // 🔴 Tiny, unobtrusive indicator
  return (
    <>
      {/* Tiny dot indicator - Very subtle */}
      {isVisible && !isModalOpen && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-4 right-4 z-[9999] w-3 h-3 bg-red-600 rounded-full hover:bg-red-500 transition-colors shadow-md hover:shadow-lg cursor-pointer"
          title="System error detected - click to view"
        />
      )}

      {/* Modal - Only shows when clicked */}
      {isModalOpen && isVisible && lastError && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 text-gray-900 rounded-lg shadow-lg max-w-sm w-full animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    Error Detected
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {lastError.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Details */}
            <div className="p-4 space-y-3">
              {/* Error Message */}
              <div>
                <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                  Message
                </p>
                <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 max-h-24 overflow-y-auto break-words">
                  {lastError.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleReport}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Bug className="w-3 h-3" />
                  Report Bug
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 text-xs font-medium py-2 px-3 rounded transition-colors"
                >
                  Dismiss
                </button>
              </div>

              {/* Never Show Again */}
              <button
                onClick={() => {
                  localStorage.setItem("zetsu_errors_disabled", "true");
                  setErrorsDisabled(true);
                  setIsModalOpen(false);
                  setIsVisible(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 py-2 border-t border-gray-200 transition-colors"
              >
                <EyeOff className="w-3 h-3" />
                Never show errors again
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
