import { Download, FileText, Loader2, X } from "lucide-react";
import { useState } from "react";

const API_URL = "http://127.0.0.1:5000/api/generate-pdf";

export default function DownloadGuideModal({ guide, authorName, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState(null);

  const downloadAsPDF = async () => {
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
            errorMsg = errorData.error || errorMsg;
          } catch {}
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
      let errorMessage = err.message || "Failed to download PDF";
      
      if (err.message.includes("LMARG")) {
        errorMessage = "Server error generating PDF. Please try again.";
      } else if (err.message.includes("not defined")) {
        errorMessage = "Server configuration error. Please try again.";
      }
      
      setError(errorMessage);
      setCurrentStep("Error occurred");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="bg-white border-4 border-black w-full max-w-md mx-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between p-6 border-b-2 border-black bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100">
          <div className="flex items-center gap-2">
            <Download size={24} className="text-purple-600" />
            <h2 className="text-xl font-black">Download Guide</h2>
          </div>
          {!downloading && (
            <button
              onClick={onClose}
              className="hover:bg-black/10 p-2 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6">
          {!downloading ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm mb-6">
                Download this guide as a professional PDF document.
              </p>

              <button
                onClick={downloadAsPDF}
                className="w-full flex items-center justify-between p-4 border-2 border-black hover:bg-purple-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 border-2 border-black">
                    <FileText size={24} className="text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Save as PDF</div>
                    <div className="text-xs text-gray-600">
                      Professional document format
                    </div>
                  </div>
                </div>
                <Download
                  size={20}
                  className="text-gray-400 group-hover:text-black transition-colors"
                />
              </button>

              <div className="text-xs text-gray-500 text-center mt-4 p-3 bg-gray-50 border border-gray-200">
                📄 Generated with ZetsuGuide
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2
                  size={48}
                  className="animate-spin text-purple-600 mb-4"
                />
                <p className="font-bold text-lg text-center">{currentStep}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progress</span>
                  <span className="text-purple-600">{progress}%</span>
                </div>
                <div className="w-full h-4 bg-gray-200 border-2 border-black overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {error && (
                <div className="text-center text-red-600 font-medium p-3 bg-red-50 border border-red-200">
                  {error}
                </div>
              )}

              {progress === 100 && (
                <div className="text-center text-green-600 font-bold flex items-center justify-center gap-2">
                  <Download size={20} />
                  Download Complete!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}