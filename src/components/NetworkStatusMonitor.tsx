import { Activity, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function NetworkStatusMonitor() {
  const [showModal, setShowModal] = useState<boolean>(!navigator.onLine);
  const slowConnectionToastRef = useRef<any>(null);

  const checkLatency = async (): Promise<boolean> => {
    const start = Date.now();
    try {
      await fetch("/", { method: "HEAD", cache: "no-store" });
      const end = Date.now();
      const currentLatency = end - start;
      setLatency(currentLatency);

      if (currentLatency > 3000) {
        showWeakConnectionToast(currentLatency);
      }
      return true;
    } catch (err) {
      return false;
    }
  };

  const showWeakConnectionToast = (currentLatency: number): void => {
    if (!slowConnectionToastRef.current) {
      slowConnectionToastRef.current = toast.warning("Weak Internet Connection", {
        description: `High latency detected (${currentLatency}ms). Trying to stabilize...`,
        icon: <Activity size={20} className="text-yellow-500 animate-pulse" />,
        duration: 6000,
        action: {
          label: "Test Speed",
          onClick: () => checkLatency(),
        },
        onDismiss: () => {
          slowConnectionToastRef.current = null;
        },
      });
    }
  };

  useEffect(() => {
    const checkConnectionQuality = (): void => {
      if (typeof navigator !== "undefined" && (navigator as any).connection) {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;



        if (effectiveType === "2g" || effectiveType === "slow-2g" || (downlink && downlink < 1)) {
          if (!slowConnectionToastRef.current) {
            showWeakConnectionToast(0);
          }
        }
      }

      checkLatency();
    };

    checkConnectionQuality();
    const interval = setInterval(checkConnectionQuality, 30000);

    const handleOnline = (): void => {
      toast.success("You're back online!", { duration: 3000 });
      setShowModal(false);
    };

    const handleOffline = (): void => {
      setShowModal(true);
      toast.error("You've gone offline", { duration: 3000 });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <WifiOff className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-center mb-2">No Connection</h2>
        <p className="text-gray-600 text-center mb-6">You've lost your internet connection. Attempting to reconnect...</p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          Reconnecting...
        </div>
      </div>
    </div>
  );
}
