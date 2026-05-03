const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AddGuideModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Import DownloadLinkModalForm
content = content.replace(
  '  VersionModalForm,\n  VideoModalForm,\n} from "./AddGuideModals";',
  '  VersionModalForm,\n  VideoModalForm,\n  DownloadLinkModalForm,\n} from "./AddGuideModals";'
);

// 2. Fix playground rendering logic in quizRenderer
content = content.replace(
  '    // Manual fallback for normal code blocks',
  `    if (lang === "playground") {
      try {
        const rawText = (typeof code === "object" ? code.text : String(text)).trim();
        const encoded = btoa(encodeURIComponent(rawText));
        return \`<div class="zetsu-playground-container my-8"><div class="playground-data" style="display:none;">\${encoded}</div></div>\`;
      } catch (e) {
        return \`<pre class="bg-red-50 text-red-600 p-4 rounded border border-red-200">Playground error: \${String(e)}</pre>\`;
      }
    }

    // Manual fallback for normal code blocks`
);

// 3. Add PlaygroundPreview and PlaygroundModalForm components
const PLAYGROUND_COMPONENTS = `
// Separate component for playground preview to manage its own state (reload)
function PlaygroundPreview({ data }: { data: any }) {
  const [activeTab, setActiveTab] = React.useState<"html" | "css" | "js" | "result">("result");
  const [zoom, setZoom] = React.useState(1);
  const [reloadKey, setReloadKey] = React.useState(0);

  const handleZoom = (level: number) => {
    setZoom(level);
  };
  
  return (
    <div className="my-8 rounded overflow-hidden border flex flex-col font-mono" style={{ borderColor: '#444857', backgroundColor: '#1e1e1e', height: '400px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-[#1e1e1e] text-xs" style={{ borderColor: '#444857' }}>
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab("html")}
            className={\`px-3 py-1.5 rounded-sm transition-colors \${activeTab === "html" ? "bg-[#444857] text-white" : "text-[#858585] hover:text-white"}\`}
          >HTML</button>
          <button 
            onClick={() => setActiveTab("css")}
            className={\`px-3 py-1.5 rounded-sm transition-colors \${activeTab === "css" ? "bg-[#444857] text-white" : "text-[#858585] hover:text-white"}\`}
          >CSS</button>
          <button 
            onClick={() => setActiveTab("js")}
            className={\`px-3 py-1.5 rounded-sm transition-colors \${activeTab === "js" ? "bg-[#444857] text-white" : "text-[#858585] hover:text-white"}\`}
          >JS</button>
          <button 
            onClick={() => setActiveTab("result")}
            className={\`px-3 py-1.5 rounded-sm transition-colors \${activeTab === "result" ? "bg-[#444857] text-white font-semibold" : "text-[#858585] hover:text-white"}\`}
          >Result</button>
        </div>
        <div className="flex items-center gap-2 text-[#858585]">
          <span className="uppercase text-[10px] tracking-widest font-semibold">Edit on</span>
          <div className="flex items-center gap-1.5 text-white font-bold tracking-widest text-xs">
            <Code size={16} className="text-white" />
            <span>ZETSUGUIDE</span>
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {activeTab === "result" ? (
          <div className="w-full h-full relative" style={{ transform: \`scale(\${zoom})\`, transformOrigin: 'top left', width: \`\${100 / zoom}%\`, height: \`\${100 / zoom}%\` }}>
            <iframe
              key={reloadKey}
              sandbox="allow-scripts"
              srcDoc={\`<!DOCTYPE html><html><head><meta charset="utf-8"><style>\${data.css || "body{font-family:sans-serif;padding:20px;}"}</style></head><body>\${data.html || ""}<script>\${data.js || ""}</script></body></html>\`}
              className="w-full h-full border-none block bg-white"
              title={data.title || "Live Demo"}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-[#1e1e1e] p-4 overflow-auto text-sm text-[#d4d4d4]">
             <pre><code>{data[activeTab] || ""}</code></pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-[#1e1e1e] text-xs" style={{ borderColor: '#444857' }}>
        <button className="px-3 py-1.5 bg-[#444857] text-[#cccccc] hover:text-white rounded-sm transition-colors font-medium">Resources</button>
        <div className="flex gap-1 bg-[#343436] rounded-sm p-0.5">
          <button onClick={() => handleZoom(1)} className={\`px-2.5 py-1 rounded-sm transition-colors font-medium \${zoom === 1 ? "bg-[#5a5f73] text-white" : "text-[#cccccc] hover:text-white"}\`}>1x</button>
          <button onClick={() => handleZoom(0.5)} className={\`px-2.5 py-1 rounded-sm transition-colors font-medium \${zoom === 0.5 ? "bg-[#5a5f73] text-white" : "text-[#cccccc] hover:text-white"}\`}>0.5x</button>
          <button onClick={() => handleZoom(0.25)} className={\`px-2.5 py-1 rounded-sm transition-colors font-medium \${zoom === 0.25 ? "bg-[#5a5f73] text-white" : "text-[#cccccc] hover:text-white"}\`}>0.25x</button>
        </div>
        <button 
          onClick={() => { setActiveTab("result"); setReloadKey(k => k + 1); }}
          className="px-4 py-1.5 bg-[#444857] text-[#cccccc] hover:text-white rounded-sm transition-colors font-medium"
        >Rerun</button>
      </div>
    </div>
  );
}

function PlaygroundModalForm({
  onInsert,
  onClose,
}: {
  onInsert: (code: string) => void;
  onClose: () => void;
}) {
  const [pgHtml, setPgHtml] = React.useState('');
  const [pgCss, setPgCss] = React.useState('');
  const [pgJs, setPgJs] = React.useState(\`document.addEventListener('DOMContentLoaded', () => {\\n  // Your JavaScript here\\n});\`);
  const [pgTitle, setPgTitle] = React.useState('Live Demo');
  const [previewKey, setPreviewKey] = React.useState(0);

  const srcdoc = \`<!DOCTYPE html><html><head><meta charset="utf-8"><style>\${pgCss}</style></head><body>\${pgHtml}<script>\${pgJs}</script></body></html>\`;

  const handleInsert = () => {
    const data = JSON.stringify({ title: pgTitle, html: pgHtml, css: pgCss, js: pgJs }, null, 2);
    onInsert(\`\\n\\\`\\\`\\\`playground\\n\${data}\\n\\\`\\\`\\\`\\n\`);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Title</label>
        <input
          type="text"
          value={pgTitle}
          onChange={(e) => setPgTitle(e.target.value)}
          placeholder="Live Demo"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        />
        <button
          type="button"
          onClick={() => setPreviewKey(k => k + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          ▶ Run
        </button>
        <button
          type="button"
          onClick={handleInsert}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          ✓ Insert into Guide
        </button>
      </div>

      {/* Editors + Preview side by side */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0, height: '500px' }}>
        {/* Code panels */}
        <div className="flex flex-col w-1/2 border-r border-gray-200 bg-gray-950 divide-y divide-gray-800">
          <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
            <div className="px-3 py-1 text-xs font-bold text-orange-400 font-mono bg-gray-900 border-b border-gray-800 flex-shrink-0">
              HTML
            </div>
            <textarea
              value={pgHtml}
              onChange={(e) => setPgHtml(e.target.value)}
              placeholder={'<h1>Hello World</h1>\\n<button id="btn">Click me!</button>'}
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-3 focus:outline-none"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
            <div className="px-3 py-1 text-xs font-bold text-blue-400 font-mono bg-gray-900 border-b border-gray-800 flex-shrink-0">
              CSS
            </div>
            <textarea
              value={pgCss}
              onChange={(e) => setPgCss(e.target.value)}
              placeholder="body { font-family: sans-serif; padding: 20px; }"
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-3 focus:outline-none"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
            <div className="px-3 py-1 text-xs font-bold text-yellow-400 font-mono bg-gray-900 border-b border-gray-800 flex-shrink-0">
              JavaScript
            </div>
            <textarea
              value={pgJs}
              onChange={(e) => setPgJs(e.target.value)}
              placeholder="document.getElementById('btn').onclick = () => alert('Hi!');"
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-3 focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="px-3 py-1 text-xs font-bold text-gray-500 font-mono bg-gray-50 border-b border-gray-100 flex-shrink-0">
            Preview
          </div>
          <iframe
            key={previewKey}
            sandbox="allow-scripts"
            srcDoc={srcdoc}
            className="flex-1 border-none"
            title="Playground Preview"
          />
        </div>
      </div>
    </div>
  );
}

export default function AddGuideModal`;

