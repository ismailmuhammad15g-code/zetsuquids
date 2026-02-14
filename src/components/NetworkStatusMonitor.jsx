import { Activity, RefreshCcw, Signal, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function NetworkStatusMonitor() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showModal, setShowModal] = useState(!navigator.onLine);
  const [connectionType, setConnectionType] = useState("unknown");
  const [latency, setLatency] = useState(0); // My custom feature: latency tracking
  const wasOfflineRef = useRef(!navigator.onLine);
  const slowConnectionToastRef = useRef(null);

  // Custom Feature: Active Latency Check
  const checkLatency = async () => {
    const start = Date.now();
    try {
      // Ping the server (using a small resource or HEAD request)
      await fetch("/", { method: "HEAD", cache: "no-store" });
      const end = Date.now();
      const currentLatency = end - start;
      setLatency(currentLatency);

      // If latency is very high (> 3000ms), consider it weak internet
      if (currentLatency > 3000) {
        showWeakConnectionToast(currentLatency);
      }
      return true;
    } catch (err) {
      // If fetch fails, we might be offline or super slow
      return false;
    }
  };

  const showWeakConnectionToast = (currentLatency) => {
    if (!slowConnectionToastRef.current) {
      slowConnectionToastRef.current = toast.warning(
        "Weak Internet Connection",
        {
          description: `High latency detected (${currentLatency}ms). Trying to stabilize...`,
          icon: (
            <Activity size={20} className="text-yellow-500 animate-pulse" />
          ),
          duration: 6000,
          action: {
            label: "Test Speed",
            onClick: () => checkLatency(),
          },
          onDismiss: () => {
            slowConnectionToastRef.current = null;
          },
        },
      );
    }
  };

  useEffect(() => {
    // Check connection quality
    const checkConnectionQuality = () => {
      // 1. Browser API Check
      // 2. Browser API Check (Passive)
      let isWeak = false;
      if (typeof navigator !== "undefined" && navigator.connection) {
        const connection =
          navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection;

        const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
        const downlink = connection.downlink; // Mbps

        setConnectionType(effectiveType || "unknown");

        // Slow connection detection
        if (
          effectiveType === "2g" ||
          effectiveType === "slow-2g" ||
          (downlink && downlink < 1)
        ) {
          isWeak = true;
          if (!slowConnectionToastRef.current) {
            slowConnectionToastRef.current = toast.warning(
              "Unstable Network Detected",
              {
                description: `Signal strength is low (${effectiveType}). Some features may lag.`,
                icon: <Signal size={20} className="text-orange-500" />,
                duration: 5000,
                onDismiss: () => {
                  slowConnectionToastRef.current = null;
                },
              },
            );
          }
        }
      }

      // 3. Active Latency Check (My Added Feature)
      // Only do deep check if we suspect issues or periodically
      if (!isOffline && !isWeak) {
        // Simple fetch check to confirm real connectivity
        // Using HEAD request to root path which always exists and is small
        const start = Date.now();
        fetch(window.location.origin + "/favicon.svg", {
          method: "HEAD",
          cache: "no-store",
        })
          .catch(() => {
            // First check failed, likely file not found but maybe connection. Try root fallback.
            return fetch(window.location.origin, {
              method: "HEAD",
              cache: "no-store",
              mode: "no-cors",
            });
          })
          .then((response) => {
            // If response is undefined, the catch above ran
            if (response && !response.ok && response.type !== "opaque") {
              // Ignore 404s, but connection is OK
            }
            return response;
          })
          .then(() => {
            const time = Date.now() - start;
            setLatency(time);
            if (time > 2000) {
              // High latency detected actively
              if (!slowConnectionToastRef.current) {
                slowConnectionToastRef.current = toast.warning(
                  "Weak Internet Connection",
                  {
                    description:
                      "Your network is unstable. Loading may be slow.",
                    icon: <Signal size={20} className="text-yellow-500" />,
                    duration: 5000,
                    onDismiss: () => {
                      slowConnectionToastRef.current = null;
                    },
                  },
                );
              }
            }
          })
          .catch(() => {
            // Fetch failed -> likely offline or super unstable
            // We let the offline listener handle the main offline event
          });
      }
    };

    // Run check every 30 seconds
    const interval = setInterval(checkConnectionQuality, 30000);

    // Initial check
    checkConnectionQuality();

    // Handle online event
    const handleOnline = () => {
      console.log("🟢 Internet connection restored");
      setIsOffline(false);
      setShowModal(false);

      // If was offline before, show success toast and reload
      if (wasOfflineRef.current) {
        toast.success("Internet connection restored!", {
          description: "Refreshing page...",
          icon: <Wifi size={20} />,
          duration: 2000,
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

      wasOfflineRef.current = false;
      checkConnectionQuality();
    };

    // Handle offline event
    const handleOffline = () => {
      console.log("🔴 Internet connection lost");
      setIsOffline(true);
      setShowModal(true);
      wasOfflineRef.current = true;

      if (slowConnectionToastRef.current) {
        toast.dismiss(slowConnectionToastRef.current);
        slowConnectionToastRef.current = null;
      }
    };

    // Handle connection change
    const handleConnectionChange = () => {
      console.log("🔄 Connection changed");
      checkConnectionQuality();
    };

    // Initial check
    console.log("📡 Network Monitor initialized. Online:", navigator.onLine);

    if (navigator.onLine) {
      checkConnectionQuality();
    } else {
      console.log("⚠️ Starting in offline mode");
      setIsOffline(true);
      setShowModal(true);
      wasOfflineRef.current = true;
    }

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.connection) {
      navigator.connection.addEventListener("change", handleConnectionChange);
    }

    // Cleanup
    return () => {
      clearInterval(interval); // Clear my latency check interval
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (navigator.connection) {
        navigator.connection.removeEventListener(
          "change",
          handleConnectionChange,
        );
      }

      if (slowConnectionToastRef.current) {
        toast.dismiss(slowConnectionToastRef.current);
      }
    };
  }, []);

  // Render modal when offline
  if (!showModal) {
    return null;
  }

  console.log("🚨 Rendering offline modal");

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white border-4 border-black max-w-md mx-4 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 border-b-4 border-black">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <WifiOff size={48} className="text-white animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-black">
              No Internet Connection
            </h2>
            <p className="text-gray-600 font-medium">
              You're currently offline. Please check your internet connection
              and try again.
            </p>
          </div>

          {/* Connection Status */}
          <div className="bg-gray-50 border-2 border-gray-300 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Status:</span>
              <span className="flex items-center gap-2 text-red-600 font-bold">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                Offline
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Network:</span>
              <span className="text-gray-800 font-semibold">
                {connectionType.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-2 border-blue-200 p-4 text-left space-y-2">
            <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
              <InfoIcon size={16} />
              Quick Fixes:
            </h3>
            <ul className="text-xs text-blue-800 space-y-1 ml-6 list-disc">
              <li>Check your WiFi or mobile data connection</li>
              <li>Turn airplane mode off</li>
              <li>Restart your router</li>
              <li>Check if other apps/sites work</li>
            </ul>
          </div>

          {/* Auto Reconnect Notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <RefreshCcw size={14} className="animate-spin" />
            <span>
              The page will automatically reload when connection is restored
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 border-t-2 border-black">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-black text-white font-bold py-3 px-6 border-2 border-black hover:bg-gray-800 transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoIcon({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
