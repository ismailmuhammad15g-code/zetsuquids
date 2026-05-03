import React from "react";
import { toast } from "sonner";
import { uploadToGitHub } from "../../lib/github-assets";

interface AdvancedImageModalProps {
  onInsert: (content: string) => void;
  onClose: () => void;
}

export const AdvancedImageModal: React.FC<AdvancedImageModalProps> = ({ onInsert, onClose }) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [alignment, setAlignment] = React.useState<"none" | "left" | "center" | "right">("none");
  const [isUploading, setIsUploading] = React.useState(false);

  const handleInsert = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const toastId = toast.loading(`Uploading ${files.length} image(s) to GitHub...`);
      let insertedText = "";
      for (const file of files) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await uploadToGitHub(dataUrl, "guide-images", `${Date.now()}-${file.name}`);
        const hash = alignment !== "none" ? `#align-${alignment}` : "";
        insertedText += `\n![${file.name}](${result.url}${hash})\n`;
      }
      onInsert(insertedText);
      toast.success("Image(s) uploaded!", { id: toastId });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold mb-6 text-gray-900">Upload Images</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Images <span className="font-normal text-gray-400">(multiple allowed)</span>
            </label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer transition-colors" 
            />
            {files.length > 0 && <p className="mt-2 text-xs text-indigo-600 font-medium">{files.length} file(s) selected</p>}
          </div>

          {files.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Alignment</label>
              <div className="flex gap-2">
                {(["none", "left", "center", "right"] as const).map((a) => (
                  <button 
                    key={a} 
                    onClick={() => setAlignment(a)} 
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                      alignment === a 
                        ? "bg-black text-white border-black shadow-lg shadow-black/20" 
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {a === "none" ? "Default" : a}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              onClick={onClose} 
              disabled={isUploading} 
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleInsert} 
              disabled={files.length === 0 || isUploading}
              className="px-8 py-2.5 bg-black rounded-xl text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-black/10"
            >
              {isUploading ? "Uploading..." : `Insert ${files.length > 0 ? files.length : ""} Image(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