content = content.replace('export default function AddGuideModal', PLAYGROUND_COMPONENTS);

// 4. Add state variables
content = content.replace(
  '  const [showKeyValueModal, setShowKeyValueModal] = useState(false);',
  '  const [showKeyValueModal, setShowKeyValueModal] = useState(false);\n  const [showPlaygroundModal, setShowPlaygroundModal] = useState(false);\n  const [showDownloadLinkModal, setShowDownloadLinkModal] = useState(false);'
);

// 5. Add hydration logic for Playground
const PLAYGROUND_HYDRATION = `
        // --- Playgrounds ---
        const pgContainers = document.querySelectorAll(".zetsu-playground-container");
        pgContainers.forEach((container: any) => {
          if (container.getAttribute("data-hydrated") === "true") return;

          const dataEl = container.querySelector('.playground-data');
          if (!dataEl) return;
          const encoded = dataEl.textContent;
          if (!encoded) return;

          try {
            const decoded = decodeURIComponent(atob(encoded)).trim();
            const firstBrace = decoded.indexOf('{');
            const lastBrace = decoded.lastIndexOf('}');
            if (firstBrace === -1 || lastBrace === -1) throw new Error("Invalid JSON structure");
            const jsonStr = decoded.substring(firstBrace, lastBrace + 1);
            
            const data = JSON.parse(jsonStr);
            const root = createRoot(container);
            root.render(<PlaygroundPreview data={data} />);
            container.setAttribute("data-hydrated", "true");
          } catch (e) {
            console.error("Playground hydration error", e);
            container.innerHTML = \`<div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-mono text-xs">
              <div class="font-bold mb-1">Playground Error</div>
              <div>\${String(e)}</div>
              <div class="mt-2 opacity-70">Check if your JSON has extra characters or missing braces.</div>
            </div>\`;
          }
        });

        // --- Mermaid diagrams ---`;

