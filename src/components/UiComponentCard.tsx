"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UiComponent } from "../types";
import { Heart, Eye, Code, Layers, ExternalLink } from "lucide-react";
import { getAvatarForUser } from "../lib/avatar";
import { useAuth } from "../contexts/AuthContext";
import { uiComponentsApi } from "../lib/supabase";
import { Badge } from "./ui/badge";

interface Props {
  component: UiComponent;
}

export default function UiComponentCard({ component }: Props) {
  const router = useRouter();
  const { user, profileAvatar } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "html" | "css" | "js">("preview");
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(component.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);

  // Check if user already liked this component
  useEffect(() => {
    if (user?.id && component.id) {
      uiComponentsApi.hasUserLiked(String(component.id), user.id).then(setLiked);
    }
  }, [user?.id, component.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
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

  // Build srcdoc for classic HTML/CSS/JS
  const classicSrcDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: transparent; font-family: system-ui, -apple-system, sans-serif; }
          ${component.theme === "dark" ? "body { color: white; }" : ""}
          ${component.css_code}
        </style>
      </head>
      <body>
        ${component.html_code}
        <script>
          try { ${component.js_code} } catch (e) { console.error(e); }
          window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
        </script>
      </body>
    </html>
  `;

  // Build srcdoc for React components (Babel + esm.sh)
  const isReact = !!(component.react_files && component.react_files.length > 0);

  const reactSrcDoc = (() => {
    if (!isReact) return "";
    const filesMap: Record<string, string> = {};
    component.react_files!.forEach((f) => {
      filesMap[f.name] = f.content;
    });
    const appCode =
      filesMap["App.tsx"] || Object.values(filesMap)[0] || 'export default function App() { return <div>No Code</div>; }';

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

    let rawCode = appCode.replace(/import\.meta\.env/g, "window.process.env");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">${JSON.stringify({ imports: importmapEntries })}</script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100%; background: transparent; }
    body { font-family: system-ui,-apple-system,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:16px; }
    #root { width:100%; display:flex; align-items:center; justify-content:center; }
  </style>
</head>
<body>
  <div id="root"></div>
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
      try {
        const Babel = await loadBabel();
        let rawCode = ${JSON.stringify(rawCode)};
        const transformed = Babel.transform(rawCode, {
          presets: [['env', { modules: 'commonjs' }], ['react', { runtime: 'classic' }], ['typescript', { allExtensions: true, isTSX: true }]],
          filename: 'App.tsx',
        }).code;

        const esmMap = ${JSON.stringify(importmapEntries)};
        const fixedCode = transformed.replace(/require\\(["']([^"']+)["']\\)/g, (_, pkg) => {
          const url = esmMap[pkg] || ('https://esm.sh/' + pkg + '?external=react,react-dom');
          return 'await import("' + url + '")';
        });

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
          createRoot(document.getElementById('root')).render(React.createElement(App));
          window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
        }
      } catch (err) {
        document.getElementById('root').innerHTML = '<div style="color:#dc2626;font-size:12px;font-family:monospace;padding:8px">Error: ' + err.message + '</div>';
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
      }
    }
    run();
  </script>
</body>
</html>`;
  })();

  const srcDoc = isReact ? reactSrcDoc : classicSrcDoc;

  const isTemplate = component.component_type === "template";

  // Author identification
  const currentUserName = (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0];
  const isAuthor = !!(
    (user && component.author_id && user.id === component.author_id) ||
    (user && currentUserName && component.author_name === currentUserName)
  );

  const authorAvatarUrl =
    (isAuthor && profileAvatar) || component.author_avatar || getAvatarForUser(component.author_name || null);

  const authorName = (isAuthor && currentUserName) || component.author_name || "Anonymous";

  // Tags
  const tags = (component.tags || []).slice(0, 3);

  return (
    <div
      onClick={() => router.push(`/components/${component.id}`)}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-[#111] border border-white/[0.06] transition-all hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20 cursor-pointer"
    >
      {/* Preview Area */}
      <div
        className="relative h-56 w-full overflow-hidden bg-[#0a0a0a]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      >
        {component.preview_url ? (
          /* Static image preview */
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d] overflow-hidden p-4">
            <img
              src={component.preview_url}
              alt={component.title}
              className="max-w-full max-h-full object-contain rounded transition-transform group-hover:scale-105 duration-500"
              loading="lazy"
            />
          </div>
        ) : (
          /* Live iframe preview (both classic and React) */
          <div className="absolute inset-0">
            {!isPreviewReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-[#0a0a0a]">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                <span className="text-[10px] text-gray-600 font-mono">
                  {isReact ? "Compiling..." : "Loading..."}
                </span>
              </div>
            )}
            <div className="w-[200%] h-[200%] transform origin-top-left scale-50">
              <iframe
                ref={iframeRef}
                srcDoc={srcDoc}
                title={component.title}
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-none pointer-events-none"
                loading="lazy"
                tabIndex={-1}
                onLoad={() => setIsPreviewReady(true)}
              />
            </div>
          </div>
        )}

        {/* Type Badge */}
        {isTemplate && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
              <Layers size={10} className="mr-1" /> Template
            </Badge>
          </div>
        )}

        {/* Hover overlay — View button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center z-10">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-medium">
              <ExternalLink size={13} />
              View Component
            </div>
          </div>
        </div>

        {/* Code toggle (top right) */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab(activeTab === "preview" ? "html" : "preview");
            }}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white transition-colors"
            title={activeTab === "preview" ? "View Code" : "View Preview"}
          >
            <Code size={13} />
          </button>
        </div>

        {/* Code overlay */}
        {activeTab !== "preview" && (
          <div
            className="absolute inset-0 p-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full overflow-auto p-3 bg-[#0d0d0d]/95 backdrop-blur-sm text-gray-300 text-[10px] font-mono rounded-lg border border-white/5">
              <pre className="whitespace-pre-wrap break-all">
                <code>{String((component as any)[`${activeTab}_code`] || "")}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col p-3.5 gap-2.5">
        {/* Title + Stats */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-sm text-gray-100 truncate leading-tight">
            {component.title}
          </h3>
          <div className="flex items-center gap-2.5 text-[11px] text-gray-500 shrink-0">
            <button
              onClick={handleLike}
              className={"flex items-center gap-1 transition-colors " + (liked ? "text-red-500" : "hover:text-red-400")}
              title={user ? (liked ? "Unlike" : "Like") : "Login to like"}
            >
              <Heart size={12} className={liked ? "fill-red-500" : ""} /> {likesCount}
            </button>
            <span className="flex items-center gap-1">
              <Eye size={12} /> {component.views_count || 0}
            </span>
          </div>
        </div>

        {/* Description */}
        {component.description && (
          <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">
            {component.description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.04] text-gray-500 border border-white/[0.06]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Author row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <img
              src={authorAvatarUrl}
              alt={authorName}
              className="w-5 h-5 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = getAvatarForUser(null);
              }}
            />
            <span className="text-[11px] text-gray-500 truncate max-w-[120px]">{authorName}</span>
          </div>
          {component.component_type && (
            <span
              className={
                "text-[9px] font-semibold px-1.5 py-0.5 rounded " +
                (isTemplate
                  ? "bg-purple-500/10 text-purple-400"
                  : "bg-blue-500/10 text-blue-400")
              }
            >
              {isTemplate ? "Template" : "Component"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
