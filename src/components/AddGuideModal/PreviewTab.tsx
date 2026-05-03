import React from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { PreviewDevice, FormData } from "./types";
import { getMarkdownHtml } from "./utils";

interface PreviewTabProps {
  formData: FormData;
  previewDevice: PreviewDevice;
  setPreviewDevice: (device: PreviewDevice) => void;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({
  formData,
  previewDevice,
  setPreviewDevice,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="h-12 border-b border-gray-100 flex items-center justify-center gap-4 bg-gray-50/50">
        <button
          onClick={() => setPreviewDevice("laptop")}
          className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${
            previewDevice === "laptop"
              ? "bg-black text-white shadow-lg shadow-black/20"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Monitor size={16} />
          <span className="hidden sm:inline">Desktop</span>
        </button>
        <button
          onClick={() => setPreviewDevice("tablet")}
          className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${
            previewDevice === "tablet"
              ? "bg-black text-white shadow-lg shadow-black/20"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Tablet size={16} />
          <span className="hidden sm:inline">Tablet</span>
        </button>
        <button
          onClick={() => setPreviewDevice("phone")}
          className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${
            previewDevice === "phone"
              ? "bg-black text-white shadow-lg shadow-black/20"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Smartphone size={16} />
          <span className="hidden sm:inline">Mobile</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8 flex justify-center custom-scrollbar">
        <div
          className={`bg-white shadow-2xl transition-all duration-500 ease-in-out ${
            previewDevice === "phone"
              ? "max-w-[375px] ring-8 ring-gray-900 rounded-[3rem]"
              : previewDevice === "tablet"
              ? "max-w-[768px] ring-8 ring-gray-900 rounded-[2rem]"
              : "max-w-4xl rounded-2xl"
          } w-full h-fit min-h-full overflow-hidden border border-gray-200 relative`}
        >
          {/* Device Notch Simulation */}
          {previewDevice === "phone" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
          )}
          
          <div className={`p-6 md:p-10 prose prose-lg prose-slate max-w-none ${previewDevice === "phone" ? "pt-12" : ""}`}>
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{
                __html: getMarkdownHtml(formData.content),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
