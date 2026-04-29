"use client";

import { ArrowLeft, Check, Copy, ExternalLink, Eye, Heart, Layers, Moon, Pencil, Sun, Code2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { getAvatarForUser } from "../../../../lib/avatar";
import { uiComponentsApi } from "../../../../lib/supabase";
import { UiComponent } from "../../../../types";

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

/** Build the iframe srcdoc for a React (TSX) component using Babel + importmap + esm.sh */
function buildReactSrcDoc(reactFiles: { name: string; content: string }[], isDarkMode: boolean): string {
  const filesMap: Record<string, string> = {};
  reactFiles.forEach(f => { filesMap[f.name] = f.content; });

  let appCode = filesMap['App.tsx'] || Object.values(filesMap)[0] || 'export default function App() { return <div>No Code</div>; }';

  // Collect external package names (not react/react-dom)
  const esmPackages: string[] = [];
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"./][^'"]*)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(appCode)) !== null) {
    const pkg = m[1].split('/')[0];
    if (pkg !== 'react' && pkg !== 'react-dom' && !esmPackages.includes(pkg)) {
      esmPackages.push(m[1]); // keep full specifier e.g. framer-motion/client
    }
  }

  // Build importmap JSON
  const importmapEntries: Record<string, string> = {
    "react": "https://esm.sh/react@18",
    "react-dom": "https://esm.sh/react-dom@18",
    "react-dom/client": "https://esm.sh/react-dom@18/client",
    "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
  };
  esmPackages.forEach(pkg => {
    if (!importmapEntries[pkg]) {
      importmapEntries[pkg] = `https://esm.sh/${pkg}?external=react,react-dom`;
    }
  });

  const importmapJson = JSON.stringify({ imports: importmapEntries });



  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script async src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">${importmapJson}</script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100%; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: transparent;
      color: ${isDarkMode ? '#f4f4f5' : '#09090b'};
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 3px; }
    #root { width: 100%; display: flex; align-items: center; justify-content: center; }
    .preview-error {
      background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px;
      padding: 16px; color: #dc2626; font-family: monospace; font-size: 13px;
      white-space: pre-wrap; max-width: 100%; overflow: auto;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    window.addEventListener('message', (e) => {
      if (e.data.type === 'CAPTURE_SCREENSHOT') {
        html2canvas(document.body, { backgroundColor: null, logging: false }).then(canvas => {
          window.parent.postMessage({ type: 'SCREENSHOT_DATA', dataUrl: canvas.toDataURL('image/webp', 0.5) }, '*');
        });
      }
    });
  </script>
  <script type="module">
    // Wait for Babel to load via importmap workaround - use direct transform
    import React from 'react';
    import { createRoot } from 'react-dom/client';

    async function loadBabel() {
      return new Promise((resolve, reject) => {
        if (window.Babel) { resolve(window.Babel); return; }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/@babel/standalone@7/babel.min.js';
        s.onload = () => resolve(window.Babel);
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    async function run() {
      const root = document.getElementById('root');
      try {
        const Babel = await loadBabel();

        const rawCode = ${JSON.stringify(appCode)};

        // Transpile JSX/TSX -> JS via Babel (presets: env, react, typescript)
        const transformed = Babel.transform(rawCode, {
          presets: [
            ['env', { modules: 'commonjs' }],
            ['react', { runtime: 'classic' }],
            ['typescript', { allExtensions: true, isTSX: true }],
          ],
          filename: 'App.tsx',
        }).code;

        // Replace bare imports with esm.sh URLs so dynamic import works
        const esmMap = ${JSON.stringify(importmapEntries)};
        const fixedCode = transformed.replace(
          /require\\(["']([^"']+)["']\\)/g,
          (_, pkg) => {
            const url = esmMap[pkg] || ('https://esm.sh/' + pkg + '?external=react,react-dom');
            return 'await import("' + url + '")';
          }
        );

        // Use Function constructor to run the module-like code
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const mod = { exports: {} };
        const fn = new AsyncFunction('React', 'require', 'module', 'exports', fixedCode + '\\nreturn module.exports;');
        
        const requires = {};
        const fakeRequire = async (pkg) => {
          const url = esmMap[pkg] || ('https://esm.sh/' + pkg + '?external=react,react-dom');
          if (requires[url]) return requires[url];
          const res = await import(url);
          requires[url] = res;
          return res;
        };

        const result = await fn(React, fakeRequire, mod, mod.exports);
        const App = mod.exports.default || mod.exports || result;

        if (typeof App === 'function' || (typeof App === 'object' && App !== null)) {
          const reactRoot = createRoot(root);
          reactRoot.render(React.createElement(App));
        } else {
          root.innerHTML = '<div class="preview-error">⚠️ No default export found or App is not a component.</div>';
        }
      } catch (err) {
        root.innerHTML = '<div class="preview-error"><strong>Runtime Error:</strong><br/>' + String(err?.message || err) + '</div>';
      }
    }

    run();
  </script>
</body>
</html>`;
}

/** Build the iframe srcdoc for a classic HTML/CSS/JS component */
function buildClassicSrcDoc(
  html: string, css: string, js: string,
  envVars: Record<string, string>,
  isDarkMode: boolean
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
    body {
      display: flex; align-items: center; justify-content: center;
      background: transparent;
      color: ${isDarkMode ? '#f4f4f5' : '#09090b'};
      font-family: system-ui, -apple-system, sans-serif;
    }
    ${css || ''}
  </style>
</head>
<body>
  ${html || ''}
  <script>
    window.ENV = ${JSON.stringify(envVars || {})};
    try { ${js || ''} } catch(e) { console.error(e); }
  </script>
</body>
</html>`;
}

export default function ComponentPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const viewTracked = useRef(false);

  const [component, setComponent] = useState<UiComponent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'react'>('html');
  const [copied, setCopied] = useState(false);
  const [bgColor, setBgColor] = useState('#212121');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [activeReactFile, setActiveReactFile] = useState(0);
  const [isReact, setIsReact] = useState(false);

  useEffect(() => {
    async function loadComponent() {
      try {
        const all = await uiComponentsApi.getAll();
        const found = all.find(c => c.id === id);
        if (found) {
          setComponent(found);
          setLikesCount(found.likes_count || 0);
          setViewsCount(found.views_count || 0);
          const hasReact = found.react_files && found.react_files.length > 0;
          setIsReact(!!hasReact);
          if (hasReact) setActiveTab('react');
          if (found.theme === 'light') { setBgColor('#ffffff'); setIsDarkMode(false); }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadComponent();
  }, [id]);

  useEffect(() => {
    if (component?.id && !viewTracked.current) {
      viewTracked.current = true;
      uiComponentsApi.incrementView(String(component.id));
      setViewsCount(prev => prev + 1);
    }
  }, [component?.id]);

  useEffect(() => {
    if (user?.id && component?.id) {
      uiComponentsApi.hasUserLiked(String(component.id), user.id).then(setLiked);
    }
  }, [user?.id, component?.id]);

  const handleLike = async () => {
    if (!user?.id || !component?.id) return;
    if (isLiking) return;
    setIsLiking(true);
    try {
      const result = await uiComponentsApi.toggleLike(String(component.id), user.id);
      setLiked(result.liked);
      setLikesCount(result.newCount);
    } catch (err) {
      console.error("Like failed:", err);
    } finally {
      setIsLiking(false);
    }
  };

  // Recompute srcdoc whenever component or dark mode changes
  const finalIframeSrcDoc = useMemo(() => {
    if (!component) return '';
    if (isReact && component.react_files && component.react_files.length > 0) {
      return buildReactSrcDoc(component.react_files, isDarkMode);
    }
    return buildClassicSrcDoc(
      component.html_code || '',
      component.css_code || '',
      component.js_code || '',
      (component.env_vars as Record<string, string>) || {},
      isDarkMode
    );
  }, [component, isReact, isDarkMode]);

  // Open preview in new tab (works for both classic & react)
  const openPreviewInNewTab = () => {
    if (!component) return;
    const newWindow = window.open('about:blank', '_blank');
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(finalIframeSrcDoc);
      newWindow.document.close();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-12 h-12 border-4 border-[#007acc] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-gray-100">
        <h1 className="text-3xl font-bold mb-4">Element Not Found</h1>
        <p className="text-gray-500 mb-8">This element may have been deleted.</p>
        <button onClick={() => router.push('/components')} className="px-6 py-2 bg-[#1e1e1e] border border-[#2d2d2d] text-white rounded-lg hover:bg-[#252526] transition">Back to Library</button>
      </div>
    );
  }

  const codeString = activeTab === 'react'
    ? (component.react_files?.[activeReactFile]?.content || '')
    : String((component as unknown as Record<string, unknown>)[`${activeTab}_code`] || '');
  const authorAvatar = component.author_avatar || getAvatarForUser(component.author_name || null);
  const isTemplate = component.component_type === 'template';
  // Show edit button only to the component's author
  const isAuthor = !!(user && component.author_id && user.id === component.author_id);

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 pb-20 font-sans selection:bg-[#007acc] selection:text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <Link href="/components" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition">
            <ArrowLeft size={16} /> Go back
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
            {component.component_type && (
              <span className={"flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md " + (isTemplate ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30")}>
                <Layers size={12} /> {isTemplate ? 'Template' : 'Component'}
              </span>
            )}
            <div className="flex items-center gap-2 mr-2">
              <span className="hidden sm:inline">Element by</span>
              <img src={authorAvatar} alt="Author" className="w-6 h-6 rounded-full object-cover border border-[#2d2d2d]" onError={(e) => { e.currentTarget.src = getAvatarForUser(null); }} />
              <span className="text-white font-semibold">{component.author_name || 'Anonymous Maker'}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Views"><Eye size={16} className="text-gray-500" /><span>{viewsCount}</span></div>
            <div className="flex items-center gap-1.5" title="Likes"><Heart size={14} className={liked ? "text-red-500 fill-red-500" : "text-gray-500"} /><span>{likesCount}</span></div>
            {/* Edit button — only visible to the author */}
            {isAuthor && (
              <button
                onClick={() => router.push(`/components/create?edit=${component.id}`)}
                className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-full text-xs font-bold transition-all"
                title="Edit this component"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Main Container */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-[24px] overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[700px]">

          {/* Left Pane: Preview */}
          <div className="w-full lg:w-[45%] flex flex-col relative border-b lg:border-b-0 lg:border-r border-[#27272a]">
            {/* Action Bar */}
            <div className="h-14 flex items-center justify-between px-6 absolute top-0 w-full z-10">
              <button
                onClick={openPreviewInNewTab}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#212121]/80 backdrop-blur-md rounded-full border border-[#3f3f46] text-xs font-medium text-gray-300 shadow-sm hover:text-white hover:bg-[#333] transition-all"
                title="Open full preview in new tab"
              >
                <ExternalLink size={13} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <div className="flex items-center bg-[#212121]/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-[#3f3f46] text-xs font-medium text-gray-300 shadow-sm gap-3">
                <span className="tracking-wide">{bgColor.toUpperCase()}</span>
                <button
                  onClick={() => { setIsDarkMode(!isDarkMode); setBgColor(!isDarkMode ? '#212121' : '#f4f4f5'); }}
                  className="hover:text-white transition-colors"
                >
                  {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              </div>
            </div>

            {/* React badge */}
            {isReact && (
              <div className="absolute top-4 left-4 z-20 pointer-events-none" style={{ top: '60px' }}>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">React Live</span>
                </div>
              </div>
            )}

            {/* Iframe Viewport */}
            <div className="flex-1 w-full h-full relative" style={{ backgroundColor: bgColor, transition: 'background-color 0.3s ease' }}>
              <iframe
                key={finalIframeSrcDoc.length} // force remount when content changes significantly
                srcDoc={finalIframeSrcDoc}
                title={component.title}
                sandbox="allow-scripts allow-modals allow-same-origin allow-downloads"
                className="w-full h-full border-none absolute inset-0"
              />
            </div>
          </div>

          {/* Right Pane: Code Editor */}
          <div className="w-full lg:w-[55%] flex flex-col bg-[#09090b]">
            {/* Code Tabs Header */}
            <div className="h-16 flex items-center justify-between px-2 sm:px-6 bg-[#09090b] border-b border-[#27272a] overflow-x-auto">
              <div className="flex items-center gap-2">
                {!isReact ? (
                  <>
                    <button onClick={() => setActiveTab('html')} className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (activeTab === 'html' ? "bg-[#1f1f22] text-[#f16529]" : "text-gray-500 hover:text-gray-300 hover:bg-[#18181b]")}>
                      <div className="font-black text-lg">5</div>HTML
                    </button>
                    <button onClick={() => setActiveTab('css')} className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (activeTab === 'css' ? "bg-[#1f1f22] text-[#2965f1]" : "text-gray-500 hover:text-gray-300 hover:bg-[#18181b]")}>
                      <div className="font-black text-lg select-none text-[#2965f1]">3</div>CSS
                    </button>
                    <button onClick={() => setActiveTab('js')} className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (activeTab === 'js' ? "bg-[#1f1f22] text-[#f0db4f]" : "text-gray-500 hover:text-gray-300 hover:bg-[#18181b]")}>
                      <div className="font-black text-lg select-none text-[#f0db4f]">JS</div>JS
                    </button>
                  </>
                ) : (
                  <button onClick={() => setActiveTab('react')} className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (activeTab === 'react' ? "bg-[#1f1f22] text-blue-400" : "text-gray-500 hover:text-gray-300 hover:bg-[#18181b]")}>
                    <Code2 size={18} className="text-blue-400" />REACT
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLike}
                  disabled={!user}
                  className={"hidden sm:flex items-center gap-2 px-4 py-1.5 border rounded-full font-semibold text-xs transition " + (liked ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" : "bg-[#4f46e5]/10 text-[#818cf8] hover:bg-[#4f46e5]/20 border-[#4f46e5]/20")}
                  title={user ? (liked ? "Unlike" : "Like") : "Login to like"}
                >
                  <Heart size={14} className={liked ? "fill-red-400" : ""} /> {liked ? "Liked" : "Like"} ({likesCount})
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(codeString); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center justify-center p-2 rounded-lg bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-gray-400 hover:text-white transition"
                  title="Copy Code"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 relative bg-[#09090b] flex flex-col">
              {activeTab === 'react' && (
                <div className="flex bg-[#18181b] border-b border-[#27272a] shrink-0 overflow-x-auto no-scrollbar">
                  {(component.react_files || []).map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveReactFile(idx)}
                      className={"px-4 py-2 text-[10px] font-bold transition-all " + (activeReactFile === idx ? "text-blue-400 bg-[#09090b]" : "text-gray-500 hover:text-gray-300")}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 relative p-4">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={activeTab === 'js' ? 'javascript' : activeTab === 'react' ? 'typescript' : activeTab}
                  value={codeString}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 15,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    padding: { top: 16 },
                    lineHeight: 24,
                  }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
