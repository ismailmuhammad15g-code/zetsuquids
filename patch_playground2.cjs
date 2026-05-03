// patch_playground2.cjs - Adds toolbar button, modal render, and PlaygroundModalForm
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AddGuideModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// ─── STEP 3: Add toolbar button for Playground ───────────────────────────────
const QUIZ_BTN = `              <ToolbarButton
                icon={<HelpCircle size={18} className="text-indigo-600" />}
                onClick={() => setShowQuizBuilder(true)}
                tooltip="Insert Interactive Quiz"
              />`;

const QUIZ_AND_PLAYGROUND_BTN = `              <ToolbarButton
                icon={<HelpCircle size={18} className="text-indigo-600" />}
                onClick={() => setShowQuizBuilder(true)}
                tooltip="Insert Interactive Quiz"
              />
              <ToolbarButton
                icon={<Terminal size={18} className="text-emerald-600" />}
                onClick={() => setShowPlaygroundModal(true)}
                tooltip="Code Playground (HTML/CSS/JS)"
              />`;

if (!content.includes('setShowPlaygroundModal(true)')) {
  // Try both CRLF and LF versions
  const crlfBtn = QUIZ_BTN.replace(/\n/g, '\r\n');
  const crlfReplacement = QUIZ_AND_PLAYGROUND_BTN.replace(/\n/g, '\r\n');
  
  if (content.includes(crlfBtn)) {
    content = content.replace(crlfBtn, crlfReplacement);
    console.log('✅ Step 3: Playground toolbar button added (CRLF)');
  } else if (content.includes(QUIZ_BTN)) {
    content = content.replace(QUIZ_BTN, QUIZ_AND_PLAYGROUND_BTN);
    console.log('✅ Step 3: Playground toolbar button added (LF)');
  } else {
    console.log('❌ Step 3: Quiz button marker not found');
    process.exit(1);
  }
} else {
  console.log('ℹ️  Step 3: already present, skipping');
}

// ─── STEP 4: Add Playground Modal render block ───────────────────────────────
// Find the Key-Value modal ending and add Playground modal after it
const KEYVALUE_MODAL_END = `        </div>\r\n      )}\r\n\r\n      <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-gray-50/50">`;

const KEYVALUE_AND_PLAYGROUND_MODAL = `        </div>\r\n      )}\r\n\r\n      {/* Playground Modal */}\r\n      {showPlaygroundModal && (\r\n        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPlaygroundModal(false)}>\r\n          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col" style={{maxHeight: '90vh'}} onClick={(e: React.MouseEvent) => e.stopPropagation()}>\r\n            <div className="flex items-center gap-3 px-6 py-4 bg-gray-900">\r\n              <div className="flex gap-1.5">\r\n                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />\r\n                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />\r\n                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />\r\n              </div>\r\n              <h3 className="text-sm font-semibold text-white font-mono ml-2 flex-1">ZetsuPlayground — Live Code Editor</h3>\r\n              <button onClick={() => setShowPlaygroundModal(false)} className="p-1 hover:bg-white/10 rounded-md transition-colors text-white">\r\n                <X size={18} />\r\n              </button>\r\n            </div>\r\n            <PlaygroundModalForm\r\n              onInsert={(code: string) => {\r\n                insertText(code);\r\n                setShowPlaygroundModal(false);\r\n                toast.success('Live Playground inserted! 🚀');\r\n              }}\r\n              onClose={() => setShowPlaygroundModal(false)}\r\n            />\r\n          </div>\r\n        </div>\r\n      )}\r\n\r\n      <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-gray-50/50">`;

if (!content.includes('ZetsuPlayground')) {
  if (content.includes(KEYVALUE_MODAL_END)) {
    content = content.replace(KEYVALUE_MODAL_END, KEYVALUE_AND_PLAYGROUND_MODAL);
    console.log('✅ Step 4: Playground modal render block added');
  } else {
    console.log('❌ Step 4: Key-Value modal end marker not found');
    process.exit(1);
  }
} else {
  console.log('ℹ️  Step 4: already present, skipping');
}

