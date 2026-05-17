"use client";

import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Heart,
  Layers,
  Moon,
  Pencil,
  Sun,
  Maximize2,
  Minimize2,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { getAvatarForUser } from "../../../../lib/avatar";
import { uiComponentsApi } from "../../../../lib/supabase";
import { UiComponent } from "../../../../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

/** Build the iframe srcdoc for a React (TSX) component using Babel + importmap + esm.sh */
function buildReactSrcDoc(
  reactFiles: { name: string; content: string }[],
  isDarkMode: boolean,
  env: Record<string, string> = {}
): string {
  const filesMap: Record<string, string> = {};
  reactFiles.forEach((f) => {
    filesMap[f.name] = f.content;
  });

  let appCode =
    filesMap["App.tsx"] ||
    Object.values(filesMap)[0] ||
    'export default function App() { return <div>No Code</div>; }';

  // Substitute ENV values directly into source code
  if (env && Object.keys(env).length > 0) {
    Object.entries(env).forEach(([key, value]) => {
      if (!value) return;
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const constRegex = new RegExp(
        `((?:const|let|var)\\s+${escapedKey}\\s*=\\s*)(['"\`])[^'"\`]*(['"\`])`,
        "g"
      );
      appCode = appCode.replace(constRegex, `$1"${value}"`);
    });
  }

  // Collect external package names
  const esmPackages: string[] = [];
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"./][^'"]*)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(appCode)) !== null) {
    const pkg = m[1].split("/")[0];
    if (pkg !== "react" && pkg !== "react-dom" && !esmPackages.includes(pkg)) {
      esmPackages.push(m[1]);
    }
  }

  const importmapEntries: Record<string, string> = {
    react: "https://esm.sh/react@18",
    "react-dom": "https://esm.sh/react-dom@18",
    "react-dom/client": "https://esm.sh/react-dom@18/client",
    "react/jsx-runtime": "https://esm.sh/react@18/jsx-runtime",
  };
  esmPackages.forEach((pkg) => {
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
  <script>
    (function() {
      var env = ${JSON.stringify(env)};
      window.ENV = env;
      window.process = window.process || {};
      window.process.env = env;
      window.importMeta = { env: env };
      for (var key in env) {
        if (env.hasOwnProperty(key) && env[key]) {
          window[key] = env[key];
          try { eval('var ' + key + ' = "' + env[key] + '"'); } catch(e) {}
        }
      }
    })();
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100%; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: transparent;
      color: ${isDarkMode ? "#f4f4f5" : "#09090b"};
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
        let rawCode = ${JSON.stringify(appCode)};
        rawCode = rawCode.replace(/import\\.meta\\.env/g, 'window.process.env');

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
          window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
        } else {
          root.innerHTML = '<div class="preview-error">No default export found or App is not a component.</div>';
          window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
        }
      } catch (err) {
        root.innerHTML = '<div class="preview-error"><strong>Runtime Error:</strong><br/>' + String(err?.message || err) + '</div>';
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
      }
    }
    run();
  </script>
</body>
</html>`;
}

/** Build the iframe srcdoc for a classic HTML/CSS/JS component */
function buildClassicSrcDoc(
  html: string,
  css: string,
  js: string,
  envVars: Record<string, string>,
  isDarkMode: boolean
): string {
  let processedJs = js || "";
  if (envVars && Object.keys(envVars).length > 0) {
    Object.entries(envVars).forEach(([key, value]) => {
      if (!value) return;
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const constRegex = new RegExp(
        `((?:const|let|var)\\s+${escapedKey}\\s*=\\s*)(['"\`])[^'"\`]*(['"\`])`,
        "g"
      );
      processedJs = processedJs.replace(constRegex, `$1"${value}"`);
    });
  }
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
      color: ${isDarkMode ? "#f4f4f5" : "#09090b"};
      font-family: system-ui, -apple-system, sans-serif;
    }
    ${css || ""}
  </style>
</head>
<body>
  ${html || ""}
  <script>
    (function() {
      var env = ${JSON.stringify(envVars || {})};
      window.ENV = env;
      window.process = window.process || {};
      window.process.env = env;
      for (var key in env) {
        if (env.hasOwnProperty(key) && env[key]) {
          window[key] = env[key];
          try { eval('var ' + key + ' = "' + env[key] + '"'); } catch(e) {}
        }
      }
    })();
    try { ${processedJs} } catch(e) { console.error(e); }
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
  </script>
