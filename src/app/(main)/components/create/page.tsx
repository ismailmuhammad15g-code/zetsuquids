"use client";

import { ArrowLeft, Layers, Maximize2, Minimize2, Play, Save, Settings, Upload, X, Terminal, ChevronUp, ChevronDown } from "lucide-react";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../../contexts/AuthContext";
import { getAvatarForUser } from "../../../../lib/avatar";
import { supabase, uiComponentsApi } from "../../../../lib/supabase";

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function CreateComponentPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("My Awesome Component");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [componentType, setComponentType] = useState<'component' | 'template'>('component');

  const [htmlCode, setHtmlCode] = useState('<button class="my-btn">\n  Hover me\n</button>');
  const [cssCode, setCssCode] = useState(`.my-btn {
  padding: 12px 24px;
  background: linear-gradient(45deg, #FF512F 0%, #F09819 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(240, 152, 25, 0.4);
  transition: all 0.3s ease;
}

.my-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(240, 152, 25, 0.6);
}`);
  const [jsCode, setJsCode] = useState(`const btn = document.querySelector('.my-btn');
btn.addEventListener('click', () => {
  btn.innerText = 'Clicked!';
  setTimeout(() => btn.innerText = 'Hover me', 1000);
});`);
  const [envCode, setEnvCode] = useState(`# Enter your environment variables here
# MY_API_KEY=123456789
`);
  const [reactFiles, setReactFiles] = useState<{ name: string, content: string }[]>([
    { name: 'App.tsx', content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex flex-col items-center gap-6 p-10">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Hello from React! ✨
      </h1>
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition"
      >
        Clicked {count} times
      </button>
    </div>
  );
}` }
  ]);
  const [activeReactFile, setActiveReactFile] = useState(0);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'env' | 'react'>('html');
  const [creationMode, setCreationMode] = useState<'classic' | 'react'>('classic');




  const [isFullscreen, setIsFullscreen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{type: string, message: string, time: string}[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CONSOLE_LOG') {
        setConsoleLogs(prev => [...prev, { type: event.data.logType, message: event.data.message, time: new Date().toLocaleTimeString() }]);
      } else if (event.data?.type === 'CONSOLE_CLEAR') {
        setConsoleLogs([]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  const [isSaving, setIsSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // User profile for avatar
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  // Debounced states
  const [debouncedHtml, setDebouncedHtml] = useState(htmlCode);
  const [debouncedCss, setDebouncedCss] = useState(cssCode);
  const [debouncedJs, setDebouncedJs] = useState(jsCode);
  const [parsedEnv, setParsedEnv] = useState<Record<string, string>>({});

  // Fetch user profile avatar on mount
  useEffect(() => {
    async function fetchProfile() {
      if (!user?.email) return;
      try {
        const { data } = await supabase
          .from("zetsuguide_user_profiles")
          .select("avatar_url")
          .eq("user_email", user.email)
          .maybeSingle();
        if (data?.avatar_url) {
          setUserAvatarUrl(data.avatar_url);
        }
      } catch (e) {
        console.error("Failed to fetch profile avatar:", e);
      }
    }
    fetchProfile();
  }, [user?.email]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHtml(htmlCode);
      setDebouncedCss(cssCode);
      setDebouncedJs(jsCode);

      // Parse ENV
      const envObj: Record<string, string> = {};
      envCode.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length > 0) {
            envObj[key.trim()] = values.join('=').trim(); // handle ='foo=bar'
          }
        }
      });
      setParsedEnv(envObj);

    }, 800);
    return () => clearTimeout(handler);
  }, [htmlCode, cssCode, jsCode, envCode]);

  const handleEnvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setEnvCode(prev => prev + '\n' + ev.target!.result);
          toast.success("ENV file loaded");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your component");
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      // Resolve the best avatar URL for saving
      const resolvedAvatar = (user?.user_metadata as any)?.avatar_url
        || userAvatarUrl
        || getAvatarForUser(user?.email || null);

      await uiComponentsApi.create({
        id: crypto.randomUUID(),
        title,
        description,
        tags: tagsArray,
        env_vars: parsedEnv,
        html_code: creationMode === 'classic' ? htmlCode : '',
        css_code: creationMode === 'classic' ? cssCode : '',
        js_code: creationMode === 'classic' ? jsCode : '',
        react_files: creationMode === 'react' ? reactFiles : [],

        author_name: (user?.user_metadata as any)?.full_name || (user?.email ? user.email.split('@')[0] : 'Anonymous Maker'),
        author_avatar: resolvedAvatar,
        author_id: user?.id || undefined,
        theme: 'light',
        component_type: componentType,
      });
      toast.success("Component published successfully!");
      router.push('/components');
    } catch (e) {
      console.error(e);
      toast.error("Failed to save component");
    } finally {
      setIsSaving(false);
      setShowPublishModal(false);
    }
  };


    ;

  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: transparent; font-family: system-ui, -apple-system, sans-serif; }
          ${debouncedCss}
        </style>
      </head>
      <body>
        ${debouncedHtml}
        <script>
          // Inject ENV variables safely just into the local window context
          window.ENV = ${JSON.stringify(parsedEnv)};
          try {
            ${debouncedJs}
          } catch (e) {
            console.error(e);
          }
        </script>
      </body>
    </html>
  `;


  // Smart entry-point detection: App.tsx > App.jsx > index.tsx > index.jsx > index.js > first file
  const ENTRY_PRIORITY = ['App.tsx','App.jsx','App.ts','App.js','index.tsx','index.jsx','index.ts','index.js','main.tsx','main.jsx'];

  function getEntryCode(files: {name:string,content:string}[]): string {
    const map: Record<string,string> = {};
    files.forEach(f => { map[f.name] = f.content; });
    for (const name of ENTRY_PRIORITY) { if (map[name]) return map[name]; }
    return files[0]?.content || 'export default function App() { return <div>No Code Found</div>; }';
  }

  // Detect language for Monaco from file extension
  const getMonacoLang = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) return 'typescript';
    if (fileName.endsWith('.jsx') || fileName.endsWith('.js')) return 'javascript';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.json')) return 'json';
    return 'typescript';
  };

  // Real-time React Bundling logic for the iframe using Babel
  const [reactPreviewDoc, setReactPreviewDoc] = useState("");

  useEffect(() => {
    if (creationMode !== 'react') return;

    const appCode = getEntryCode(reactFiles);

    // Build the srcdoc using the robust logic from [id]/page.tsx
    const filesMap: Record<string, string> = {};
    reactFiles.forEach(f => { filesMap[f.name] = f.content; });

    // Collect external package names
    const esmPackages: string[] = [];
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"./][^'"]*)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(appCode)) !== null) {
      const pkg = m[1].split('/')[0];
      if (pkg !== 'react' && pkg !== 'react-dom' && !esmPackages.includes(pkg)) {
        esmPackages.push(m[1]);
      }
    }

    // Build importmap
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

    // Use the raw code for Babel transform
    const rawCode = appCode;

    const doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">${importmapJson}</script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100%; }
    body { font-family: system-ui,-apple-system,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; background:transparent; }
    #root { width:100%; display:flex; align-items:center; justify-content:center; }
    ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-thumb { background:rgba(128,128,128,0.3); border-radius:3px; }
    .preview-error { background:#fee2e2; border:1px solid #fca5a5; border-radius:8px; padding:16px; color:#dc2626; font-family:monospace; font-size:13px; white-space:pre-wrap; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function(){
      window.parent.postMessage({type:'CONSOLE_CLEAR'},'*');
      ['log','error','warn','info'].forEach(function(t){
        var orig=console[t];
        console[t]=function(){
          try {
            var m=Array.from(arguments).map(function(a){
              try { return typeof a==='object'?JSON.stringify(a):String(a); } catch(e){ return String(a); }
            }).join(' ');
            window.parent.postMessage({type:'CONSOLE_LOG',logType:t,message:m},'*');
          } catch(e){}
          orig.apply(console,arguments);
        };
      });
      window.onerror=function(msg,_u,line){ 
        if (msg === "Script error.") return;
        window.parent.postMessage({type:'CONSOLE_LOG',logType:'error',message:msg+' (line '+line+')'},'*'); 
      };
    })();
  </script>
  <script type="module">
    import React from 'react';
    import { createRoot } from 'react-dom/client';

    async function loadBabel() {
      if (window.Babel) return window.Babel;
      return new Promise((resolve, reject) => {
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
        const rawCode = ${JSON.stringify(rawCode)};
        
        const transformed = Babel.transform(rawCode, {
          presets: [
            ['env', { modules: 'commonjs' }],
            ['react', { runtime: 'classic' }],
            ['typescript', { allExtensions: true, isTSX: true }],
          ],
          filename: 'App.tsx',
        }).code;

        const esmMap = ${JSON.stringify(importmapEntries)};
        const fixedCode = transformed.replace(
          /require\\(["']([^"']+)["']\\)/g,
          (_, pkg) => {
            const url = esmMap[pkg] || ('https://esm.sh/' + pkg + '?external=react,react-dom');
            return 'await import("' + url + '")';
          }
        );

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
          createRoot(root).render(React.createElement(App));
        } else {
          root.innerHTML = '<div class="preview-error">⚠️ No default export found or App is not a component.</div>';
        }
      } catch (err) {
        root.innerHTML = '<div class="preview-error"><b>Runtime Error:</b><br/>'+err.message+'</div>';
      }
    }
    run();
  </script>
