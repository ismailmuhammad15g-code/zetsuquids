import { Calendar, Clock, RotateCcw, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { guidesApi, type GuideVersion } from "../lib/api";
import { toast } from "sonner";

interface GuideHistoryModalProps {
  guideId: string;
  onClose: () => void;
}



export default function GuideHistoryModal({ guideId, onClose }: GuideHistoryModalProps) {
  const [history, setHistory] = useState<GuideVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [restoringId, setRestoringId] = useState<string | number | null>(null);

  useEffect(() => {
    loadHistory();
  }, [guideId]);

  async function loadHistory(): Promise<void> {
    try {
      setLoading(true);
      const data = await guidesApi.getHistory(guideId);
      setHistory(data);
    } catch (error: unknown) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(version: GuideVersion) {
    if (!version.id) return;
    
    try {
      setRestoringId(version.id);
      const success = await guidesApi.restoreVersion(guideId, version);
      
      if (success) {
        toast.success("Guide version restored successfully!");
        // Refresh the page to show the restored content
        window.location.reload();
      } else {
        toast.error("Failed to restore this version.");
      }
    } catch (err) {
      console.error("Restore error:", err);
      toast.error("An error occurred during restoration.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock size={24} /> Version History
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-2"></div>
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No previous versions found.
            </div>
          ) : (
            <>
              {history.map((version: GuideVersion) => (
                <div
                  key={version.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {version.title}
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(version.created_at || "").toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(version.created_at || "").toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRestore(version)}
                      disabled={restoringId !== null}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {restoringId === version.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RotateCcw size={12} />
                      )}
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="mt-4 pt-4 border-t text-center text-xs text-gray-400">
          Previous versions are saved automatically when you update a guide.
        </div>
      </div>
    </div>
  );
}
