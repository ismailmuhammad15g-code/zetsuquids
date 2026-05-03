// patch_playground.js - Injects playground support into AddGuideModal.tsx
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AddGuideModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// ─── STEP 1: Add playground renderer block after quiz block ───────────────────
const QUIZ_END_MARKER = "        return `<pre class=\"bg-red-50 text-red-600 p-4 rounded border border-red-200\">Error rendering quiz</pre>`;\r\n      }\r\n    }\r\n";
const PLAYGROUND_BLOCK = `        return \`<pre class="bg-red-50 text-red-600 p-4 rounded border border-red-200">Error rendering quiz</pre>\`;\r\n      }\r\n    }\r\n\r\n    if (lang === "playground") {\r\n      try {\r\n        const rawText = typeof code === "object" ? (code as any).text : String(text);\r\n        const data = JSON.parse(rawText);\r\n        const pgHtml = data.html || "";\r\n        const pgCss = data.css || "";\r\n        const pgJs = data.js || "";\r\n        const pgTitle = (data.title || "Live Demo").replace(/"/g, "&quot;");\r\n        const srcdoc = "<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>" + pgCss + "</style></head><body>" + pgHtml + "<script>" + pgJs + "<\\/script></body></html>";\r\n        const encodedSrc = Buffer.from(srcdoc).toString("base64");\r\n        return '<div class="zetsu-playground my-8 rounded-2xl overflow-hidden border border-gray-200 shadow-md"><div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:#111827;color:#fff;font-family:monospace;font-size:13px"><span style="display:flex;gap:6px"><span style="width:12px;height:12px;border-radius:50%;background:#f87171;display:inline-block"></span><span style="width:12px;height:12px;border-radius:50%;background:#fbbf24;display:inline-block"></span><span style="width:12px;height:12px;border-radius:50%;background:#34d399;display:inline-block"></span></span><span style="opacity:0.7;margin-left:8px">' + pgTitle + '</span></div><iframe sandbox="allow-scripts" src="data:text/html;base64,' + encodedSrc + '" style="width:100%;height:360px;border:none;display:block" loading="lazy" title="' + pgTitle + '"></iframe></div>';\r\n      } catch (e) {\r\n        return \`<pre class="bg-red-50 text-red-600 p-4 rounded border border-red-200">Playground error: \${String(e)}</pre>\`;\r\n      }\r\n    }\r\n`;

if (!content.includes('if (lang === "playground")')) {
  if (content.includes(QUIZ_END_MARKER)) {
    content = content.replace(QUIZ_END_MARKER, PLAYGROUND_BLOCK);
    console.log('✅ Step 1: playground renderer injected');
  } else {
    console.log('❌ Step 1: quiz end marker not found – check CRLF vs LF');
    process.exit(1);
  }
} else {
  console.log('ℹ️  Step 1: already present, skipping');
}

// ─── STEP 2: Add showPlaygroundModal state ────────────────────────────────────
const STATE_MARKER = '  const [showKeyValueModal, setShowKeyValueModal] = useState(false);\r\n\r\n  const [formData, setFormData] = useState({';
const STATE_WITH_PLAYGROUND = '  const [showKeyValueModal, setShowKeyValueModal] = useState(false);\r\n  const [showPlaygroundModal, setShowPlaygroundModal] = useState(false);\r\n\r\n  const [formData, setFormData] = useState({';

if (!content.includes('showPlaygroundModal')) {
  if (content.includes(STATE_MARKER)) {
    content = content.replace(STATE_MARKER, STATE_WITH_PLAYGROUND);
    console.log('✅ Step 2: showPlaygroundModal state added');
  } else {
    console.log('❌ Step 2: state marker not found');
    process.exit(1);
  }
} else {
  console.log('ℹ️  Step 2: state already present, skipping');
}

fs.writeFileSync(file, content, 'utf8');
console.log('✅ Steps 1-2 saved.');