</body>
</html>`;

    const timeout = setTimeout(() => setReactPreviewDoc(doc), 500);
    return () => clearTimeout(timeout);
  }, [reactFiles, creationMode]);

  // Helper to determine the language for Monaco (classic tabs)
  const getLanguage = (tab: string) => {
    if (tab === 'js') return 'javascript';
    if (tab === 'react') return 'typescript';
    if (tab === 'env') return 'shell';
    return tab;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#1e1e1e] text-gray-100 font-sans">

      {/* Top Navbar for Editor */}
      <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 bg-[#252526] shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/components" className="p-1.5 hover:bg-[#333] rounded transition-colors text-gray-400 hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="h-6 w-px bg-[#444] mx-2"></div>
          
          {/* Creation Mode Switcher */}
          <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-[#333]">
            <button
              onClick={() => {
                setCreationMode('classic');
                setActiveTab('html');
              }}
              className={"px-3 py-1 text-[10px] font-bold rounded-md transition-all " + (creationMode === 'classic' ? "bg-[#007acc] text-white shadow-lg" : "text-gray-500 hover:text-gray-300")}
            >
              CLASSIC (HTML/CSS)
            </button>
            <button
              onClick={() => {
                setCreationMode('react');
                setActiveTab('react');
              }}
              className={"px-3 py-1 text-[10px] font-bold rounded-md transition-all " + (creationMode === 'react' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300")}
            >
              REACT COMPONENT
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-gray-500 font-medium italic">{creationMode === 'react' ? "React Mode Active" : "HTML Mode Active"}</span>
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#007acc] hover:bg-[#005c99] text-white px-4 py-1.5 rounded transition-all text-sm font-medium disabled:opacity-50"
          >
            <Save size={14} /> Publish
          </button>
        </div>
      </div>

      {/* Editor Main Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* Left Side: Code Editor */}
        <div className={"w-full lg:w-1/2 flex flex-col border-r border-[#333] bg-[#1e1e1e] " + (isFullscreen ? "hidden" : "flex")}>
          {/* Tabs */}
          <div className="flex bg-[#2d2d2d] shrink-0 overflow-x-auto no-scrollbar">
            {(creationMode === 'classic' ? ['html', 'css', 'js', 'env'] : ['react', 'env']).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={"flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 " + (activeTab === tab ? "border-[#007acc] text-white bg-[#1e1e1e]" : "border-transparent text-gray-400 hover:text-gray-200 bg-[#2d2d2d]")}
              >
                {tab === 'env' && <Settings size={12} />}
                {tab === 'react' && <Layers size={12} className="text-blue-400" />}
                {tab}
              </button>
            ))}
          </div>

          {/* Editor Container */}
          <div className="flex-1 relative bg-[#1e1e1e] flex flex-col">
            {activeTab === 'react' && (
              <div className="flex bg-[#252526] border-b border-[#333] shrink-0 overflow-x-auto no-scrollbar items-stretch">
                {reactFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center group border-r border-[#333]">
                    {renamingIdx === idx ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => {
                          if (renameValue.trim()) {
                            const updated = [...reactFiles];
                            updated[idx] = { ...updated[idx], name: renameValue.trim() };
                            setReactFiles(updated);
                          }
                          setRenamingIdx(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (renameValue.trim()) {
                              const updated = [...reactFiles];
                              updated[idx] = { ...updated[idx], name: renameValue.trim() };
                              setReactFiles(updated);
                            }
                            setRenamingIdx(null);
                          }
                          if (e.key === 'Escape') setRenamingIdx(null);
                        }}
                        className="bg-[#007acc] text-white text-[10px] font-bold px-3 py-2 outline-none w-28 rounded"
                      />
                    ) : (
                      <button
                        onClick={() => setActiveReactFile(idx)}
                        onDoubleClick={() => { setRenamingIdx(idx); setRenameValue(file.name); }}
                        title="Double-click to rename"
                        className={"flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold transition-all " + (activeReactFile === idx ? "text-blue-400 bg-[#1e1e1e]" : "text-gray-500 hover:text-gray-300")}
                      >
                        <span className="opacity-40 text-[9px]">{file.name.endsWith('.tsx') || file.name.endsWith('.ts') ? '⬡' : '⬡'}</span>
                        {file.name}
                      </button>
                    )}
                    {reactFiles.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFiles = reactFiles.filter((_, i) => i !== idx);
                          setReactFiles(newFiles);
                          setActiveReactFile(Math.min(activeReactFile, newFiles.length - 1));
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-gray-600 transition-all mr-1 shrink-0"
                        title="Delete file"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => { setNewFileName(''); setShowNewFileDialog(true); }}
                  className="px-4 py-2 text-[10px] font-bold text-gray-500 hover:text-blue-400 transition-all shrink-0 flex items-center gap-1"
                  title="Add new file"
                >
                  + New File
                </button>
              </div>
            )}
            
            <div className="flex-1 relative">
              {activeTab === 'env' && (
                <div className="absolute top-2 right-4 z-10 flex gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-[#333] hover:bg-[#444] text-xs px-3 py-1.5 rounded border border-[#555] transition text-gray-300">
                    <Upload size={12} /> Upload .env
                    <input type="file" className="hidden" accept=".env, .txt" onChange={handleEnvUpload} />
                  </label>
                </div>
              )}
              <div className="absolute inset-0 pt-2">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={activeTab === 'react' ? getMonacoLang(reactFiles[activeReactFile]?.name || 'App.tsx') : getLanguage(activeTab)}
                  value={
                    activeTab === 'html' ? htmlCode
                      : activeTab === 'css' ? cssCode
                        : activeTab === 'js' ? jsCode
                          : activeTab === 'react' ? reactFiles[activeReactFile]?.content
                            : envCode
                  }
                  onChange={(val) => {
                    if (val === undefined) return;
                    if (activeTab === 'html') setHtmlCode(val);
                    else if (activeTab === 'css') setCssCode(val);
                    else if (activeTab === 'js') setJsCode(val);
                    else if (activeTab === 'react') {
                      const newFiles = [...reactFiles];
                      newFiles[activeReactFile].content = val;
                      setReactFiles(newFiles);
                    }
                    else setEnvCode(val);
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    formatOnPaste: true,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className={"w-full flex flex-col bg-white relative " + (isFullscreen ? "lg:w-full" : "lg:w-1/2")}>
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <div className="bg-[#1e1e1e] border border-[#333] flex items-center p-1 rounded-md shadow-lg backdrop-blur-sm">
              {creationMode === 'classic' && (
                <>
                  <button
                    onClick={() => {
                      setDebouncedHtml(htmlCode);
                      setDebouncedCss(cssCode);
                      setDebouncedJs(jsCode);
                    }}
                    className="p-1.5 text-gray-400 hover:text-white rounded transition-all"
                    title="Force Rerender"
                  >
                    <Play size={16} />
                  </button>
                  <div className="w-px h-4 bg-[#444] mx-1"></div>
                </>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-gray-400 hover:text-white rounded transition-all hidden lg:block"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
            </div>
            {/* Premium Header Overlay for React Mode */}
            {creationMode === 'react' && (
              <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Live React</span>
                </div>
              </div>
            )}

          <div className="flex-1 bg-[#f8f9fa] relative w-full h-full">
            {creationMode === 'react' ? (
              <div className="flex-1 flex flex-col relative w-full h-full bg-[#f8f9fa] rounded-tl-2xl border-t border-l border-gray-200 shadow-inner overflow-hidden">
                <iframe
                  srcDoc={reactPreviewDoc}
                  title="React Live Preview"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  className="w-full h-full flex-1 border-none bg-transparent"
                />
                
                {/* Live Console */}
                <div className={`absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#333] transition-all duration-300 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-20 ${isConsoleOpen ? 'h-64' : 'h-10'}`}>
                  <div 
                    className="h-10 flex items-center justify-between px-4 cursor-pointer hover:bg-[#252526] transition-colors shrink-0"
                    onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  >
                    <div className="flex items-center gap-2 text-gray-300 text-xs font-bold uppercase tracking-widest">
                      <Terminal size={14} /> Console {consoleLogs.length > 0 && <span className="bg-blue-500 text-white px-1.5 rounded-full text-[9px]">{consoleLogs.length}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                       {isConsoleOpen && (
                         <button onClick={(e) => { e.stopPropagation(); setConsoleLogs([]); }} className="text-gray-500 hover:text-gray-300 text-xs">Clear</button>
                       )}
                       {isConsoleOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
                    </div>
                  </div>
                  {isConsoleOpen && (
                    <div className="flex-1 overflow-auto p-4 font-mono text-[11px] space-y-2 no-scrollbar bg-[#0d0d0d]">
                      {consoleLogs.length === 0 ? (
                        <div className="text-gray-600 italic">No logs yet...</div>
                      ) : (
                        consoleLogs.map((log, i) => (
                          <div key={i} className={`flex gap-3 pb-1 border-b border-[#222] ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-gray-300'}`}>
                            <span className="text-gray-600 shrink-0">[{log.time}]</span>
                            <span className="break-all whitespace-pre-wrap">{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <iframe
                srcDoc={iframeSrcDoc}
                title="Live Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
                className="w-full flex-1 border-none bg-transparent"
                style={{
                  backgroundImage: 'radial-gradient(circle, #00000008 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            )}
          </div>
        </div>

      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333] w-full max-w-lg rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Publish Component</h2>
              <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#2d2d2d] border border-[#444] rounded p-2.5 text-white focus:outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]"
                  placeholder="e.g., Neon Liquid Button"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description <span className="text-xs text-gray-500">(Optional)</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#2d2d2d] border border-[#444] rounded p-2.5 text-white focus:outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] h-24 resize-none"
                  placeholder="What does this component do?"
                />
              </div>

              {/* Component Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setComponentType('component')}
                    className={"flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold " + (componentType === 'component' ? "border-[#007acc] bg-[#007acc]/10 text-[#007acc]" : "border-[#444] text-gray-400 hover:border-[#555] hover:text-gray-300")}
                  >
                    <Layers size={16} />
                    Component
                  </button>
                  <button
                    type="button"
                    onClick={() => setComponentType('template')}
                    className={"flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold " + (componentType === 'template' ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-[#444] text-gray-400 hover:border-[#555] hover:text-gray-300")}
                  >
                    <Layers size={16} />
                    Template
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full bg-[#2d2d2d] border border-[#444] rounded p-2.5 text-white focus:outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]"
                  placeholder="button, neon, hover, 3d"
                />
              </div>

              <p className="text-xs text-yellow-500/80 mt-2 italic">
                * Environment variables added in the ENV tab are saved securely and will not be displayed in the public code viewer.
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-3.5">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded text-gray-300 hover:bg-[#333] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 w-32 bg-[#007acc] hover:bg-[#005c99] text-white px-4 py-2 rounded transition font-medium disabled:opacity-50"
              >
                {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#333] w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">New File</h3>
              <button onClick={() => setShowNewFileDialog(false)} className="text-gray-400 hover:text-white p-1"><X size={16} /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Quick presets:</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['App.tsx','index.tsx','Component.tsx','utils.ts','helpers.js','styles.css'].map(preset => (
                <button key={preset} onClick={() => setNewFileName(preset)}
                  className={"text-left px-3 py-2 rounded-lg text-[11px] font-mono transition-all " + (newFileName === preset ? 'bg-[#007acc]/20 text-[#007acc] border border-[#007acc]/30' : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#333] hover:text-white border border-transparent')}>
                  {preset}
                </button>
              ))}
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Header.tsx, utils.ts, styles.css..."
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newFileName.trim()) {
                  const name = newFileName.trim();
                  const ext = name.split('.').pop() || '';
                  const base = name.replace(/\.[^.]+$/, '');
                  const template = ext === 'css' ? `/* ${name} */\n` : ext === 'json' ? '{}\n' : ext === 'ts' || ext === 'js' ? `// ${name}\n\nexport function ${base}() { return ''; }\n` : `import React from 'react';\n\nexport default function ${base}() {\n  return <div className="p-4">${base}</div>;\n}\n`;
                  setReactFiles(prev => [...prev, { name, content: template }]);
                  setActiveReactFile(reactFiles.length);
                  setShowNewFileDialog(false);
                }
                if (e.key === 'Escape') setShowNewFileDialog(false);
              }}
              className="w-full bg-[#2d2d2d] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] placeholder-gray-600"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowNewFileDialog(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition">Cancel</button>
              <button
                disabled={!newFileName.trim()}
                onClick={() => {
                  const name = newFileName.trim();
                  const ext = name.split('.').pop() || '';
                  const base = name.replace(/\.[^.]+$/, '');
                  const template = ext === 'css' ? `/* ${name} */\n` : ext === 'json' ? '{}\n' : ext === 'ts' || ext === 'js' ? `// ${name}\n\nexport function ${base}() { return ''; }\n` : `import React from 'react';\n\nexport default function ${base}() {\n  return <div className="p-4">${base}</div>;\n}\n`;
                  setReactFiles(prev => [...prev, { name, content: template }]);
                  setActiveReactFile(reactFiles.length);
                  setShowNewFileDialog(false);
                }}
                className="px-4 py-2 bg-[#007acc] hover:bg-[#005c99] text-white rounded-lg text-sm font-medium transition disabled:opacity-40"
              >Create File</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