// ─── STEP 5: Add PlaygroundModalForm component before ToolbarButton ──────────
const TOOLBAR_BTN_DEF = `interface ToolbarButtonProps {`;

const PLAYGROUND_FORM_COMPONENT = `// ─── ZetsuPlayground Modal Form ─────────────────────────────────────────────
function PlaygroundModalForm({ onInsert, onClose }: { onInsert: (code: string) => void; onClose: () => void }) {
  const [pgHtml, setPgHtml] = React.useState('');
  const [pgCss, setPgCss] = React.useState('');
  const [pgJs, setPgJs] = React.useState('');
  const [pgTitle, setPgTitle] = React.useState('Live Demo');
  const [previewKey, setPreviewKey] = React.useState(0);

  const srcdoc = "<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>" + pgCss + "</style></head><body>" + pgHtml + "<script>" + pgJs + "<\\/script></body></html>";

  const handleInsert = () => {
    const data = JSON.stringify({ title: pgTitle, html: pgHtml, css: pgCss, js: pgJs }, null, 2);
    const block = \`\\\n\\\`\\\`\\\`playground\\\n\${data}\\\n\\\`\\\`\\\`\\\n\`;
    onInsert(block);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Title Row */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Title</label>
        <input
          type="text"
          value={pgTitle}
          onChange={(e) => setPgTitle(e.target.value)}
          placeholder="Live Demo"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
        <button
          type="button"
          onClick={() => setPreviewKey(k => k + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>
          Run
        </button>
        <button
          type="button"
          onClick={handleInsert}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Insert into Guide
        </button>
        <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Editors + Preview */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Code Panels */}
        <div className="flex flex-col w-1/2 border-r border-gray-100 divide-y divide-gray-100 bg-gray-950">
          {/* HTML */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-1.5 text-xs font-bold text-orange-400 font-mono bg-gray-900 border-b border-gray-800">HTML</div>
            <textarea
              value={pgHtml}
              onChange={(e) => setPgHtml(e.target.value)}
              placeholder="<div>Hello World</div>"
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-4 focus:outline-none"
              spellCheck={false}
            />
          </div>
          {/* CSS */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-1.5 text-xs font-bold text-blue-400 font-mono bg-gray-900 border-b border-gray-800">CSS</div>
            <textarea
              value={pgCss}
              onChange={(e) => setPgCss(e.target.value)}
              placeholder="body { font-family: sans-serif; }"
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-4 focus:outline-none"
              spellCheck={false}
            />
          </div>
          {/* JS */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-1.5 text-xs font-bold text-yellow-400 font-mono bg-gray-900 border-b border-gray-800">JavaScript</div>
            <textarea
              value={pgJs}
              onChange={(e) => setPgJs(e.target.value)}
              placeholder="console.log('Hello!')"
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-4 focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="px-4 py-1.5 text-xs font-bold text-gray-500 font-mono bg-gray-50 border-b border-gray-100">Preview</div>
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

interface ToolbarButtonProps {`;

if (!content.includes('PlaygroundModalForm')) {
  if (content.includes(TOOLBAR_BTN_DEF)) {
    content = content.replace(TOOLBAR_BTN_DEF, PLAYGROUND_FORM_COMPONENT);
    console.log('✅ Step 5: PlaygroundModalForm component added');
  } else {
    console.log('❌ Step 5: ToolbarButtonProps marker not found');
    process.exit(1);
  }
} else {
  console.log('ℹ️  Step 5: already present, skipping');
}

// Also make sure React is imported for React.useState in the new component
if (!content.includes("import React")) {
  content = content.replace('"use client";\n// Refreshed at 2026-05-02\n', '"use client";\n// Refreshed at 2026-05-02\nimport React from "react";\n');
  content = content.replace('"use client";\r\n// Refreshed at 2026-05-02\r\n', '"use client";\r\n// Refreshed at 2026-05-02\r\nimport React from "react";\r\n');
  console.log('✅ Added React import');
}

fs.writeFileSync(file, content, 'utf8');
console.log('✅ All steps saved successfully!');
