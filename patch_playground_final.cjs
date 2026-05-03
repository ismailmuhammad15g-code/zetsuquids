// patch_playground_final.cjs
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AddGuideModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// ─── STEP 3: Add playground toolbar button ───────────────────────────────────
const QUIZ_TOOLTIP = 'tooltip="Insert Interactive Quiz"\n              />';
const QUIZ_AND_PLAYGROUND = 'tooltip="Insert Interactive Quiz"\n              />\n              <ToolbarButton\n                icon={<Terminal size={18} className="text-emerald-600" />}\n                onClick={() => setShowPlaygroundModal(true)}\n                tooltip="Code Playground — HTML/CSS/JS"\n              />';

if (!content.includes('showPlaygroundModal(true)')) {
  if (content.includes(QUIZ_TOOLTIP)) {
    content = content.replace(QUIZ_TOOLTIP, QUIZ_AND_PLAYGROUND);
    console.log('✅ Step 3: Playground toolbar button added');
  } else {
    // try CRLF variant
    const QUIZ_TOOLTIP_CRLF = 'tooltip="Insert Interactive Quiz"\r\n              />';
    const QUIZ_AND_PLAYGROUND_CRLF = 'tooltip="Insert Interactive Quiz"\r\n              />\r\n              <ToolbarButton\r\n                icon={<Terminal size={18} className="text-emerald-600" />}\r\n                onClick={() => setShowPlaygroundModal(true)}\r\n                tooltip="Code Playground — HTML/CSS/JS"\r\n              />';
    if (content.includes(QUIZ_TOOLTIP_CRLF)) {
      content = content.replace(QUIZ_TOOLTIP_CRLF, QUIZ_AND_PLAYGROUND_CRLF);
      console.log('✅ Step 3: Playground toolbar button added (CRLF)');
    } else {
      console.log('❌ Step 3 failed: could not find quiz tooltip marker');
      // dump what we have around the area
      const idx = content.indexOf('Insert Interactive Quiz');
      if (idx !== -1) console.log('Context:', JSON.stringify(content.slice(idx - 50, idx + 200)));
      process.exit(1);
    }
  }
} else {
  console.log('ℹ️  Step 3: already present');
}

// ─── STEP 4: Add Playground Modal render block ───────────────────────────────
// Insert before the main content div
const MAIN_DIV = '      <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-gray-50/50">';

const PLAYGROUND_MODAL_BLOCK = `      {/* ZetsuPlayground Modal */}
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
      )}

      <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-gray-50/50">`;

if (!content.includes('ZetsuPlayground')) {
  if (content.includes(MAIN_DIV)) {
    content = content.replace(MAIN_DIV, PLAYGROUND_MODAL_BLOCK);
    console.log('✅ Step 4: Playground modal render block added');
  } else {
    console.log('❌ Step 4: main div marker not found');
    process.exit(1);
  }
} else {
  console.log('ℹ️  Step 4: already present');
}

// ─── STEP 5: Add PlaygroundModalForm component ───────────────────────────────
const TOOLBAR_BTN_IFACE = 'interface ToolbarButtonProps {';

const PLAYGROUND_COMPONENT = `// ─── ZetsuPlayground Modal Form ──────────────────────────────────────────────
import React from "react"; // needed for React.useState inside function component

function PlaygroundModalForm({
  onInsert,
  onClose,
}: {
  onInsert: (code: string) => void;
  onClose: () => void;
}) {
  const [pgHtml, setPgHtml] = React.useState('');
  const [pgCss, setPgCss] = React.useState('');
  const [pgJs, setPgJs] = React.useState(\`document.addEventListener('DOMContentLoaded', () => {\n  // Your JavaScript here\n});\`);
  const [pgTitle, setPgTitle] = React.useState('Live Demo');
  const [previewKey, setPreviewKey] = React.useState(0);

  const srcdoc = \`<!DOCTYPE html><html><head><meta charset="utf-8"><style>\${pgCss}</style></head><body>\${pgHtml}<script>\${pgJs}<\\/script></body></html>\`;

  const handleInsert = () => {
    const data = JSON.stringify({ title: pgTitle, html: pgHtml, css: pgCss, js: pgJs }, null, 2);
    onInsert(\`\n\\\`\\\`\\\`playground\n\${data}\n\\\`\\\`\\\`\n\`);
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
          {/* HTML */}
          <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
            <div className="px-3 py-1 text-xs font-bold text-orange-400 font-mono bg-gray-900 border-b border-gray-800 flex-shrink-0">
              HTML
            </div>
            <textarea
              value={pgHtml}
              onChange={(e) => setPgHtml(e.target.value)}
              placeholder={'<h1>Hello World</h1>\\n<button id=\\"btn\\">Click me!</button>'}
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-3 focus:outline-none"
              spellCheck={false}
            />
          </div>
          {/* CSS */}
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
          {/* JS */}
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

interface ToolbarButtonProps {`;

if (!content.includes('PlaygroundModalForm')) {
  if (content.includes(TOOLBAR_BTN_IFACE)) {
    // Remove the "import React from 'react';" comment trick — React is already via JSX transform
    const componentClean = PLAYGROUND_COMPONENT.replace('\nimport React from "react"; // needed for React.useState inside function component\n\n', '\n');
    content = content.replace(TOOLBAR_BTN_IFACE, componentClean);
    console.log('✅ Step 5: PlaygroundModalForm component added');
  } else {
    console.log('❌ Step 5: ToolbarButtonProps marker not found');
    process.exit(1);
  }
} else {
  console.log('ℹ️  Step 5: already present');
}

// ─── STEP 6: Add React import at top if not present ─────────────────────────
if (!content.includes("import React,") && !content.includes("import React from")) {
  // add it after the "use client" line
  content = content.replace(
    '"use client";\n// Refreshed at 2026-05-02\n',
    '"use client";\n// Refreshed at 2026-05-02\nimport React from "react";\n'
  );
  // also try CRLF
  content = content.replace(
    '"use client";\r\n// Refreshed at 2026-05-02\r\n',
    '"use client";\r\n// Refreshed at 2026-05-02\r\nimport React from "react";\r\n'
  );
  console.log('✅ Step 6: React import added');
} else {
  console.log('ℹ️  Step 6: React already imported');
}

fs.writeFileSync(file, content, 'utf8');
console.log('\n✅ All steps done! File saved.');
