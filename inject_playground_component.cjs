// inject_playground_component.cjs - injects PlaygroundModalForm function definition
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AddGuideModal.tsx');
let content = fs.readFileSync(file, 'utf8');

const MARKER = 'interface ToolbarButtonProps {';

if (content.includes('function PlaygroundModalForm')) {
  console.log('ℹ️  Component already defined, skipping');
  process.exit(0);
}

const COMPONENT = `function PlaygroundModalForm({
  onInsert,
  onClose,
}: {
  onInsert: (code: string) => void;
  onClose: () => void;
}) {
  const [pgHtml, setPgHtml] = React.useState('');
  const [pgCss, setPgCss] = React.useState('body {\\n  font-family: sans-serif;\\n  padding: 20px;\\n}');
  const [pgJs, setPgJs] = React.useState('');
  const [pgTitle, setPgTitle] = React.useState('Live Demo');
  const [previewKey, setPreviewKey] = React.useState(0);

  const srcdoc = \`<!DOCTYPE html><html><head><meta charset="utf-8"><style>\${pgCss}</style></head><body>\${pgHtml}<script>\${pgJs}<\\/script></body></html>\`;

  const handleInsert = () => {
    const data = JSON.stringify({ title: pgTitle, html: pgHtml, css: pgCss, js: pgJs }, null, 2);
    onInsert(\`\\n\\\`\\\`\\\`playground\\n\${data}\\n\\\`\\\`\\\`\\n\`);
  };

  return (
    <div className="flex flex-col" style={{ height: '520px', minHeight: 0 }}>
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

      {/* Editors + Preview */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Code panels */}
        <div className="flex flex-col w-1/2 border-r border-gray-200 bg-gray-950 divide-y divide-gray-800">
          <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
            <div className="px-3 py-1 text-xs font-bold text-orange-400 font-mono bg-gray-900 border-b border-gray-800 flex-shrink-0">HTML</div>
            <textarea
              value={pgHtml}
              onChange={(e) => setPgHtml(e.target.value)}
              placeholder={'<h1>Hello World!</h1>\\n<button id=\\"btn\\">Click me</button>'}
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-3 focus:outline-none"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
            <div className="px-3 py-1 text-xs font-bold text-blue-400 font-mono bg-gray-900 border-b border-gray-800 flex-shrink-0">CSS</div>
            <textarea
              value={pgCss}
              onChange={(e) => setPgCss(e.target.value)}
              placeholder="h1 { color: #6366f1; }"
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-3 focus:outline-none"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
            <div className="px-3 py-1 text-xs font-bold text-yellow-400 font-mono bg-gray-900 border-b border-gray-800 flex-shrink-0">JavaScript</div>
            <textarea
              value={pgJs}
              onChange={(e) => setPgJs(e.target.value)}
              placeholder={"document.getElementById('btn').onclick = () => alert('Hello!');"}
              className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-3 focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>
        {/* Preview */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="px-3 py-1 text-xs font-bold text-gray-500 font-mono bg-gray-50 border-b border-gray-100 flex-shrink-0">Preview</div>
          <iframe
            key={previewKey}
            sandbox="allow-scripts"
            srcDoc={srcdoc}
            className="flex-1 border-none w-full"
            title="Playground Preview"
          />
        </div>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {`;

if (content.includes(MARKER)) {
  content = content.replace(MARKER, COMPONENT);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ PlaygroundModalForm component injected successfully!');
} else {
  console.log('❌ Marker not found');
  process.exit(1);
}
