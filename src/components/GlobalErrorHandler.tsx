"use client";
import { AlertTriangle, Bug, EyeOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ErrorInfo {
  type: string
  message: string
  stack: string
}

export default function GlobalErrorHandler() {
  const [lastError, setLastError] = useState<ErrorInfo | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [errorsDisabled, setErrorsDisabled] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const disabled = localStorage.getItem("zetsu_errors_disabled") === "true";
    setErrorsDisabled(disabled);
  }, []);

  useEffect(() => {
    const handleGlobalError = (event: any): void => {
      if (errorsDisabled) return;
      const errorMsg = event.reason ? event.reason.message : event.message;
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

    const originalConsoleError = console.error;
    console.error = (...args: any[]): void => {
      originalConsoleError.apply(console, args);

      const message = args
        .map((arg: any) =>
          typeof arg === "object" ? arg.message || JSON.stringify(arg) : String(arg),
        )
        .join(" ");

      const ignoredPatterns = [
        "React Router Future Flag",
        "AI Enhancement error",
        "AI Generation error",
        "Failed to enhance content",
        "Failed to generate content",
        "Error creating guide",
        "504",
        "Gateway Timeout",
        "Network error",
        "Please enter",
        "Please write",
        "Streaming completed but no content",
        "No data received from AI service",
        "AI error: Error: No response received",
        "AI error: Error: AI service completed",
        "empty response",
        "Backend error",
        "Debug info:",
        "AbortError",
        "signal is aborted",
      ];

      const shouldIgnore = ignoredPatterns.some((pattern) => message.includes(pattern));

      if (shouldIgnore || errorsDisabled) return;

      setTimeout(() => {
        setLastError({
          type: "Console Error",
          message: message,
          stack: new Error().stack || "",
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

  const handleClose = (): void => {
    setIsVisible(false);
  };

  const toggleErrorTracking = (): void => {
    setErrorsDisabled(!errorsDisabled);
    localStorage.setItem("zetsu_errors_disabled", (!errorsDisabled).toString());
  };

  const handleReportBug = (): void => {
    router.push("/reportbug");
    handleClose();
  };

  if (!isVisible || !lastError) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold">Oops! An Error Occurred</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          <strong>{lastError.type}:</strong> {lastError.message}
        </p>

        <details className="mb-6 text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Stack Trace</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-gray-700">{lastError.stack}</pre>
        </details>

        <div className="flex gap-3">
          <button onClick={handleReportBug} className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Bug className="w-4 h-4" /> Report
          </button>
          <button onClick={toggleErrorTracking} className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2">
            <EyeOff className="w-4 h-4" /> {errorsDisabled ? "Enable" : "Disable"}
          </button>
        </div>
      </div>
    </div>
  );
}
