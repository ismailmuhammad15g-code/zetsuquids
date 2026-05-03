const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AddGuideModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add React import if missing
if (!content.includes('import React from "react";') && !content.includes("import React, ")) {
  content = content.replace('"use client";', '"use client";\\nimport React from "react";');
}

// 2. Import uploadToGitHub instead of uploadImageToImgBB
if (!content.includes('uploadToGitHub')) {
  content = content.replace(
    'import { uploadImageToImgBB } from "../lib/imgbb";',
    'import { uploadImageToImgBB } from "../lib/imgbb";\\nimport { uploadToGitHub } from "../lib/github-assets";'
  );
}

// 3. Update Markdown image rendering (rounded, no glow)
const MARKDOWN_IMAGE_RENDERER = `
  image(href: any, title: any, text: any) {
    let url = href;
    if (typeof href === 'object' && href !== null) {
      url = href.href || '';
      title = href.title || '';
      text = href.text || '';
    }
    // Parse custom alignment from URL hash if any (e.g. #align-center)
    let alignmentStyle = "margin-left: auto; margin-right: auto;";
    if (url.includes("#align-left")) alignmentStyle = "margin-right: auto; margin-left: 0;";
    if (url.includes("#align-right")) alignmentStyle = "margin-left: auto; margin-right: 0;";
    
    // Clean the URL
    url = url.split('#')[0];

    return \`<img src="\${url}" alt="\${text || ''}" title="\${title || ''}" class="rounded-xl block max-w-full h-auto border border-gray-200 shadow-sm zetsu-image" style="\${alignmentStyle}" />\`;
  },
`;

if (!content.includes('image(href: any, title: any, text: any)')) {
  content = content.replace(
    '  code(code: any, language?: any): string {',
    MARKDOWN_IMAGE_RENDERER + '\\n  code(code: any, language?: any): string {'
  );
}

// 4. Update image upload handlers to use Github
// Replace `const url = await uploadImageToImgBB(file);` with `uploadToGitHub` logic
// But we need to convert file to dataUrl first!
const GITHUB_UPLOAD_LOGIC = `
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await uploadToGitHub(dataUrl, 'guide-images', file.name);
      const url = result.url;
`;

if (content.includes('const url = await uploadImageToImgBB(file);')) {
  // Only replace the one in handleImageUpload (markdown images)
  content = content.replace(
    'const url = await uploadImageToImgBB(file);',
    GITHUB_UPLOAD_LOGIC
  );
}

// Ensure multiple images are handled in handleImageUpload
const MULTIPLE_IMAGES_LOGIC = `
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const toastId = toast.loading(\`Uploading \${files.length} image(s)...\`);
      
      let insertedText = "";
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await uploadToGitHub(dataUrl, 'guide-images', file.name);
        insertedText += \`\\n![\${file.name}](\${result.url})\\n\`;
      }
      
      insertText(insertedText);
      toast.success("Image(s) uploaded successfully", { id: toastId });
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to upload image(s)");
    }
  };
`;

if (content.includes('const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {') && !content.includes('files.length === 0')) {
  const startIdx = content.indexOf('const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {');
  const endIdx = content.indexOf('const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {');
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + MULTIPLE_IMAGES_LOGIC + '\\n  ' + content.substring(endIdx);
  }
}

// 5. Add advanced image tool (alignment) to Toolbar
const ADVANCED_IMAGE_MODAL_STATE = 'const [showAdvancedImageModal, setShowAdvancedImageModal] = useState(false);';
if (!content.includes(ADVANCED_IMAGE_MODAL_STATE)) {
  content = content.replace(
    'const [showDownloadLinkModal, setShowDownloadLinkModal] = useState(false);',
    'const [showDownloadLinkModal, setShowDownloadLinkModal] = useState(false);\\n  const [showAdvancedImageModal, setShowAdvancedImageModal] = useState(false);'
  );
}

// Replace standard image input trigger with modal opening
if (content.includes('onClick={() => document.getElementById("image-upload")?.click()}')) {
  content = content.replace(
    'onClick={() => document.getElementById("image-upload")?.click()}',
    'onClick={() => setShowAdvancedImageModal(true)}'
  );
}

// 6. Add Advanced Image Modal form component
const ADVANCED_IMAGE_MODAL_COMPONENT = `
function AdvancedImageModalForm({
  onInsert,
  onClose,
}: {
  onInsert: (content: string) => void;
  onClose: () => void;
}) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [alignment, setAlignment] = React.useState<"none" | "left" | "center" | "right">("none");
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleInsert = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const toastId = toast.loading(\`Uploading \${files.length} image(s)...\`);
      let insertedText = "";
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await uploadToGitHub(dataUrl, 'guide-images', file.name);
        
        let alignHash = "";
        if (alignment === "left") alignHash = "#align-left";
        if (alignment === "right") alignHash = "#align-right";
        if (alignment === "center") alignHash = "#align-center";
        
        insertedText += \`\\n![\${file.name}](\${result.url}\${alignHash})\\n\`;
      }
      
      onInsert(insertedText);
      toast.success("Image(s) uploaded successfully", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image(s)");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Images (Multiple allowed)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        
        {files.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image Alignment</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setAlignment("none")}
                className={\`flex-1 py-2 rounded-md text-sm font-medium transition-colors \${alignment === "none" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}\`}
              >Default</button>
              <button 
                onClick={() => setAlignment("left")}
                className={\`flex-1 py-2 rounded-md text-sm font-medium transition-colors \${alignment === "left" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}\`}
              >Left</button>
              <button 
                onClick={() => setAlignment("center")}
                className={\`flex-1 py-2 rounded-md text-sm font-medium transition-colors \${alignment === "center" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}\`}
              >Center</button>
              <button 
                onClick={() => setAlignment("right")}
                className={\`flex-1 py-2 rounded-md text-sm font-medium transition-colors \${alignment === "right" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}\`}
              >Right</button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50" disabled={isUploading}>Cancel</button>
          <button onClick={handleInsert} className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" disabled={files.length === 0 || isUploading}>
            {isUploading ? "Uploading..." : "Insert Image(s)"}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

if (!content.includes('function AdvancedImageModalForm')) {
  content = content.replace('// Separate component for playground preview', ADVANCED_IMAGE_MODAL_COMPONENT + '\\n// Separate component for playground preview');
}

const ADVANCED_IMAGE_MODAL_RENDER = `
      {/* Advanced Image Modal */}
      {showAdvancedImageModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdvancedImageModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Upload & Format Image</h3>
              <button onClick={() => setShowAdvancedImageModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <AdvancedImageModalForm
              onInsert={(content: string) => { insertText(content); setShowAdvancedImageModal(false); }}
              onClose={() => setShowAdvancedImageModal(false)}
            />
          </div>
        </div>
      )}`;

if (!content.includes('showAdvancedImageModal &&')) {
  content = content.replace('{/* Download Link Modal */}', ADVANCED_IMAGE_MODAL_RENDER + '\\n\\n      {/* Download Link Modal */}');
}

fs.writeFileSync(file, content);
console.log("Images patch applied successfully.");