content = content.replace('        // --- Mermaid diagrams ---', PLAYGROUND_HYDRATION);

// 6. Add Toolbar Buttons
content = content.replace(
  '              <ToolbarButton\n                icon={<Table size={18} />}\n                onClick={() => handleToolbarAction("table")}\n                tooltip="Insert table"\n              />',
  '              <ToolbarButton\n                icon={<Table size={18} />}\n                onClick={() => handleToolbarAction("table")}\n                tooltip="Insert table"\n              />\n              <div\n                className="hidden sm:block w-px h-5 bg-gray-100 mx-2"\n                aria-hidden="true"\n              />\n              <ToolbarButton\n                icon={<Terminal size={18} className="text-emerald-600" />}\n                onClick={() => setShowPlaygroundModal(true)}\n                tooltip="Code Playground — HTML/CSS/JS"\n              />'
);

content = content.replace(
  '                      <button\n                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"\n                        onClick={() => { handleToolbarAction("key-value"); setShowMoreTools(false); }}\n                        title="Key-Value"\n                      >\n                        <Key size={16} />\n                        <span>KeyValue</span>\n                      </button>',
  '                      <button\n                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"\n                        onClick={() => { handleToolbarAction("key-value"); setShowMoreTools(false); }}\n                        title="Key-Value"\n                      >\n                        <Key size={16} />\n                        <span>KeyValue</span>\n                      </button>\n\n                      <button\n                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"\n                        onClick={() => { setShowDownloadLinkModal(true); setShowMoreTools(false); }}\n                        title="Download Link"\n                      >\n                        <Download size={16} />\n                        <span>D/L Link</span>\n                      </button>'
);

// 7. Render modals
const MODALS = `      {/* Interactive Key-Value Modal */}
      {showKeyValueModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowKeyValueModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Key-Value</h3>
              <button onClick={() => setShowKeyValueModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <KeyValueModalForm
              onInsert={(content: string) => { insertText(content); setShowKeyValueModal(false); toast.success("Key-Value inserted!"); }}
              onClose={() => setShowKeyValueModal(false)}
            />
          </div>
        </div>
      )}

      {/* Download Link Modal */}
      {showDownloadLinkModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDownloadLinkModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Download Link</h3>
              <button onClick={() => setShowDownloadLinkModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <DownloadLinkModalForm
              onInsert={(content: string) => { insertText(content); setShowDownloadLinkModal(false); toast.success("Download Link inserted!"); }}
              onClose={() => setShowDownloadLinkModal(false)}
            />
          </div>
        </div>
      )}

      {/* ZetsuPlayground Modal */}
      {showPlaygroundModal && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPlaygroundModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ maxHeight: '90vh' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-6 py-3 bg-gray-900 flex-shrink-0">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
              </div>
              <span className="text-sm font-semibold text-white font-mono ml-2 flex-1">ZetsuPlayground — Live Code Editor</span>
              <button onClick={() => setShowPlaygroundModal(false)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white">
                <X size={16} />
              </button>
            </div>
            <PlaygroundModalForm
              onInsert={(code: string) => {
                insertText(code);
                setShowPlaygroundModal(false);
                toast.success('Live Playground inserted! 🚀');
              }}
              onClose={() => setShowPlaygroundModal(false)}
            />
          </div>
        </div>
      )}`;

content = content.replace(
  '      {/* Interactive Key-Value Modal */}\n      {showKeyValueModal && (\n        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowKeyValueModal(false)}>\n          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>\n            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">\n              <h3 className="text-lg font-bold text-gray-900">Key-Value</h3>\n              <button onClick={() => setShowKeyValueModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>\n            </div>\n            <KeyValueModalForm\n              onInsert={(content: string) => { insertText(content); setShowKeyValueModal(false); toast.success("Key-Value inserted!"); }}\n              onClose={() => setShowKeyValueModal(false)}\n            />\n          </div>\n        </div>\n      )}',
  MODALS
);

fs.writeFileSync(file, content);
console.log("Successfully patched AddGuideModal.tsx");
