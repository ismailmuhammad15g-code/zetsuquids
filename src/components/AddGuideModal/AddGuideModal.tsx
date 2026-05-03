"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Plus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createRoot } from "react-dom/client";

import { useAuth } from "../../contexts/AuthContext";
import { useInvalidateGuides } from "../../hooks/useGuides";
import { guidesApi } from "../../lib/api";
import { uploadImageToImgBB } from "../../lib/imgbb";
import { resizeImage } from "../../lib/resizepro";

import { FormData, MainTab, PreviewDevice } from "./types";
import { validateContent } from "./utils";
import { EditorTab } from "./EditorTab";
import { PreviewTab } from "./PreviewTab";
import { DetailsTab } from "./DetailsTab";
import { ModalsContainer } from "./ModalsContainer";
import { AdvancedImageModal } from "./AdvancedImageModal";

import QuizComponent from "../quiz/QuizComponent";
import { PlaygroundPreview } from "../EditorToolForms";

export default function AddGuideModal({ onClose }: { onClose: () => void }) {
  // Add custom styles for the modal
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #d1d5db;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .prose pre {
        background-color: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 0.75rem !important;
        color: #1e293b !important;
        padding: 1.5rem !important;
      }
      .prose code {
        color: #e11d48 !important;
        background-color: #fff1f2 !important;
        padding: 0.2em 0.4em !important;
        border-radius: 0.25rem !important;
        font-weight: 600 !important;
      }
      .prose pre code {
        color: inherit !important;
        background-color: transparent !important;
        padding: 0 !important;
        font-weight: 400 !important;
      }
      .preview-content img {
        transition: transform 0.3s ease;
      }
      .preview-content img:hover {
        transform: scale(1.02);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const { user, isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("editor");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("laptop");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Interactive Modal States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showCalloutModal, setShowCalloutModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showFigureModal, setShowFigureModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFootnoteModal, setShowFootnoteModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showKbdModal, setShowKbdModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showCTAModal, setShowCTAModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showTabsModal, setShowTabsModal] = useState(false);
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [showCodeDiffModal, setShowCodeDiffModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showKeyValueModal, setShowKeyValueModal] = useState(false);
  const [showPlaygroundModal, setShowPlaygroundModal] = useState(false);
  const [showDownloadLinkModal, setShowDownloadLinkModal] = useState(false);
  const [showAdvancedImageModal, setShowAdvancedImageModal] = useState(false);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    keywords: "",
    content: "",
    html_content: "",
    css_content: "",
    cover_image: "",
  });

  const [slugValue, setSlugValue] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [autoResize, setAutoResize] = useState(true);
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [coverUrlError, setCoverUrlError] = useState("");
  const [isFetchingCoverUrl, setIsFetchingCoverUrl] = useState(false);
  const [credits, setCredits] = useState(0);

  const invalidateGuides = useInvalidateGuides();

  useEffect(() => {
    if (user?.email) {
      setCredits(0);
    }
  }, [user]);

  const readTime = Math.max(1, Math.ceil((formData.content?.split(/\s+/).length || 0) / 200));

  useEffect(() => {
    const slugBase = (formData.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlugValue(slugBase);
  }, [formData.title]);

  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        localStorage.setItem("add_guide_draft_v1", JSON.stringify({ formData, slugValue, savedAt: Date.now() }));
      } catch (e) {
        console.warn("Failed to save draft", e);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [formData, slugValue]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    setValidationErrors(validateContent(formData, "markdown"));
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [formData]);

  // Hydration logic for Preview (Ported from original)
  useEffect(() => {
    if (mainTab === "preview" || mainTab === "editor") {
      const timer = setTimeout(() => {
        // Hydrate Quizzes
        document.querySelectorAll(".interactive-quiz-container").forEach((container: any) => {
          if (container.getAttribute("data-hydrated") === "true") return;
          const encoded = container.getAttribute("data-quiz");
          if (!encoded) return;
          try {
            const json = decodeURIComponent(atob(encoded).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
            const data = JSON.parse(json);
            const root = createRoot(container);
            root.render(<QuizComponent data={data} />);
            container.setAttribute("data-hydrated", "true");
          } catch (e) { console.error(e); }
        });

        // Hydrate Playgrounds
        document.querySelectorAll(".zetsu-playground-container").forEach((container: any) => {
          if (container.getAttribute("data-hydrated") === "true") return;
          const dataEl = container.querySelector(".playground-data");
          if (!dataEl) return;
          const encoded = dataEl.textContent?.trim();
          if (!encoded) return;
          try {
            const decoded = decodeURIComponent(atob(encoded)).trim();
            const firstBrace = decoded.indexOf("{");
            const lastBrace = decoded.lastIndexOf("}");
            const data = JSON.parse(decoded.substring(firstBrace, lastBrace + 1));
            const root = createRoot(container);
            root.render(<PlaygroundPreview data={data} />);
            container.setAttribute("data-hydrated", "true");
          } catch (e) { console.error(e); }
        });

        // Hydrate Mermaid
        const mermaidBlocks = document.querySelectorAll("pre code.language-mermaid");
        if (mermaidBlocks.length) {
          import("mermaid").then(mod => {
            const mermaid = mod.default || mod;
            try { mermaid.initialize({ startOnLoad: false }); } catch (e) {}
            mermaidBlocks.forEach((codeEl: any) => {
              const pre = codeEl.closest("pre");
              if (!pre || pre.getAttribute("data-mermaid-hydrated") === "true") return;
              const diagramCode = codeEl.textContent || "";
              try {
                const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
                if (mermaid.mermaidAPI && (mermaid.mermaidAPI as any).render) {
                  (mermaid.mermaidAPI as any).render(id, diagramCode, (svgCode: string) => {
                    const wrapper = document.createElement("div");
                    wrapper.className = "mermaid-render";
                    wrapper.innerHTML = svgCode;
                    pre.replaceWith(wrapper);
                  });
                }
                pre.setAttribute("data-mermaid-hydrated", "true");
              } catch (e) { console.error(e); }
            });
          });
        }

        // Highlight.js
        if (typeof window !== "undefined" && (window as any).hljs) {
          document.querySelectorAll("pre code").forEach((block) => {
            if (!block.classList.contains("language-mermaid") && !block.getAttribute("data-highlighted")) {
              (window as any).hljs.highlightElement(block);
            }
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [formData.content, mainTab]);

  const insertText = (textToInsert: string): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = formData.content.substring(0, start) + textToInsert + formData.content.substring(end);
    setFormData({ ...formData, content: newText });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const wrapSelection = (before: string, after: string, fallback = "") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      insertText(before + fallback + after);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const sel = formData.content.substring(start, end) || fallback;
    const newText = formData.content.substring(0, start) + before + sel + after + formData.content.substring(end);
    setFormData((prev: FormData) => ({ ...prev, content: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + sel.length);
    }, 0);
  };

  const handleToolbarAction = (action: string): void => {
    switch (action) {
      case "bold": wrapSelection("**", "**", "Bold Text"); break;
      case "italic": wrapSelection("*", "*", "Italic Text"); break;
      case "strikethrough": wrapSelection("~~", "~~", "Strikethrough text"); break;
      case "inline-code": wrapSelection("`", "`", "code"); break;
      case "h1": insertText("\n# Heading 1\n"); break;
      case "h2": insertText("\n## Heading 2\n"); break;
      case "h3": insertText("\n### Heading 3\n"); break;
      case "list": insertText("\n- List item\n"); break;
      case "ordered-list": insertText("\n1. List item\n"); break;
      case "task-list": insertText("\n- [ ] Task item\n"); break;
      case "hr": insertText("\n---\n"); break;
      case "quote": wrapSelection("\n> ", "", "Quote"); break;
      case "highlight": wrapSelection("<mark>", "</mark>", "highlighted text"); break;
      case "toc": insertText("\n[TOC]\n"); break;
      case "emoji": insertText("✨"); break;
      case "mermaid": insertText("\n```mermaid\nflowchart LR\n  A[Start] --> B[End]\n```\n"); break;
      case "columns": insertText("\n:::columns\n:::column\nColumn 1 content\n:::\n:::column\nColumn 2 content\n:::\n:::\n"); break;
      
      // Modals
      case "link": setShowLinkModal(true); break;
      case "table": setShowTableModal(true); break;
      case "code": setShowCodeModal(true); break;
      case "figure": setShowFigureModal(true); break;
      case "details": setShowDetailsModal(true); break;
      case "footnote": setShowFootnoteModal(true); break;
      case "badge": setShowBadgeModal(true); break;
      case "kbd": setShowKbdModal(true); break;
      case "pull-quote": setShowQuoteModal(true); break;
      case "anchor": setShowAnchorModal(true); break;
      case "cta": setShowCTAModal(true); break;
      case "steps": setShowStepsModal(true); break;
      case "timeline": setShowTimelineModal(true); break;
      case "comparison": setShowComparisonModal(true); break;
      case "alert": setShowAlertModal(true); break;
      case "tabs": setShowTabsModal(true); break;
      case "definition": setShowDefinitionModal(true); break;
      case "code-diff": setShowCodeDiffModal(true); break;
      case "faq": setShowFAQModal(true); break;
      case "version": setShowVersionModal(true); break;
      case "key-value": setShowKeyValueModal(true); break;
      case "run": setShowPlaygroundModal(true); break;
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    let finalFile: File | Blob = file;
    if (autoResize) {
      try {
        const toastId = toast.loading("Resizing image...");
        const resizedBlob = await resizeImage(file, { width: 1200, height: 675, fitMode: "fill", format: "image/jpeg", quality: 92 });
        finalFile = new File([resizedBlob], file.name, { type: "image/jpeg" });
        toast.success("Resized!", { id: toastId });
      } catch (err) { toast.error("Resize failed"); }
    }
    try {
      const toastId = toast.loading("Uploading...");
      const url = await uploadImageToImgBB(finalFile as File);
      setFormData((prev: FormData) => ({ ...prev, cover_image: url }));
      toast.success("Uploaded!", { id: toastId });
    } catch (err) { toast.error("Upload failed"); }
  };

  const handleCoverUrlPaste = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setCoverUrlError("");
    const raw = coverUrlInput.trim();
    if (!raw) return;
    setIsFetchingCoverUrl(true);
    try {
      const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(raw)}`);
      const blob = await proxyRes.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      setFormData((prev: FormData) => ({ ...prev, cover_image: base64 }));
      setCoverUrlInput("");
    } catch (err) { setCoverUrlError("Failed to fetch image"); }
    finally { setIsFetchingCoverUrl(false); }
  };

  async function callKimiAI(prompt: string, onChunk: (chunk: string) => void): Promise<string> {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "kimi-k2-0905:free", messages: [{ role: "user", content: prompt }], userEmail: user?.email, skipCreditDeduction: false, stream: true }),
    });
    if (!response.ok) throw new Error("AI failed");
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let result = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("data: ")) {
          try {
            const json = JSON.parse(line.trim().slice(6));
            const content = json.type === "token" ? json.content : json.choices?.[0]?.delta?.content || "";
            if (content) { result += content; onChunk(content); }
          } catch(e) {}
        }
      }
    }
    return result;
  }

  const handleAIAction = async (type: string): Promise<void> => {
    const COST = type === "enhance" ? 2 : 5;
    if (credits < COST && credits !== 0) { toast.error(`Insufficient credits!`); return; }
    setAiProcessing(true);
    const toastId = toast.loading(`AI is working...`);
    try {
      let prompt = type === "enhance" 
        ? `Enhance this Markdown content to be more professional:\n\n${formData.content}`
        : `Write a technical guide in Markdown about: "${formData.title}". Keywords: ${formData.keywords}`;
      if (type === "generate") setFormData((p: FormData) => ({ ...p, content: "" }));
      let acc = "";
      const result = await callKimiAI(prompt, (chunk) => {
        acc += chunk;
        setFormData((p: FormData) => ({ ...p, content: acc }));
      });
      if (result) toast.success("Done!", { id: toastId });
    } catch (err) { toast.error("AI failed", { id: toastId }); }
    finally { setAiProcessing(false); }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const errors = validateContent(formData, "markdown");
    if (errors.length > 0) { toast.error("Please fix errors"); return; }
    setSaving(true);
    try {
      await guidesApi.create({
        ...formData,
        slug: slugValue,
        keywords: formData.keywords.split(",").map((k: string) => k.trim()).filter(Boolean),
        status: "pending",
        author_name: (user?.user_metadata?.full_name as string) || (user?.email?.split("@")[0] as string) || "Author",
        author_id: user?.id || "",
        user_email: user?.email || "",
      });
      invalidateGuides.invalidateAll();
      setShowSuccessModal(true);
    } catch (err) { toast.error("Failed to publish"); }
    finally { setSaving(false); }
  };

  if (!isAuthenticated() || !user) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-gray-900 flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-[1003]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900">
            <X size={20} />
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
            <Plus size={16} />
            <span className="text-gray-900 truncate max-w-[200px]">New Guide: {formData.title || "Untitled"}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-gray-100 p-1 rounded-xl gap-1">
            {(["editor", "preview", "details"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMainTab(tab)}
                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                  mainTab === tab ? "bg-white shadow-lg text-black" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-2 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : "Publish"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-gray-50/30">
        {mainTab === "editor" && (
          <EditorTab 
            formData={formData} setFormData={setFormData}
            insertText={insertText} handleToolbarAction={handleToolbarAction}
            setShowTableModal={setShowTableModal} setShowLinkModal={setShowLinkModal}
            setShowAdvancedImageModal={setShowAdvancedImageModal} setShowVideoModal={setShowVideoModal}
            setShowCalloutModal={setShowCalloutModal} setShowPlaygroundModal={setShowPlaygroundModal}
            setShowQuizBuilder={setShowQuizBuilder} setShowDownloadLinkModal={setShowDownloadLinkModal}
            handleAIAction={handleAIAction} aiProcessing={aiProcessing}
            textareaRef={textareaRef}
          />
        )}
        {mainTab === "preview" && (
          <PreviewTab 
            formData={formData} 
            previewDevice={previewDevice} setPreviewDevice={setPreviewDevice} 
          />
        )}
        {mainTab === "details" && (
          <DetailsTab 
            formData={formData} setFormData={setFormData}
            slugValue={slugValue} setSlugValue={setSlugValue}
            readTime={readTime} validationErrors={validationErrors}
            autoResize={autoResize} setAutoResize={setAutoResize}
            coverUrlInput={coverUrlInput} setCoverUrlInput={setCoverUrlInput}
            handleCoverUrlPaste={handleCoverUrlPaste} isFetchingCoverUrl={isFetchingCoverUrl}
            coverUrlError={coverUrlError} handleCoverImageUpload={handleCoverImageUpload}
          />
        )}
      </div>

      <ModalsContainer 
        insertText={insertText}
        showLinkModal={showLinkModal} setShowLinkModal={setShowLinkModal}
        showTableModal={showTableModal} setShowTableModal={setShowTableModal}
        showVideoModal={showVideoModal} setShowVideoModal={setShowVideoModal}
        showCalloutModal={showCalloutModal} setShowCalloutModal={setShowCalloutModal}
        showCodeModal={showCodeModal} setShowCodeModal={setShowCodeModal}
        showFigureModal={showFigureModal} setShowFigureModal={setShowFigureModal}
        showDetailsModal={showDetailsModal} setShowDetailsModal={setShowDetailsModal}
        showFootnoteModal={showFootnoteModal} setShowFootnoteModal={setShowFootnoteModal}
        showBadgeModal={showBadgeModal} setShowBadgeModal={setShowBadgeModal}
        showKbdModal={showKbdModal} setShowKbdModal={setShowKbdModal}
        showQuoteModal={showQuoteModal} setShowQuoteModal={setShowQuoteModal}
        showAnchorModal={showAnchorModal} setShowAnchorModal={setShowAnchorModal}
        showCitationModal={showCitationModal} setShowCitationModal={setShowCitationModal}
        showCTAModal={showCTAModal} setShowCTAModal={setShowCTAModal}
        showStepsModal={showStepsModal} setShowStepsModal={setShowStepsModal}
        showTimelineModal={showTimelineModal} setShowTimelineModal={setShowTimelineModal}
        showComparisonModal={showComparisonModal} setShowComparisonModal={setShowComparisonModal}
        showAlertModal={showAlertModal} setShowAlertModal={setShowAlertModal}
        showTabsModal={showTabsModal} setShowTabsModal={setShowTabsModal}
        showDefinitionModal={showDefinitionModal} setShowDefinitionModal={setShowDefinitionModal}
        showCodeDiffModal={showCodeDiffModal} setShowCodeDiffModal={setShowCodeDiffModal}
        showFAQModal={showFAQModal} setShowFAQModal={setShowFAQModal}
        showVersionModal={showVersionModal} setShowVersionModal={setShowVersionModal}
        showKeyValueModal={showKeyValueModal} setShowKeyValueModal={setShowKeyValueModal}
        showPlaygroundModal={showPlaygroundModal} setShowPlaygroundModal={setShowPlaygroundModal}
        showDownloadLinkModal={showDownloadLinkModal} setShowDownloadLinkModal={setShowDownloadLinkModal}
        showQuizBuilder={showQuizBuilder} setShowQuizBuilder={setShowQuizBuilder}
      />

      {showAdvancedImageModal && (
        <AdvancedImageModal 
          onInsert={insertText} 
          onClose={() => setShowAdvancedImageModal(false)} 
        />
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[10005] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Sparkles className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-3">Guide Shared!</h3>
            <p className="text-gray-500 mb-10 leading-relaxed text-sm font-medium">
              Awesome work! 🚀 Your guide is being reviewed and will be live once approved.
            </p>
            <button
              onClick={() => { setShowSuccessModal(false); onClose(); }}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-black/20"
            >
              Back to Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