</body>
</html>`;
}

// Skeleton loading component
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 pb-20 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 w-20 rounded bg-white/[0.04]" />
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 rounded-md bg-white/[0.04]" />
            <div className="h-6 w-24 rounded-md bg-white/[0.04]" />
          </div>
        </div>
        {/* Main container skeleton */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-[24px] overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
          {/* Preview skeleton */}
          <div className="w-full lg:w-[45%] h-[400px] lg:h-auto bg-white/[0.02] relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
          </div>
          {/* Code skeleton */}
          <div className="w-full lg:w-[55%] bg-[#09090b] p-6 space-y-4">
            <div className="flex gap-2">
              <div className="h-8 w-16 rounded-lg bg-white/[0.04]" />
              <div className="h-8 w-16 rounded-lg bg-white/[0.04]" />
              <div className="h-8 w-16 rounded-lg bg-white/[0.04]" />
            </div>
            <div className="space-y-2.5 mt-6">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-3.5 rounded bg-white/[0.03]" style={{ width: `${60 + Math.random() * 40}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComponentPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profileAvatar } = useAuth();
  const viewTracked = useRef(false);

  const [component, setComponent] = useState<UiComponent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "react">("html");
  const [copied, setCopied] = useState(false);
  const [bgColor, setBgColor] = useState("#212121");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [activeReactFile, setActiveReactFile] = useState(0);
  const [isReact, setIsReact] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<"100%" | "768px" | "375px">("100%");

  useEffect(() => {
    async function loadComponent() {
      try {
        const all = await uiComponentsApi.getAll();
        let found = all.find((c) => String(c.id) === String(id));

        if (found) {
          if (found.lottie_url && found.lottie_url.includes("githubusercontent")) {
            try {
              const res = await fetch(found.lottie_url);
              if (res.ok) {
                const githubCode = await res.json();
                found = {
                  ...found,
                  html_code: githubCode.html_code || found.html_code,
                  css_code: githubCode.css_code || found.css_code,
                  js_code: githubCode.js_code || found.js_code,
                  react_files: githubCode.react_files || found.react_files,
                };
              }
            } catch (err) {
              console.error("Failed to fetch code from GitHub:", err);
            }
          }

          setComponent(found);
          setLikesCount(found.likes_count || 0);
          setViewsCount(found.views_count || 0);
          const hasReact = found.react_files && found.react_files.length > 0;
          setIsReact(!!hasReact);
          if (hasReact) setActiveTab("react");
          if (found.theme === "light") {
            setBgColor("#ffffff");
            setIsDarkMode(false);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadComponent();
  }, [id]);

  // View tracking
  useEffect(() => {
    if (component?.id && !viewTracked.current) {
      const viewedKey = `viewed_${component.id}`;
      const hasViewed = localStorage.getItem(viewedKey);
      if (!hasViewed) {
        viewTracked.current = true;
        uiComponentsApi.incrementView(String(component.id));
        setViewsCount((prev) => prev + 1);
        localStorage.setItem(viewedKey, "true");
      }
    }
  }, [component?.id]);

  // Like check
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

  // Reset preview loading when srcDoc changes
  useEffect(() => {
    setIsPreviewReady(false);
  }, [component, isDarkMode]);

  // Recompute srcdoc
  const finalIframeSrcDoc = useMemo(() => {
    if (!component) return "";

    let envForPreview: Record<string, string> = {};
    const rawEnv = component.env_vars as any;
    if (rawEnv) {
      if (typeof rawEnv === "object" && !Array.isArray(rawEnv)) {
        envForPreview = rawEnv;
      } else if (typeof rawEnv === "string" && rawEnv.trim() !== "") {
        try {
          envForPreview = JSON.parse(atob(rawEnv));
        } catch {
          try {
            envForPreview = JSON.parse(rawEnv);
          } catch (e) {
            envForPreview = {};
          }
        }
      }
    }

    if (isReact && component.react_files && component.react_files.length > 0) {
      return buildReactSrcDoc(component.react_files, isDarkMode, envForPreview);
    }
    return buildClassicSrcDoc(
      component.html_code || "",
      component.css_code || "",
      component.js_code || "",
      envForPreview,
      isDarkMode
    );
  }, [component, isReact, isDarkMode]);

  const openPreviewInNewTab = () => {
    if (!component) return;
    const newWindow = window.open("about:blank", "_blank");
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(finalIframeSrcDoc);
      newWindow.document.close();
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!component) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-gray-100">
        <h1 className="text-3xl font-bold mb-4">Element Not Found</h1>
        <p className="text-gray-500 mb-8">This element may have been deleted.</p>
        <Button variant="outline" onClick={() => router.push("/components")}>
          Back to Library
        </Button>
      </div>
    );
  }

  const codeString =
    activeTab === "react"
      ? component.react_files?.[activeReactFile]?.content || ""
      : String((component as any)[`${activeTab}_code`] || "");

  // Author identification
  const currentUserName = (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0];
  const isAuthor = !!(
    (user && component.author_id && user.id === component.author_id) ||
    (user && currentUserName && component.author_name === currentUserName)
  );

  const authorAvatar =
    (isAuthor && profileAvatar) || component.author_avatar || getAvatarForUser(component.author_name || null);

  const authorName = (isAuthor && currentUserName) || component.author_name || "Anonymous Maker";

  const isTemplate = component.component_type === "template";

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 pb-20 font-sans selection:bg-[#007acc] selection:text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
          <Link
            href="/components"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition"
          >
            <ArrowLeft size={16} /> Back to Library
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            {component.component_type && (
              <Badge
                variant="secondary"
                className={
                  "text-[10px] " +
                  (isTemplate
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/30")
                }
              >
                <Layers size={10} className="mr-1" /> {isTemplate ? "Template" : "Component"}
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <img
                src={authorAvatar}
                alt="Author"
                className="w-5 h-5 rounded-full object-cover border border-white/10"
                onError={(e) => {
                  e.currentTarget.src = getAvatarForUser(null);
                }}
              />
              <span className="text-xs text-gray-400">
                <span className="hidden sm:inline text-gray-600">by </span>
                <span className="text-gray-300 font-medium">{authorName}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1" title="Views">
                <Eye size={13} /> {viewsCount}
              </span>
              <span className="flex items-center gap-1" title="Likes">
                <Heart size={13} className={liked ? "text-red-500 fill-red-500" : ""} /> {likesCount}
              </span>
            </div>
            {isAuthor && (
              <button
                onClick={() => router.push(`/components/create?edit=${component.id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-all"
              >
                <Pencil size={12} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Main Container */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[700px]">
          {/* Left Pane: Preview */}
          <div
            className={
              "flex flex-col relative border-b lg:border-b-0 lg:border-r border-[#27272a] " +
              (isFullscreen ? "w-full" : "w-full lg:w-[45%]")
            }
          >
            {/* Preview Action Bar */}
            <div className="h-10 flex items-center justify-between px-4 bg-[#0d0d0d] border-b border-white/[0.04] shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 opacity-30">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-gray-600 font-mono ml-1">preview</span>
                {isReact && (
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] text-green-500/70 font-medium uppercase tracking-wider">React</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Responsive preview */}
                <div className="hidden lg:flex items-center gap-0.5 mr-1">
                  <button
                    onClick={() => setPreviewWidth("100%")}
                    className={"p-1 rounded transition-all " + (previewWidth === "100%" ? "text-white bg-white/10" : "text-gray-600 hover:text-white")}
                    title="Desktop"
                  >
                    <Monitor size={11} />
                  </button>
                  <button
                    onClick={() => setPreviewWidth("768px")}
                    className={"p-1 rounded transition-all " + (previewWidth === "768px" ? "text-white bg-white/10" : "text-gray-600 hover:text-white")}
                    title="Tablet"
                  >
                    <Tablet size={11} />
                  </button>
                  <button
                    onClick={() => setPreviewWidth("375px")}
                    className={"p-1 rounded transition-all " + (previewWidth === "375px" ? "text-white bg-white/10" : "text-gray-600 hover:text-white")}
                    title="Mobile"
                  >
                    <Smartphone size={11} />
                  </button>
                </div>
                <button
                  onClick={openPreviewInNewTab}
                  className="p-1 text-gray-600 hover:text-white rounded transition-all"
                  title="Open in new tab"
                >
                  <ExternalLink size={12} />
                </button>
                <button
                  onClick={() => {
                    setIsDarkMode(!isDarkMode);
                    setBgColor(!isDarkMode ? "#212121" : "#f4f4f5");
                  }}
                  className="p-1 text-gray-600 hover:text-white rounded transition-all"
                  title="Toggle theme"
                >
                  {isDarkMode ? <Sun size={12} /> : <Moon size={12} />}
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1 text-gray-600 hover:text-white rounded transition-all hidden lg:block"
                  title="Toggle fullscreen"
                >
                  {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>
              </div>
            </div>

            {/* Preview Iframe */}
            <div
              className="flex-1 w-full relative flex justify-center"
              style={{ backgroundColor: bgColor, transition: "background-color 0.3s ease" }}
            >
              {/* Loading skeleton */}
              {!isPreviewReady && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: bgColor }}>
                  <div className="w-10 h-10 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                  <span className="text-[10px] text-gray-600 font-mono">
                    {isReact ? "Compiling preview..." : "Loading preview..."}
                  </span>
                </div>
              )}
              <div
                className="h-full transition-all duration-300"
                style={{ width: previewWidth, maxWidth: "100%" }}
              >
                <iframe
                  key={finalIframeSrcDoc.length}
                  srcDoc={finalIframeSrcDoc}
                  title={component.title}
                  sandbox="allow-scripts allow-modals allow-same-origin allow-downloads"
                  className={"w-full h-full border-none transition-opacity duration-500 " + (isPreviewReady ? "opacity-100" : "opacity-0")}
                  onLoad={() => setIsPreviewReady(true)}
                />
              </div>
            </div>
          </div>

          {/* Right Pane: Code Editor */}
          <div className={"flex flex-col bg-[#09090b] " + (isFullscreen ? "hidden" : "w-full lg:w-[55%]")}>
            {/* Code Tabs Header — VS Code style */}
            <div className="h-10 flex items-center justify-between px-2 sm:px-4 bg-[#0d0d0d] border-b border-white/[0.04] shrink-0 overflow-x-auto">
              <div className="flex items-center">
                {!isReact ? (
                  <>
                    {(["html", "css", "js"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={
                          "px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 " +
                          (activeTab === tab
                            ? "text-white bg-[#1e1e1e] border-[#007acc]"
                            : "text-gray-500 hover:text-gray-300 border-transparent")
                        }
                      >
                        {tab}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab("react")}
                      className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-[#1e1e1e] border-b-2 border-[#007acc]"
                    >
                      React
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleLike}
                  disabled={!user}
                  className={
                    "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all " +
                    (liked
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-gray-300")
                  }
                  title={user ? (liked ? "Unlike" : "Like") : "Login to like"}
                >
                  <Heart size={12} className={liked ? "fill-red-400" : ""} /> {likesCount}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeString);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center justify-center p-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-gray-500 hover:text-white transition-all"
                  title="Copy Code"
                >
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            {/* React file sub-tabs */}
            {isReact && activeTab === "react" && (
              <div className="flex bg-[#0d0d0d] border-b border-white/[0.04] shrink-0 overflow-x-auto no-scrollbar">
                {(component.react_files || []).map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveReactFile(idx)}
                    className={
                      "px-3 py-1.5 text-[10px] font-bold transition-all " +
                      (activeReactFile === idx
                        ? "text-white bg-[#1e1e1e] border-b-2 border-[#007acc]"
                        : "text-gray-500 hover:text-gray-300")
                    }
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            )}

            {/* Monaco Editor */}
            <div className="flex-1 relative bg-[#09090b]">
              <Editor
                height="100%"
                theme="vs-dark"
                language={
                  activeTab === "js" ? "javascript" : activeTab === "react" ? "typescript" : activeTab
                }
                value={codeString}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  padding: { top: 12 },
                  lineHeight: 22,
                  renderLineHighlight: "none",
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Description section */}
        {component.description && (
          <div className="mt-6 p-5 bg-[#18181b] border border-[#27272a] rounded-xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{component.description}</p>
            {(component.tags || []).length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {(component.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-gray-500 border border-white/[0.06]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
