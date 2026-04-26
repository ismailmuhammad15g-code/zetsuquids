import { Download, FileText, Loader2, X } from "lucide-react";
import { useState } from "react";

interface Guide {
  title: string
  markdown?: string
  content?: string
}

interface DownloadGuideModalProps {
  guide: Guide
  authorName?: string
  onClose: () => void
}

const API_URL = "http://127.0.0.1:5000/api/generate-pdf";

export default function DownloadGuideModal({ guide, authorName, onClose }: DownloadGuideModalProps) {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const downloadAsPDF = async (): Promise<void> => {
    setDownloading(true);
    setProgress(0);
    setError(null);
    setCurrentStep("Preparing guide data...");

    try {
      setProgress(10);
      setCurrentStep("Sending request to server...");

      const content = guide.markdown || guide.content || "";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: guide.title,
          content: content,
          publisher_name: authorName || "ZetsuGuide",
        }),
      });

      setProgress(30);

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMsg = `Server error: ${response.status}`;

        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = JSON.parse(await response.text());
            errorMsg = (errorData as any).error || errorMsg;
          } catch { }
        }

        throw new Error(errorMsg);
      }

      setProgress(50);
      setCurrentStep("Generating PDF...");

      const blob = await response.blob();
      console.log("[PDF] Blob received, size:", blob.size);

      if (blob.size === 0) {
        throw new Error("Empty PDF response");
      }

      setProgress(80);
      setCurrentStep("Preparing download...");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${guide.title.replace(/[^a-z0-9]/gi, "_")}_zetsuguide.pdf`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);

      setProgress(100);
      setCurrentStep("Download complete!");

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("PDF Download Error:", err);
      let errorMessage = (err as Error)?.message || "Failed to download PDF";

      if (errorMessage.includes("LMARG")) {
        errorMessage = "Server error generating PDF. Please try again.";
      } else if (errorMessage.includes("not defined")) {
        errorMessage = "Server configuration error. Please try again.";
      }

      setError(errorMessage);
      setCurrentStep("Error occurred");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold">Download Guide as PDF</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guide Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Guide:</p>
          <p className="font-semibold text-gray-900">{guide.title}</p>
        </div>

        {/* Status Messages */}
        {downloading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{currentStep}</span>
              <span className="text-sm font-semibold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            disabled={downloading}
          >
            Cancel
          </button>
          <button
            onClick={downloadAsPDF}
            disabled={downloading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
