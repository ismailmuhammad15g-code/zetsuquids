"use client";

import {
  ArrowLeft,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  Save,
  Settings,
  Upload,
  X,
  Terminal,
  ChevronUp,
  ChevronDown,
  Pencil,
  Monitor,
  Tablet,
  Smartphone,
  Wand2,
} from "lucide-react";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../../contexts/AuthContext";
import { getAvatarForUser } from "../../../../lib/avatar";
import { supabase, uiComponentsApi } from "../../../../lib/supabase";
import { uploadToGitHub, uploadComponentCode, isGitHubConfigured } from "../../../../lib/github-assets";
import { detectSecrets } from "../../../../lib/secret-analyzer";

// Sub-components
import { AuthGateOverlay } from "./_components/AuthGateOverlay";
import { SkeletonPreview } from "./_components/SkeletonPreview";
import { ProblemsPanel } from "./_components/ProblemsPanel";
import { PublishModal } from "./_components/PublishModal";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function decryptEnv(encrypted: string): Record<string, string> {
  if (!encrypted || encrypted === "{}") return {};
  try {
    return JSON.parse(atob(encrypted));
  } catch {
    return {};
  }
}

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Draft auto-save key
const DRAFT_KEY = "create-component-draft";
const DRAFT_MAX_AGE = 24 * 60 * 60 * 1000; // 24h

interface Marker {
  severity: number;
  message: string;
  startLineNumber: number;
  startColumn: number;
  source: string;
}

function CreateComponentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profileAvatar, isAuthenticated, loading: authLoading } = useAuth();

  // Edit mode
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [title, setTitle] = useState("My Awesome Component");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [componentType, setComponentType] = useState<"component" | "template">("component");

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
  const [reactFiles, setReactFiles] = useState<{ name: string; content: string }[]>([
    {
      name: "App.tsx",
      content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex flex-col items-center gap-6 p-10">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Hello from React!
      </h1>
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition"
      >
        Clicked {count} times
      </button>
    </div>
  );
}`,
    },
  ]);
  const [activeReactFile, setActiveReactFile] = useState(0);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "env" | "react">("html");
  const [creationMode, setCreationMode] = useState<"classic" | "react">("classic");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{ type: string; message: string; time: string }[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Preview loading state
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Monaco diagnostics
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [isProblemsOpen, setIsProblemsOpen] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Responsive preview
  const [previewWidth, setPreviewWidth] = useState<"100%" | "768px" | "375px">("100%");

  const screenshotRef = React.useRef<string | null>(null);

  // Secret detection state
  const [detectedEnvCount, setDetectedEnvCount] = useState(0);
  const lastDetectedRef = useRef<Set<string>>(new Set());
  const clearBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Draft auto-save timer
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount (only if not edit mode)
  useEffect(() => {
    if (isEditMode) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (Date.now() - draft.timestamp > DRAFT_MAX_AGE) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      if (draft.title) setTitle(draft.title);
      if (draft.description) setDescription(draft.description);
      if (draft.tags) setTags(draft.tags);
      if (draft.componentType) setComponentType(draft.componentType);
      if (draft.creationMode) setCreationMode(draft.creationMode);
      if (draft.htmlCode) setHtmlCode(draft.htmlCode);
      if (draft.cssCode) setCssCode(draft.cssCode);
      if (draft.jsCode) setJsCode(draft.jsCode);
      if (draft.envCode) setEnvCode(draft.envCode);
      if (draft.reactFiles) setReactFiles(draft.reactFiles);
      toast.info("Draft restored", { duration: 3000 });
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft every 10s
  useEffect(() => {
    if (isEditMode) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            title,
            description,
            tags,
            componentType,
            creationMode,
            htmlCode,
            cssCode,
            jsCode,
            envCode,
            reactFiles,
            timestamp: Date.now(),
          })
        );
      } catch {
        // quota exceeded — ignore
      }
    }, 10000);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [title, description, tags, componentType, creationMode, htmlCode, cssCode, jsCode, envCode, reactFiles, isEditMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S → open publish modal
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (showPublishModal) {
          // If modal is open, trigger save
          handleSave();
        } else {
          setShowPublishModal(true);
        }
      }
      // Escape → close modals
      if (e.key === "Escape") {
        if (showPublishModal) setShowPublishModal(false);
        if (showNewFileDialog) setShowNewFileDialog(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Direct Site Actions: Load title/description from URL params
  useEffect(() => {
    if (!isEditMode) {
      const titleParam = searchParams.get("title");
      const descParam = searchParams.get("desc");
      if (titleParam) setTitle(decodeURIComponent(titleParam));
      if (descParam) setDescription(decodeURIComponent(descParam));
    }
  }, [searchParams, isEditMode]);

  // Load existing component data when in edit mode
  useEffect(() => {
    if (!editId) return;
    async function loadForEdit() {
      try {
        const all = await uiComponentsApi.getAll();
        let found = all.find((c) => String(c.id) === String(editId));
        if (!found) {
          toast.error("Component not found");
          return;
        }

        if (found.lottie_url && found.lottie_url.includes("githubusercontent")) {
          try {
            const res = await fetch(found.lottie_url);
            if (res.ok) {
              const githubCode = await res.json();
              found = { ...found, ...githubCode };
            }
          } catch (err) {
            console.error("Failed to fetch code from GitHub for edit:", err);
          }
        }

        const comp = found!;

        setTitle(comp.title || "");
        setDescription(comp.description || "");
        setTags((comp.tags || []).join(", "));
        setComponentType((comp.component_type as "component" | "template") || "component");

        const hasReact = comp.react_files && comp.react_files.length > 0;
        if (hasReact) {
          setCreationMode("react");
          setActiveTab("react");
          setReactFiles(comp.react_files!);
        } else {
          setCreationMode("classic");
          setActiveTab("html");
          setHtmlCode(comp.html_code || "");
          setCssCode(comp.css_code || "");
          setJsCode(comp.js_code || "");
        }
        const rawEnvVars = comp.env_vars as string | Record<string, string> | null;
        let envVars: Record<string, string> = {};
        if (typeof rawEnvVars === "string" && rawEnvVars.length > 0 && rawEnvVars !== "{}") {
          try {
            envVars = decryptEnv(rawEnvVars);
          } catch (e) {
            console.error("Failed to decrypt env vars:", e);
          }
        } else if (typeof rawEnvVars === "object" && rawEnvVars) {
          envVars = rawEnvVars as Record<string, string>;
        }
        if (Object.keys(envVars).length > 0) {
          setEnvCode(
            Object.entries(envVars)
              .map(([k, v]) => `${k}=${v}`)
              .join("\n")
          );
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load component for editing");
      }
    }
    loadForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CONSOLE_LOG") {
        setConsoleLogs((prev) => [
          ...prev,
          { type: event.data.logType, message: event.data.message, time: new Date().toLocaleTimeString() },
        ]);
      } else if (event.data?.type === "CONSOLE_CLEAR") {
        setConsoleLogs([]);
      } else if (event.data?.type === "SCREENSHOT_DATA") {
        screenshotRef.current = event.data.dataUrl;
      } else if (event.data?.type === "PREVIEW_READY") {
        setIsPreviewLoading(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Secret detector
  useEffect(() => {
    const timer = setTimeout(() => {
      const code = creationMode === "react" ? reactFiles.map((f) => f.content).join("\n") : htmlCode + jsCode;

      if (!code.trim()) return;

      const secrets = detectSecrets(code);
      if (!secrets.length) return;

      const activeKeys = new Set(
        envCode
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#"))
          .map((l) => l.split("=")[0])
      );

      const newOnes = secrets.filter((s) => !activeKeys.has(s.name));
      if (!newOnes.length) return;

      const unique = newOnes.filter((s, i, a) => a.findIndex((x) => x.name === s.name) === i);

      setEnvCode((prev) => {
        const keysInPrev = new Set(
          prev
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith("#"))
            .map((l) => l.split("=")[0])
        );

        const toAdd = unique.filter((s) => !keysInPrev.has(s.name));
        if (!toAdd.length) return prev;

        const lines = prev.split("\n");
        let insertAfter = 0;
        for (let i = 0; i < lines.length; i++) {
          const t = lines[i].trim();
          if (!t || t.startsWith("#")) {
            insertAfter = i + 1;
          } else {
            break;
          }
        }

        const header = ["# --- DETECTED (fill values below) ---"];
        const detected = toAdd.map((s) => `${s.name}=`);

        const next = [...lines.slice(0, insertAfter), ...header, ...detected, "", ...lines.slice(insertAfter)].join(
          "\n"
        );

        toAdd.forEach((s) => lastDetectedRef.current.add(s.name));

        setDetectedEnvCount((c) => c + toAdd.length);
        setActiveTab("env");

        if (clearBadgeTimerRef.current !== null) clearTimeout(clearBadgeTimerRef.current);
        clearBadgeTimerRef.current = setTimeout(() => setDetectedEnvCount(0), 5000);

        toast.success(`Found ${toAdd.length} secret${toAdd.length > 1 ? "s" : ""}`, {
          description: toAdd.map((s) => s.name).join(", "),
          duration: 5000,
        });

        return next;
      });
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlCode, jsCode, reactFiles, creationMode, envCode]);

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

  // Parse ENV immediately
  useEffect(() => {
    const envObj: Record<string, string> = {};
    envCode.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...values] = trimmed.split("=");
        if (key && values.length > 0) {
          let val = values.join("=").trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          envObj[key.trim()] = val;
        }
      }
    });
    setParsedEnv(envObj);
  }, [envCode]);

  // Debounce HTML/CSS/JS only
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHtml(htmlCode);
      setDebouncedCss(cssCode);
      setDebouncedJs(jsCode);
    }, 800);
    return () => clearTimeout(handler);
  }, [htmlCode, cssCode, jsCode]);

  const handleEnvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setEnvCode((prev) => prev + "\n" + ev.target!.result);
          toast.success("ENV file loaded");
        }
      };
      reader.readAsText(file);
    }
  };

  // Save handler — auth-gated
  const handleSave = async () => {
    if (!isAuthenticated()) {
      toast.error("You must be signed in to publish a component");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for your component");
      return;
    }

    setIsSaving(true);

    // Trigger screenshot capture in the active iframe
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "CAPTURE_SCREENSHOT" }, "*");
    }

    // Wait for the screenshot to be captured
    await new Promise((r) => setTimeout(r, 1200));

    // Upload screenshot to GitHub
    let previewUrl: string | undefined = undefined;
    const rawDataUrl = screenshotRef.current;
    if (rawDataUrl) {
      try {
        if (!isGitHubConfigured()) throw new Error("GitHub is not configured. Check your .env.local");
        const uploaded = await uploadToGitHub(rawDataUrl, "previews");
        previewUrl = uploaded.url;
      } catch (uploadErr: any) {
        toast.error(`GitHub Image Upload Failed: ${uploadErr.message}`);
        setIsSaving(false);
        return;
      }
    }

    // Upload code bundle to GitHub
    const componentId = isEditMode && editId ? String(editId) : crypto.randomUUID();
    let codeGithubUrl: string | undefined = undefined;
    try {
      if (!isGitHubConfigured()) throw new Error("GitHub is not configured");
      codeGithubUrl = await uploadComponentCode(componentId, {
        mode: creationMode,
        react_files: creationMode === "react" ? reactFiles : undefined,
        html_code: creationMode === "classic" ? htmlCode : undefined,
        css_code: creationMode === "classic" ? cssCode : undefined,
        js_code: creationMode === "classic" ? jsCode : undefined,
      });
    } catch (codeErr: any) {
      toast.error(`GitHub Code Upload Failed: ${codeErr.message}`);
      setIsSaving(false);
      return;
    }

    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const resolvedAvatar =
        profileAvatar || (user?.user_metadata as any)?.avatar_url || userAvatarUrl || getAvatarForUser(user?.email || null);

      const payload = {
        title,
        description,
        tags: tagsArray,
        env_vars: JSON.stringify(parsedEnv) as any,
        html_code: creationMode === "classic" ? (codeGithubUrl ? "" : htmlCode) : "",
        css_code: creationMode === "classic" ? (codeGithubUrl ? "" : cssCode) : "",
        js_code: creationMode === "classic" ? (codeGithubUrl ? "" : jsCode) : "",
        react_files: creationMode === "react" ? (codeGithubUrl ? [] : reactFiles) : [],
        preview_url: previewUrl,
        lottie_url: codeGithubUrl,
        theme: "light" as const,
        component_type: componentType,
      };

      const authorName =
        (user?.user_metadata as any)?.full_name || (user?.email ? user.email.split("@")[0] : "Anonymous Maker");

      if (isEditMode && editId) {
        await uiComponentsApi.update(String(editId), {
          ...payload,
          author_name: authorName,
          author_avatar: resolvedAvatar,
        });
        toast.success("Component updated successfully!");
        // Clear draft on successful save
        localStorage.removeItem(DRAFT_KEY);
        router.push(`/components/${editId}`);
      } else {
        await uiComponentsApi.create({
          id: componentId,
          author_name: authorName,
          author_avatar: resolvedAvatar,
          author_id: user?.id || undefined,
          ...payload,
        });
        toast.success("Component published successfully!");
        // Clear draft on successful save
        localStorage.removeItem(DRAFT_KEY);
        router.push("/components");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save component");
    } finally {
      setIsSaving(false);
      setShowPublishModal(false);
    }
  };

  // Monaco onMount — configure TypeScript diagnostics
  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure TypeScript compiler options for React JSX
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
      strict: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      noEmit: true,
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // Enable diagnostics — ignore module-not-found (2307) and implicit any (7016)
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [2307, 7016, 2304, 2686],
    });

    // Add type declarations for common globals
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare var window: Window & typeof globalThis;
      declare var document: Document;
      declare var console: Console;
      declare var setTimeout: typeof globalThis.setTimeout;
      declare var clearTimeout: typeof globalThis.clearTimeout;
      declare var setInterval: typeof globalThis.setInterval;
      declare var clearInterval: typeof globalThis.clearInterval;
      declare var fetch: typeof globalThis.fetch;
      declare var alert: (message?: any) => void;
      declare var confirm: (message?: string) => boolean;
      declare var prompt: (message?: string, _default?: string) => string | null;
      declare var localStorage: Storage;
      declare var sessionStorage: Storage;
      declare var ENV: Record<string, string>;
      declare var process: { env: Record<string, string> };
      `,
      "ts:global.d.ts"
    );

    // JavaScript diagnostics for classic mode
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });

    // Listen for marker changes
    const updateMarkers = () => {
      const model = editor.getModel();
      if (!model) return;
      const currentMarkers = monaco.editor.getModelMarkers({ resource: model.uri });
      setMarkers(
        currentMarkers.map((m: any) => ({
          severity: m.severity,
          message: m.message,
          startLineNumber: m.startLineNumber,
          startColumn: m.startColumn,
          source: m.source || "",
        }))
      );
    };

    monaco.editor.onDidChangeMarkers(updateMarkers);
    // Initial markers
    setTimeout(updateMarkers, 1000);
  }, []);

  // Jump to line in editor
  const handleMarkerClick = useCallback(
    (line: number, column: number) => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(line);
        editorRef.current.setPosition({ lineNumber: line, column });
        editorRef.current.focus();
      }
    },
    []
  );

  // Format code
  const handleFormatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  }, []);

  // Classic iframe srcdoc
  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: transparent; font-family: system-ui, -apple-system, sans-serif; }
          ${debouncedCss}
        </style>
      </head>
      <body>
        <div id="capture-area" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
          ${debouncedHtml}
        </div>
        <script>
          window.ENV = ${JSON.stringify(parsedEnv)};
          window.process = window.process || {};
          window.process.env = window.ENV;
          try { ${debouncedJs} } catch (e) { console.error(e); }
          window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
          window.addEventListener('message', (e) => {
            if (e.data.type === 'CAPTURE_SCREENSHOT') {
              html2canvas(document.body, { backgroundColor: null, logging: false }).then(canvas => {
                window.parent.postMessage({ type: 'SCREENSHOT_DATA', dataUrl: canvas.toDataURL('image/webp', 0.5) }, '*');
              });
            }
          });
        </script>
      </body>
    </html>
  `;

  // Smart entry-point detection
  const ENTRY_PRIORITY = [
    "App.tsx",
    "App.jsx",
    "App.ts",
    "App.js",
    "index.tsx",
    "index.jsx",
    "index.ts",
    "index.js",
    "main.tsx",
    "main.jsx",
  ];

  function getEntryCode(files: { name: string; content: string }[]): string {
    const map: Record<string, string> = {};
    files.forEach((f) => {
      map[f.name] = f.content;
    });
    for (const name of ENTRY_PRIORITY) {
      if (map[name]) return map[name];
    }
    return files[0]?.content || 'export default function App() { return <div>No Code Found</div>; }';
  }

  // Detect language for Monaco from file extension
  const getMonacoLang = (fileName: string) => {
    if (fileName.endsWith(".tsx") || fileName.endsWith(".ts")) return "typescript";
    if (fileName.endsWith(".jsx") || fileName.endsWith(".js")) return "javascript";
    if (fileName.endsWith(".css")) return "css";
    if (fileName.endsWith(".json")) return "json";
    return "typescript";
  };

  // React preview doc
  const [reactPreviewDoc, setReactPreviewDoc] = useState("");

  useEffect(() => {
    if (creationMode !== "react") return;

    // Show skeleton when code changes
    setIsPreviewLoading(true);

    const appCode = getEntryCode(reactFiles);

    const filesMap: Record<string, string> = {};
    reactFiles.forEach((f) => {
      filesMap[f.name] = f.content;
    });

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

    let rawCode = appCode;
    rawCode = rawCode.replace(/import\.meta\.env/g, "window.process.env");

    const envObject = parsedEnv;

    const doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <script type="importmap">${importmapJson}</script>
  <script>
    (function() {
      var env = ${JSON.stringify(envObject)};
      window.ENV = env;
      window.process = window.process || {};
      window.process.env = env;
      window.importMeta = { env: env };
      for (var key in env) {
        if (env.hasOwnProperty(key) && env[key] && env[key].length > 0) {
          window[key] = env[key];
          try { eval('var ' + key + ' = "' + env[key] + '"'); } catch(e) {}
        }
      }
    })();
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100%; background: transparent; }
    body { font-family: system-ui,-apple-system,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; }
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
      window.addEventListener('message', (e) => {
        if (e.data.type === 'CAPTURE_SCREENSHOT') {
          html2canvas(document.body, { backgroundColor: null, logging: false }).then(canvas => {
            window.parent.postMessage({ type: 'SCREENSHOT_DATA', dataUrl: canvas.toDataURL('image/webp', 0.5) }, '*');
          });
        }
      });
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
        let rawCode = ${JSON.stringify(rawCode)};
        const env = ${JSON.stringify(envObject)};

        if (Object.keys(env).length > 0) {
          const prefixes = ['PASTE_YOUR_', 'YOUR_', 'EXAMPLE_', 'INSERT_', 'REPLACE_'];
          const suffixes = ['_HERE', ''];
          for (const key in env) {
            const value = env[key];
            if (!value) continue;
            for (let pi = 0; pi < prefixes.length; pi++) {
              for (let si = 0; si < suffixes.length; si++) {
                const placeholder = prefixes[pi] + key + suffixes[si];
                const regex = new RegExp('([=!]==?\\\\s*)?("' + placeholder + '")', 'gi');
                rawCode = rawCode.replace(regex, function(m, p1) {
                  return p1 ? m : '"' + value + '"';
                });
              }
            }
            for (let pi = 0; pi < prefixes.length; pi++) {
              const placeholderNoSuffix = prefixes[pi] + key;
              const regex2 = new RegExp('([=!]==?\\\\s*)?("' + placeholderNoSuffix + '")', 'gi');
              rawCode = rawCode.replace(regex2, function(m, p1) {
                return p1 ? m : '"' + value + '"';
              });
            }
          }
          for (const key in env) {
            if (env[key]) {
              const regex3 = new RegExp('([=!]==?\\\\s*)?("PASTE_YOUR_[^"]+")', 'gi');
              rawCode = rawCode.replace(regex3, function(m, p1, p2) {
                if (p1) return m;
                if (p2.toLowerCase().includes(key.toLowerCase())) {
                  return '"' + env[key] + '"';
                }
                return m;
              });
            }
          }
        }

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
          root.innerHTML = '<div class="preview-error">Warning: No default export found or App is not a component.</div>';
          window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
        }
      } catch (err) {
        root.innerHTML = '<div class="preview-error"><b>Runtime Error:</b><br/>'+err.message+'</div>';
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
      }
    }
    run();
  </script>
</body>
</html>`;

    const timeout = setTimeout(() => setReactPreviewDoc(doc), 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactFiles, creationMode, JSON.stringify(parsedEnv)]);

  // Helper to determine the language for Monaco (classic tabs)
  const getLanguage = (tab: string) => {
    if (tab === "js") return "javascript";
    if (tab === "react") return "typescript";
    if (tab === "env") return "shell";
    return tab;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#1e1e1e] text-gray-100 font-sans">
      {/* Auth Gate Overlay */}
      {!authLoading && !isAuthenticated() && <AuthGateOverlay />}

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="shrink-0 flex items-center justify-between px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <Pencil size={14} className="text-amber-400" />
            <span className="text-amber-300 font-bold text-sm tracking-wide">EDIT MODE</span>
            <span className="text-amber-400/60 text-xs">You are editing an existing component — saving will update it</span>
          </div>
          <button
            onClick={() => router.push(`/components/${editId}`)}
            className="text-xs text-amber-400/60 hover:text-amber-300 transition px-3 py-1 rounded border border-amber-500/20 hover:border-amber-500/40"
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* Top Navbar — VS Code / Cursor Style */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-3 sm:px-5 bg-[#252526] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/components" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-gray-200 flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="h-5 w-px bg-white/10 hidden sm:block" />

          {/* Brand badge — flat blue */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#007acc] flex items-center justify-center flex-shrink-0">
              <Layers size={11} className="text-white" />
            </div>
            <span className="text-[11px] font-black text-white/80 tracking-widest uppercase">Studio</span>
          </div>

          <div className="h-5 w-px bg-white/10 hidden sm:block" />

          {/* Mode switcher — flat active state */}
          <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/8 gap-0.5">
            <button
              onClick={() => {
                setCreationMode("classic");
                setActiveTab("html");
              }}
              className={
                "flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-md transition-all " +
                (creationMode === "classic"
                  ? "bg-[#007acc] text-white"
                  : "text-gray-500 hover:text-gray-300")
              }
            >
              <span className="hidden xs:inline">HTML/CSS</span>
              <span className="xs:hidden">HTML</span>
            </button>
            <button
              onClick={() => {
                setCreationMode("react");
                setActiveTab("react");
              }}
              className={
                "flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-md transition-all " +
                (creationMode === "react"
                  ? "bg-[#007acc] text-white"
                  : "text-gray-500 hover:text-gray-300")
              }
            >
              <span>React</span>
            </button>
          </div>
        </div>

        {/* Title in center */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block pointer-events-none">
          <span className="text-xs text-gray-600 font-mono truncate max-w-[200px] block text-center">
            {title || "untitled-component"}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
          </div>

          <Button
            size="sm"
            onClick={() => setShowPublishModal(true)}
            disabled={isSaving}
            className="gap-1.5"
          >
            <Save size={13} />
            <span className="hidden sm:inline">Publish</span>
            <kbd className="hidden sm:inline ml-1 text-[9px] opacity-60 border border-white/20 rounded px-1 py-0.5">
              Ctrl+S
            </kbd>
          </Button>
        </div>
      </div>

      {/* Editor Main Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Code Editor */}
        <div className={"flex flex-col border-r border-white/5 bg-[#0d0d12] " + (isFullscreen ? "hidden" : "w-full lg:w-1/2 flex")}>
          {/* Tabs — VS Code style */}
          <div className="flex bg-[#0a0a0f] shrink-0 overflow-x-auto no-scrollbar border-b border-white/5">
            {(creationMode === "classic" ? ["html", "css", "js", "env"] : ["react", "env"]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={
                  "flex items-center gap-1.5 px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap " +
                  (activeTab === tab
                    ? "bg-[#1e1e1e] text-white border-[#007acc]"
                    : "border-transparent text-gray-500 hover:text-gray-300")
                }
              >
                {tab === "env" && <Settings size={11} />}
                {tab === "react" && <Layers size={11} className="text-gray-400" />}
                {tab}
                {tab === "env" && detectedEnvCount > 0 && (
                  <Badge variant="destructive" className="h-4 px-1.5 text-[8px] font-bold animate-pulse">
                    {detectedEnvCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Editor Container */}
          <div className="flex-1 relative bg-[#0d0d12] flex flex-col">
            {/* React file sub-tabs */}
            {activeTab === "react" && (
              <div className="flex bg-[#0a0a0f] border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar items-stretch">
                {reactFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center group border-r border-white/5">
                    {renamingIdx === idx ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => {
                          if (renameValue.trim()) {
                            const updated = [...reactFiles];
                            updated[idx] = { ...updated[idx], name: renameValue.trim() };
                            setReactFiles(updated);
                          }
                          setRenamingIdx(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (renameValue.trim()) {
                              const updated = [...reactFiles];
                              updated[idx] = { ...updated[idx], name: renameValue.trim() };
                              setReactFiles(updated);
                            }
                            setRenamingIdx(null);
                          }
                          if (e.key === "Escape") setRenamingIdx(null);
                        }}
                        className="bg-[#007acc] text-white text-[10px] font-bold px-3 py-2 outline-none w-28 rounded"
                      />
                    ) : (
                      <button
                        onClick={() => setActiveReactFile(idx)}
                        onDoubleClick={() => {
                          setRenamingIdx(idx);
                          setRenameValue(file.name);
                        }}
                        title="Double-click to rename"
                        className={
                          "flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold transition-all " +
                          (activeReactFile === idx ? "text-white bg-[#1e1e1e]" : "text-gray-500 hover:text-gray-300")
                        }
                      >
                        <span className="opacity-40 text-[9px]">
                          {file.name.endsWith(".tsx") || file.name.endsWith(".ts") ? "TS" : "JS"}
                        </span>
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
                  onClick={() => {
                    setNewFileName("");
                    setShowNewFileDialog(true);
                  }}
                  className="px-4 py-2 text-[10px] font-bold text-gray-500 hover:text-white transition-all shrink-0 flex items-center gap-1"
                  title="Add new file"
                >
                  + New File
                </button>
                {/* Format button */}
                <button
                  onClick={handleFormatCode}
                  className="px-3 py-2 text-[10px] font-bold text-gray-500 hover:text-white transition-all shrink-0 flex items-center gap-1 ml-auto"
                  title="Format Code"
                >
                  <Wand2 size={11} />
                </button>
              </div>
            )}

            <div className="flex-1 relative">
              {activeTab === "env" && (
                <div className="absolute top-2 right-4 z-10 flex gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-[#333] hover:bg-[#444] text-xs px-3 py-1.5 rounded border border-[#555] transition text-gray-300">
                    <Upload size={12} /> Upload .env
                    <input type="file" className="hidden" accept=".env, .txt" onChange={handleEnvUpload} />
                  </label>
                </div>
              )}
              {activeTab === "env" && detectedEnvCount > 0 && (
                <div className="absolute top-2 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded text-blue-300 text-[11px] font-medium">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  {detectedEnvCount} secret{detectedEnvCount > 1 ? "s" : ""} detected — fill values below
                </div>
              )}
              <div className="absolute inset-0 pt-2">
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={
                    activeTab === "react"
                      ? getMonacoLang(reactFiles[activeReactFile]?.name || "App.tsx")
                      : getLanguage(activeTab)
                  }
                  value={
                    activeTab === "html"
                      ? htmlCode
                      : activeTab === "css"
                        ? cssCode
                        : activeTab === "js"
                          ? jsCode
                          : activeTab === "react"
                            ? reactFiles[activeReactFile]?.content
                            : envCode
                  }
                  onChange={(val) => {
                    if (val === undefined) return;
                    if (activeTab === "html") setHtmlCode(val);
                    else if (activeTab === "css") setCssCode(val);
                    else if (activeTab === "js") setJsCode(val);
                    else if (activeTab === "react") {
                      const newFiles = [...reactFiles];
                      newFiles[activeReactFile].content = val;
                      setReactFiles(newFiles);
                    } else setEnvCode(val);
                  }}
                  onMount={handleEditorMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    formatOnPaste: true,
                    suggest: {
                      showKeywords: true,
                      showSnippets: true,
                    },
                  }}
                />
              </div>
            </div>

            {/* Problems Panel — only in React mode */}
            {creationMode === "react" && (
              <ProblemsPanel
                markers={markers}
                isOpen={isProblemsOpen}
                onToggle={() => setIsProblemsOpen(!isProblemsOpen)}
                onMarkerClick={handleMarkerClick}
              />
            )}
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className={"flex flex-col relative overflow-hidden " + (isFullscreen ? "w-full" : "w-full lg:w-1/2")}>
          {/* Preview header bar — muted chrome */}
          <div className="h-9 bg-[#0a0a0f] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 opacity-40">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] text-gray-600 font-mono ml-2">preview</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Responsive preview toggle */}
              <div className="hidden lg:flex items-center gap-0.5 mr-2">
                <button
                  onClick={() => setPreviewWidth("100%")}
                  className={"p-1 rounded transition-all " + (previewWidth === "100%" ? "text-white bg-white/10" : "text-gray-600 hover:text-white")}
                  title="Desktop"
                >
                  <Monitor size={12} />
                </button>
                <button
                  onClick={() => setPreviewWidth("768px")}
                  className={"p-1 rounded transition-all " + (previewWidth === "768px" ? "text-white bg-white/10" : "text-gray-600 hover:text-white")}
                  title="Tablet"
                >
                  <Tablet size={12} />
                </button>
                <button
                  onClick={() => setPreviewWidth("375px")}
                  className={"p-1 rounded transition-all " + (previewWidth === "375px" ? "text-white bg-white/10" : "text-gray-600 hover:text-white")}
                  title="Mobile"
                >
                  <Smartphone size={12} />
                </button>
              </div>
              {creationMode === "classic" && (
                <button
                  onClick={() => {
                    setDebouncedHtml(htmlCode);
                    setDebouncedCss(cssCode);
                    setDebouncedJs(jsCode);
                  }}
                  className="p-1 text-gray-600 hover:text-emerald-400 rounded transition-all"
                  title="Rerun"
                >
                  <Play size={13} />
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 text-gray-600 hover:text-white rounded transition-all hidden lg:block"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
          </div>

          <div
            className="flex-1 relative w-full overflow-hidden flex justify-center"
            style={{
              background:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
              backgroundSize: "20px 20px",
              backgroundColor: "#0d0d12",
            }}
          >
            {creationMode === "react" ? (
              <div
                className="flex-1 flex flex-col relative bg-[#f8f9fa] border-t border-l border-gray-200 shadow-inner overflow-hidden transition-all duration-300"
                style={{ width: previewWidth, maxWidth: "100%" }}
              >
                {/* Skeleton overlay */}
                {isPreviewLoading && <SkeletonPreview />}

                <iframe
                  srcDoc={reactPreviewDoc}
                  title="React Live Preview"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  className={"w-full h-full flex-1 border-none bg-transparent transition-opacity duration-500 " + (isPreviewLoading ? "opacity-0" : "opacity-100")}
                />

                {/* Live Console */}
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#333] transition-all duration-300 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-20 ${isConsoleOpen ? "h-64" : "h-10"}`}
                >
                  <div
                    className="h-10 flex items-center justify-between px-4 cursor-pointer hover:bg-[#252526] transition-colors shrink-0"
                    onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  >
                    <div className="flex items-center gap-2 text-gray-300 text-xs font-bold uppercase tracking-widest">
                      <Terminal size={14} /> Console{" "}
                      {consoleLogs.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-bold">
                          {consoleLogs.length}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {isConsoleOpen && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConsoleLogs([]);
                          }}
                          className="text-gray-500 hover:text-gray-300 text-xs"
                        >
                          Clear
                        </button>
                      )}
                      {isConsoleOpen ? (
                        <ChevronDown size={16} className="text-gray-500" />
                      ) : (
                        <ChevronUp size={16} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                  {isConsoleOpen && (
                    <div className="flex-1 overflow-auto p-4 font-mono text-[11px] space-y-2 no-scrollbar bg-[#0d0d0d]">
                      {consoleLogs.length === 0 ? (
                        <div className="text-gray-600 italic">No logs yet...</div>
                      ) : (
                        consoleLogs.map((log, i) => (
                          <div
                            key={i}
                            className={`flex gap-3 pb-1 border-b border-[#222] ${
                              log.type === "error"
                                ? "text-red-400"
                                : log.type === "warn"
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                            }`}
                          >
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
              <div className="w-full h-full flex justify-center transition-all duration-300" style={{ maxWidth: previewWidth }}>
                <iframe
                  srcDoc={iframeSrcDoc}
                  title="Live Preview"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  className="w-full flex-1 border-none bg-transparent"
                  style={{
                    backgroundImage: "radial-gradient(circle, #00000008 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Modal — shadcn Dialog */}
      <PublishModal
        open={showPublishModal}
        onOpenChange={setShowPublishModal}
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
        componentType={componentType}
        onComponentTypeChange={setComponentType}
        tags={tags}
        onTagsChange={setTags}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {/* New File Dialog — shadcn Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent className="sm:max-w-md bg-[#1e1e1e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Quick presets:</p>
            <div className="grid grid-cols-2 gap-2">
              {["App.tsx", "index.tsx", "Component.tsx", "utils.ts", "helpers.js", "styles.css"].map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => setNewFileName(preset)}
                    className={
                      "text-left px-3 py-2 rounded-lg text-[11px] font-mono transition-all " +
                      (newFileName === preset
                        ? "bg-[#007acc]/20 text-[#007acc] border border-[#007acc]/30"
                        : "bg-[#2d2d2d] text-gray-400 hover:bg-[#333] hover:text-white border border-transparent")
                    }
                  >
                    {preset}
                  </button>
                )
              )}
            </div>
            <Input
              autoFocus
              type="text"
              placeholder="Header.tsx, utils.ts, styles.css..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFileName.trim()) {
                  const name = newFileName.trim();
                  const ext = name.split(".").pop() || "";
                  const base = name.replace(/\.[^.]+$/, "");
                  const template =
                    ext === "css"
                      ? `/* ${name} */\n`
                      : ext === "json"
                        ? "{}\n"
                        : ext === "ts" || ext === "js"
                          ? `// ${name}\n\nexport function ${base}() { return ''; }\n`
                          : `import React from 'react';\n\nexport default function ${base}() {\n  return <div className="p-4">${base}</div>;\n}\n`;
                  setReactFiles((prev) => [...prev, { name, content: template }]);
                  setActiveReactFile(reactFiles.length);
                  setShowNewFileDialog(false);
                }
              }}
              className="bg-[#2d2d2d] border-[#444] text-white font-mono focus:border-[#007acc] focus:ring-[#007acc]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowNewFileDialog(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              disabled={!newFileName.trim()}
              onClick={() => {
                const name = newFileName.trim();
                const ext = name.split(".").pop() || "";
                const base = name.replace(/\.[^.]+$/, "");
                const template =
                  ext === "css"
                    ? `/* ${name} */\n`
                    : ext === "json"
                      ? "{}\n"
                      : ext === "ts" || ext === "js"
                        ? `// ${name}\n\nexport function ${base}() { return ''; }\n`
                        : `import React from 'react';\n\nexport default function ${base}() {\n  return <div className="p-4">${base}</div>;\n}\n`;
                setReactFiles((prev) => [...prev, { name, content: template }]);
                setActiveReactFile(reactFiles.length);
                setShowNewFileDialog(false);
              }}
            >
              Create File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CreateComponentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CreateComponentContent />
    </React.Suspense>
  );
}
