"use client";
import {
  Activity,
  AlertTriangle,
  Anchor,
  BadgeCheck,
  Bold,
  BookOpen,
  ChevronDown,
  Clock,
  Code,
  Coins,
  Download,
  Eye,
  FileCode,
  FileImage,
  FileText,
  GitMerge,
  Hash,
  Hash as HashIcon,
  Heading1,
  Heading2,
  HelpCircle,
  Image as ImageIcon,
  Italic,
  Key,
  Keyboard,
  LayoutTemplate,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  MessageCircle,
  Minus,
  MoreHorizontal,
  Quote,
  Sparkles,
  SplitSquareHorizontal,
  Star,
  Strikethrough,
  Table,
  Terminal,
  Video,
  Wand2,
  X,
  Zap
} from "lucide-react";
import { marked } from "marked";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useInvalidateGuides } from "../hooks/useGuides";
import { guidesApi } from "../lib/api";
import { getAvatarForUser } from "../lib/avatar";
import { uploadImageToImgBB } from "../lib/imgbb";
import { resizeImage } from "../lib/resizepro";
import { sanitizeContent } from "../lib/utils";
import {
  AlertModalForm,
  AnchorModalForm,
  BadgeModalForm,
  CTAModalForm,
  CalloutModalForm,
  CitationModalForm,
  CodeDiffModalForm,
  CodeModalForm,
  ComparisonModalForm,
  DefinitionModalForm,
  DetailsModalForm,
  FAQModalForm,
  FigureModalForm,
  FootnoteModalForm,
  KbdModalForm,
  KeyValueModalForm,
  LinkModalForm,
  QuoteModalForm,
  StepsModalForm,
  TableModalForm,
  TabsModalForm,
  TimelineModalForm,
  VersionModalForm,
  VideoModalForm,
} from "./AddGuideModals";
import QuizBuilderModal from "./quiz/QuizBuilderModal";
import QuizComponent from "./quiz/QuizComponent";

// Configure marked renderer for quiz support
const quizRenderer = {
  code(code: any, language?: any): string {
    // Handle newer marked versions passing object
    let text = code;
    let lang = language;

    if (typeof code === "object" && code !== null) {
      text = code.text || "";
      lang = code.lang || "";
    }

    // Ensure text is a string
    text = String(text || "");

    if (lang === "quiz") {
      try {
        const jsonStr = typeof code === "object" ? code.text : code;
        // Secure encoding for data attribute
        const encoded = btoa(
          encodeURIComponent(jsonStr).replace(
            /%([0-9A-F]{2})/g,
            function toSolidBytes(_match: string, p1: string) {
              return String.fromCharCode(parseInt("0x" + p1, 16));
            },
          ),
        );
        return `<div class="interactive-quiz-container my-8" data-quiz="${encoded}"></div>`;
      } catch (e) {
        console.error("Quiz encoding error", e);
        return `<pre class="bg-red-50 text-red-600 p-4 rounded border border-red-200">Error rendering quiz</pre>`;
      }
    }

    // Manual fallback for normal code blocks
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    if (!lang) {
      return `<pre><code>${escapedText}</code></pre>`;
    }

    const langClass = `language-${lang}`;
    return `<pre><code class="${langClass}">${escapedText}</code></pre>`;
  },
};

marked.use({ renderer: quizRenderer as any });
marked.setOptions({
  breaks: true,
  gfm: true,
} as any);

export default function AddGuideModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("markdown");
  const [viewMode, setViewMode] = useState("split"); // 'edit', 'preview', 'split'
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New state for success modal
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false); // overflow menu for less-used tools
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Interactive Modal States
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [_showImageModal, _setShowImageModal] = useState(false);
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

  // New Advanced Tool States
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

  const [formData, setFormData] = useState({
    title: "",
    keywords: "",
    content: "",
    html_content: "",
    css_content: "",
    cover_image: "",
  });

  // New: draft/autosave + editable slug
  const DRAFT_KEY = "add_guide_draft_v1";
  const [slugValue, setSlugValue] = useState("");

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [autoResize, setAutoResize] = useState(true);
  const [credits, setCredits] = useState(0);

  const invalidateGuides = useInvalidateGuides();

  useEffect(() => {
    if (user?.email) {
      // Note: creditsApi may not have getBalance method, skip or use alternative
      setCredits(0);
    }
  }, [user]);

  // Calculate read time
  const readTime = Math.max(
    1,
    Math.ceil((formData.content?.split(/\s+/).length || 0) / 200),
  );

  // Keep slugValue in sync with title
  useEffect(() => {
    const slugBase = (formData.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlugValue(slugBase);
  }, [formData.title]);

  // Autosave draft to localStorage (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        const payload = { formData, slugValue, savedAt: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("Failed to save draft", e);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [formData, slugValue]);



  useEffect(() => {
    document.body.style.overflow = "hidden";
    validateContent();
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [formData, activeTab]);

  // Hydrate Quizzes + Mermaid diagrams in Preview
  useEffect(() => {
    if (activeTab === "markdown" && viewMode !== "edit") {
      // Small delay to let DOM render
      const timer = setTimeout(() => {
        // --- Quizzes ---
        const containers = document.querySelectorAll(
          ".interactive-quiz-container",
        );
        containers.forEach((container: any) => {
          if (container.getAttribute("data-hydrated") === "true") return;

          const encoded = container.getAttribute("data-quiz");
          if (!encoded) return;

          try {
            const json = decodeURIComponent(
              atob(encoded)
                .split("")
                .map(function (c) {
                  return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join(""),
            );

            const data = JSON.parse(json);
            const root = createRoot(container);
            root.render(<QuizComponent data={data} />);
            container.setAttribute("data-hydrated", "true");
          } catch (e) {
            console.error("Preview hydration error", e);
          }
        });

        // --- Mermaid diagrams ---
        const mermaidBlocks = document.querySelectorAll(
          "pre code.language-mermaid",
        );
        if (mermaidBlocks.length) {
          import("mermaid")
            .then((mod) => {
              const mermaid = mod.default || mod;
              try {
                mermaid.initialize({ startOnLoad: false });
              } catch (e) {
                /* ignore init errors */
              }

              mermaidBlocks.forEach((codeEl: any) => {
                const pre = codeEl.closest("pre");
                if (
                  !pre ||
                  pre.getAttribute("data-mermaid-hydrated") === "true"
                )
                  return;
                const diagramCode = codeEl.textContent || "";

                try {
                  // prefer mermaid.mermaidAPI.render when available
                  if (mermaid.mermaidAPI && mermaid.mermaidAPI.render) {
                    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
                    (mermaid.mermaidAPI.render as any)(
                      id,
                      diagramCode,
                      (svgCode: string) => {
                        const wrapper = document.createElement("div");
                        wrapper.className = "mermaid-render";
                        wrapper.innerHTML = svgCode;
                        if (pre.parentNode) pre.parentNode.replaceChild(wrapper, pre);
                      }
                    );
                  } else if (mermaid.render) {
                    // newer API may return promise
                    Promise.resolve(
                      mermaid.render(
                        `mermaid-${Math.random().toString(36).slice(2, 9)}`,
                        diagramCode,
                      ),
                    )
                      .then((res: any) => {
                        const svg = res && (res.svg || res);
                        const wrapper = document.createElement("div");
                        wrapper.className = "mermaid-render";
                        wrapper.innerHTML = svg || "";
                        pre.replaceWith(wrapper);
                      })
                      .catch((err: any) =>
                        console.error("Mermaid render failed", err),
                      );
                  }

                  pre.setAttribute("data-mermaid-hydrated", "true");
                } catch (e) {
                  console.error("Mermaid hydration error", e);
                }
              });
            })
            .catch((err: any) => {
              console.error("Failed to load mermaid for preview", err);
            });
        }

        // --- Highlight.js Syntax Highlighting ---
        if (typeof window !== "undefined" && (window as any).hljs) {
          try {
            document.querySelectorAll("pre code").forEach((block) => {
              if (!block.parentElement?.classList.contains("mermaid-render") &&
                !block.classList.contains("language-mermaid") &&
                !block.getAttribute("data-highlighted")) {
                (window as any).hljs.highlightElement(block);
              }
            });
          } catch (e) {
            console.error("Highlight.js error", e);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [formData.content, activeTab, viewMode]);

  // Shared forbidden patterns
  const forbiddenPatterns = [
    // Branding
    {
      pattern: /(<footer[^>]*>)/gi,
      message: "Custom <footer> tags are not allowed",
    },
    {
      pattern: /(<\/footer>)/gi,
      message: "Custom </footer> tags are not allowed",
    },
    { pattern: /(&copy;|©)/gi, message: "Copyright symbols are not allowed" },
    {
      pattern: /(all rights reserved)/gi,
      message: "'All rights reserved' phrase is not allowed",
    },
    {
      pattern: /(class="[^"]*footer[^"]*")/gi,
      message: "Classes containing 'footer' are not allowed",
    },
    {
      pattern: /(id="[^"]*footer[^"]*")/gi,
      message: "IDs containing 'footer' are not allowed",
    },

    // Security
    {
      pattern: /(<script[^>]*>[\s\S]*?<\/script>)/gi,
      message: "Script tags are forbidden for security",
    },
    // NOTE: iframe handling is validated dynamically (see validateContent) —
    // we allow only trusted video providers (YouTube/Vimeo). This lets
    // authors embed videos while preventing arbitrary iframes.
    {
      pattern: /(<object[^>]*>[\s\S]*?<\/object>)/gi,
      message: "Object tags are forbidden",
    },
    { pattern: /(<embed[^>]*>)/gi, message: "Embed tags are forbidden" },
    {
      pattern: /(javascript:)/gi,
      message: "JavaScript pseudo-protocol is forbidden",
    },
    {
      pattern: /(on[a-z]+="[^"]*")/gi,
      message: "Event handlers (onclick, etc.) are forbidden",
    },

    // Profanity
    {
      pattern:
        /\b(sex|penis|vagina|sexual|dick|porn|xxx|asshole|bitch|fuck|cock)\b/gi,
      message: "Inappropriate content is not allowed",
    },
  ];

  const highlightForbiddenContent = (html: string): string => {
    if (!html) return "";
    let highlighted = html;

    // Apply highlighting to all forbidden patterns
    forbiddenPatterns.forEach(({ pattern, message }) => {
      highlighted = highlighted.replace(pattern, (match: string) => {
        // Escape HTML entities to prevent execution while displaying
        const escapedMatch = match.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<span style="background-color: rgba(255, 0, 0, 0.2); outline: 2px solid red; cursor: help; color: red; font-weight: bold;" title="${message.replace(/"/g, '&quot;')}" class="forbidden-highlight">${escapedMatch}</span>`;
      });
    });

    return highlighted as string;
  };

  const validateContent = (): boolean => {
    const errors: string[] = [];
    const { title, keywords, content, html_content } = formData;

    // 1. Required Fields
    if (!title?.trim()) errors.push("Title is required");
    if (!keywords?.trim()) errors.push("Keywords are required");

    // 2. Minimum Content Length (30 words)
    const activeContent = activeTab === "markdown" ? content : html_content;
    const wordCount =
      activeContent?.trim().split(/\s+/).filter(Boolean).length || 0;

    if (wordCount < 30) {
      errors.push(`Content is too short (${wordCount}/30 words)`);
    }

    // 3. Forbidden Content Detection (pattern-based)
    if (activeContent) {
      forbiddenPatterns.forEach(({ pattern, message }) => {
        // .search() is safe with /g regexes (ignores global flag, returns index)
        if (activeContent.search(pattern) !== -1) {
          if (!errors.includes(message)) errors.push(message);
        }
      });

      // 3.a Allow only whitelisted <iframe> embeds (YouTube / Vimeo).
      // Any iframe with a non-whitelisted src will be rejected.
      if (activeContent.includes("<iframe")) {
        const iframeRegex = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi;
        let m: RegExpExecArray | null;
        while ((m = iframeRegex.exec(activeContent)) !== null) {
          const tag = m[0];
          const srcMatch = tag.match(/src\s*=\s*["']([^"']+)["']/i);
          const src = srcMatch ? srcMatch[1] : "";
          const allowed =
            /(?:youtube\.com|youtu\.be|youtube-nocookie\.com|player\.vimeo\.com)/i.test(
              src,
            );
          if (!src || !allowed) {
            if (!errors.includes("Only YouTube/Vimeo iframes are allowed")) {
              errors.push("Only YouTube/Vimeo iframes are allowed");
            }
            break;
          }
        }
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  if (!isAuthenticated() || !user) return null; // Should be handled by parent or auth check

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const toastId = toast.loading("Uploading image...");
      const url = await uploadImageToImgBB(file);
      insertText(`![${file.name}](${url})`);
      toast.success("Image uploaded successfully", { id: toastId });
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to upload image");
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    let finalFile: File | Blob = file;

    // Apply resizing if enabled
    if (autoResize) {
      try {
        const toastId = toast.loading("Resizing image to 1200x675...");
        const resizedBlob = await resizeImage(file, {
          width: 1200,
          height: 675,
          fitMode: "fill",
          format: "image/jpeg",
          quality: 92
        });
        finalFile = new File([resizedBlob], file.name, { type: "image/jpeg" });
        toast.success("Image resized successfully!", { id: toastId });
      } catch (error) {
        console.error("Resize failed:", error);
        toast.error("Auto-resize failed, using original image.");
      }
    }

    const objectUrl = URL.createObjectURL(finalFile instanceof File ? finalFile : new Blob([finalFile]));
    const image = new Image();

    try {
      const dimPromise = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Failed to load image"));
      });
      image.src = objectUrl;
      await dimPromise;

      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(objectUrl);

      const recommendedWidth = 1200;
      const recommendedHeight = 675;
      const aspectRatio = width / height;
      const recommendedRatio = 16 / 9;
      const ratioDiff = Math.abs(aspectRatio - recommendedRatio);
      const needsWarning = !autoResize && (width < recommendedWidth || height < recommendedHeight || ratioDiff > 0.12);

      if (needsWarning) {
        setCoverImageError(
          `Recommended cover size is at least ${recommendedWidth}x${recommendedHeight}px with a ~16:9 ratio. Uploaded image is ${width}x${height}.`,
        );
      } else {
        setCoverImageError(null);
      }
    } catch (error: unknown) {
      console.error(error);
      setCoverImageError("Unable to verify image dimensions.");
      URL.revokeObjectURL(objectUrl);
    }

    try {
      const toastId = toast.loading("Uploading cover image...");
      const url = await uploadImageToImgBB(finalFile as File);
      setFormData((prev) => ({ ...prev, cover_image: url }));
      toast.success("Cover image uploaded!", { id: toastId });
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to upload cover image");
    }
  };

  const insertText = (textToInsert: string): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const newText =
      text.substring(0, start) + textToInsert + text.substring(end);

    setFormData({ ...formData, content: newText });

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + textToInsert.length,
        start + textToInsert.length,
      );
    }, 0);
  };

  const handleToolbarAction = (action: string): void => {
    // helper: wrap selection or insert fallback
    const wrapSelection = (before: string, after: string, fallback = "") => {
      const textarea = textareaRef.current;
      if (!textarea) {
        insertText(before + (fallback || "") + after);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const sel = formData.content.substring(start, end) || fallback;
      const newText =
        formData.content.substring(0, start) +
        before +
        sel +
        after +
        formData.content.substring(end);
      setFormData((prev) => ({ ...prev, content: newText }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + sel.length,
        );
      }, 0);
    };

    switch (action) {
      case "bold":
        insertText("**Bold Text**");
        break;
      case "italic":
        insertText("*Italic Text*");
        break;
      case "h1":
        insertText("\n# Heading 1\n");
        break;
      case "h2":
        insertText("\n## Heading 2\n");
        break;
      case "h3":
        insertText("\n### Heading 3\n");
        break;
      case "strikethrough":
        insertText("~~Strikethrough~~");
        break;
      case "inline-code":
        insertText("`inline code`");
        break;
      case "hr":
        insertText("\n---\n");
        break;
      case "task-list":
        insertText("\n- [ ] Task item\n");
        break;

      case "link":
        setShowLinkModal(true);
        break;

      case "code":
        setShowCodeModal(true);
        break;

      case "quote":
        setShowQuoteModal(true);
        break;

      case "list":
        insertText("\n- List item\n");
        break;

      case "ordered-list":
        insertText("\n1. List item\n");
        break;

      case "highlight":
        wrapSelection("<mark>", "</mark>", "Highlighted text");
        break;

      case "table":
        setShowTableModal(true);
        break;

      case "youtube":
        setShowVideoModal(true);
        break;

      case "callout":
        setShowCalloutModal(true);
        break;

      case "details":
        setShowDetailsModal(true);
        break;

      case "footnote":
        setShowFootnoteModal(true);
        break;

      case "figure":
        setShowFigureModal(true);
        break;

      case "badge":
        setShowBadgeModal(true);
        break;

      case "kbd":
        setShowKbdModal(true);
        break;

      case "pull-quote":
        setShowQuoteModal(true);
        break;

      case "anchor":
        setShowAnchorModal(true);
        break;

      case "mermaid":
        insertText("\n```mermaid\nflowchart LR\n  A[Start] --> B[End]\n```\n");
        break;

      case "emoji":
        insertText("✅");
        break;

      case "cta":
        setShowCTAModal(true);
        break;

      case "citation":
        setShowCitationModal(true);
        break;

      case "run":
        insertText("\n```bash\n# Run this command in your terminal\nnpm run start\n```\n");
        break;

      // Advanced Guide Creator Tools
      case "steps":
        setShowStepsModal(true);
        break;

      case "timeline":
        setShowTimelineModal(true);
        break;

      case "comparison":
        setShowComparisonModal(true);
        break;

      case "alert":
        setShowAlertModal(true);
        break;

      case "tabs":
        setShowTabsModal(true);
        break;

      case "definition":
        setShowDefinitionModal(true);
        break;

      case "code-diff":
        setShowCodeDiffModal(true);
        break;

      case "faq":
        setShowFAQModal(true);
        break;

      case "version":
        setShowVersionModal(true);
        break;

      case "key-value":
        setShowKeyValueModal(true);
        break;
    }
  };

  async function callKimiAI(prompt: string, onChunk: (chunk: string) => void): Promise<string> {
    try {
      console.log("📡 Calling /api/ai with prompt length:", prompt?.length);
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "kimi-k2-0905:free",
          messages: [{ role: "user", content: prompt }],
          userEmail: user?.email,
          skipCreditDeduction: false,
          stream: true,
        }),
      });

      console.log("📥 Response status:", response.status);
      if (!response.ok) {
        let errorMessage = "AI request failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.hint) errorMessage += ` - ${errorData.hint}`;
          if (errorData.details) errorMessage += ` (${errorData.details})`;
        } catch (e) {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        console.error("❌ API Error:", errorMessage);
        throw new Error(errorMessage);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let buffer = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(
            "✅ Stream ended. Total chunks:",
            chunkCount,
            "Total length:",
            result.length,
          );
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        chunkCount++;

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

          if (trimmedLine.startsWith("data: ")) {
            const jsonStr = trimmedLine.slice(6);
            try {
              const json = JSON.parse(jsonStr);

              // Log first few JSON objects to see structure
              if (chunkCount <= 5) {
                console.log(`🔍 JSON structure (chunk ${chunkCount}):`, json);
              }

              // Handle different API response formats:
              // 1. Custom format: {type: 'token', content: '...'}
              // 2. OpenAI format: {choices: [{delta: {content: '...'}}]}
              let content = "";

              if (json.type === "token" && json.content) {
                content = json.content;
              } else if (json.choices?.[0]?.delta?.content) {
                content = json.choices[0].delta.content;
              } else if (json.choices?.[0]?.message?.content) {
                content = json.choices[0].message.content;
              }

              if (content) {
                result += content;
                if (onChunk) onChunk(content);
              }
            } catch (e) {
              console.warn(
                "⚠️ Error parsing chunk:",
                jsonStr.substring(0, 100),
                e,
              );
            }
          }
        }
      }

      // Process any remaining buffer
      if (
        buffer.trim().startsWith("data: ") &&
        buffer.trim() !== "data: [DONE]"
      ) {
        try {
          const jsonStr = buffer.trim().slice(6);
          const json = JSON.parse(jsonStr);

          let content = "";
          if (json.type === "token" && json.content) {
            content = json.content;
          } else if (json.choices?.[0]?.delta?.content) {
            content = json.choices[0].delta.content;
          } else if (json.choices?.[0]?.message?.content) {
            content = json.choices[0].message.content;
          }

          if (content) result += content;
        } catch (e) {
          console.warn("⚠️ Error parsing final buffer:", e);
        }
      }

      console.log("📊 Final result length:", result.length);
      return result;
    } catch (error: any) {
      console.error("AI Error:", error);
      throw error;
    }
  }

  const handleAIAction = async (type: string): Promise<void> => {
    const COST = type === "enhance" ? 2 : 5;

    if (credits < COST) {
      toast.error(`Insufficient credits! You need ${COST} credits.`);
      return;
    }

    setAiProcessing(true);
    setShowAIMenu(false);
    const toastId = toast.loading(`AI is working... (Cost: ${COST} credits)`);

    try {
      let prompt = "";
      if (type === "enhance") {
        if (!formData.content) throw new Error("Write some content first!");
        prompt = `Enhance this Markdown content to be more professional, clear, and engaging. Keep the same Markdown format:\n\n${formData.content}`;
      } else if (type === "generate") {
        if (!formData.title) throw new Error("Enter a title first!");
        prompt = `Write a comprehensive technical guide in Markdown about: "${formData.title}". Keywords: ${formData.keywords}. Include code examples if relevant.`;
      }

      if (type === "generate") {
        setFormData((prev) => ({ ...prev, content: "" }));
      }

      let accumulatedContent = "";

      console.log("🤖 Starting AI generation...");
      const result = await callKimiAI(prompt, (chunk) => {
        accumulatedContent += chunk;
        setFormData((prev) => ({
          ...prev,
          content: accumulatedContent,
        }));
      });

      console.log("✅ AI generation complete. Total length:", result?.length);

      if (result && result.trim()) {
        setFormData((prev) => ({ ...prev, content: result }));
        toast.success(`Content generated! (-${COST} credits)`, { id: toastId });
        setCredits((prev) => Math.max(0, prev - COST));
      } else {
        console.error("❌ Empty result from AI");
        throw new Error("AI returned empty response");
      }
    } catch (error: any) {
      console.error("❌ AI Error:", error);
      toast.error(error.message || "AI failed", { id: toastId });
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateContent()) {
      toast.error("Please fix validation errors before publishing");
      return;
    }

    setSaving(true);
    try {
      const keywords = formData.keywords
        .split(",")
        .map((k: any) => k.trim())
        .filter(Boolean);

      const guide: any = await guidesApi.create({
        title: formData.title || "",
        slug: slugValue || undefined,
        keywords,
        cover_image: formData.cover_image || null,
        markdown: formData.content || "",
        html_content: formData.html_content || "",
        css_content: formData.css_content || "",
        content_type: activeTab === "advanced" ? "html" : "markdown",
        user_email: user?.email || "",
        author_name:
          (user?.user_metadata?.full_name as string) ||
          (user?.email?.split("@")[0] as string) ||
          "",
        author_id: user?.id || "",
        status: "pending", // Explicitly set to pending
      });

      if (guide) {
        // Refresh guides listing so new guide (or fallback localStorage) appears immediately
        try {
          invalidateGuides.invalidateAll();
        } catch (e) {
          /* ignore */
        }

        // Show success message instead of redirecting
        toast.success("Guide submitted for review!");
        setShowSuccessModal(true);
      }
    } catch (error: unknown) {
      console.error("Publish Error:", error);
      toast.error("Failed to publish guide");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-gray-900 flex flex-col animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span>Draft</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{readTime} min read</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("edit")}
              title="Editor Only"
              className={`p-1.5 rounded-md transition-all ${viewMode === "edit" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}
            >
              <LayoutTemplate size={18} />
            </button>
            <button
              onClick={() => setViewMode("split")}
              title="Split View"
              className={`p-1.5 rounded-md transition-all ${viewMode === "split" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}
            >
              <SplitSquareHorizontal size={18} />
            </button>
            <button
              onClick={() => setViewMode("preview")}
              title="Preview Only"
              className={`p-1.5 rounded-md transition-all ${viewMode === "preview" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}
            >
              <Eye size={18} />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAIMenu(!showAIMenu)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles size={16} />
              <span>AI Assistant</span>
            </button>
            {showAIMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50 animate-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <Coins size={14} className="text-yellow-500" />
                    <span>{credits} Credits</span>
                  </div>
                  {credits < 5 && (
                    <button
                      onClick={() => router.push("/pricing")}
                      className="text-xs bg-black text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                    >
                      Upgrade
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleAIAction("enhance")}
                  disabled={credits < 2 || aiProcessing}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3 text-sm text-gray-700 group-hover:text-black">
                    <Wand2 size={16} className="text-purple-600" />
                    <span>Enhance Content</span>
                  </div>
                  <span className="text-xs font-medium text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                    2 🪙
                  </span>
                </button>

                <button
                  onClick={() => handleAIAction("generate")}
                  disabled={credits < 5 || aiProcessing}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3 text-sm text-gray-700 group-hover:text-black">
                    <Sparkles size={16} className="text-indigo-600" />
                    <span>Generate from Title</span>
                  </div>
                  <span className="text-xs font-medium text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                    5 🪙
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                handleSubmit(e as any as React.FormEvent<HTMLFormElement>);
              }}
              disabled={saving || validationErrors.length > 0}
              className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Publish"
              )}
            </button>

            {/* Validation Errors Tooltip */}
            {validationErrors.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-red-50 text-red-600 text-xs rounded-lg shadow-xl border border-red-100 p-3 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                <p className="font-bold mb-1">Cannot publish yet:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Submitted for Review!
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Thanks for sharing your knowledge! 🚀 <br />
              Your guide has been submitted to our team. We'll review it shortly
              to ensure it meets our quality standards. This usually takes less
              than 24 hours.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                onClose();
              }}
              className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* Quiz Builder Modal */}
      {showQuizBuilder && (
        <QuizBuilderModal
          onClose={() => setShowQuizBuilder(false)}
          onInsert={(quizData: Record<string, any>) => {
            const quizBlock = `\n\`\`\`quiz\n${JSON.stringify(quizData, null, 2)}\n\`\`\`\n`;
            setFormData({
              ...formData,
              content: formData.content + quizBlock,
            });
            toast.success("Quiz inserted successfully!");
          }}
        />
      )}

      {/* Interactive Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLinkModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Link</h3>
              <button onClick={() => setShowLinkModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <LinkModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowLinkModal(false);
                toast.success("Link inserted!");
              }}
              onClose={() => setShowLinkModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTableModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Table</h3>
              <button onClick={() => setShowTableModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <TableModalForm
              onInsert={(rows: number, cols: number) => {
                const tableRows = Array.from({ length: rows }).map(() =>
                  `<tr>${Array.from({ length: cols }).map(() => '<td></td>').join('')}</tr>`
                ).join('');
                const tableHtml = `<table><tbody>${tableRows}</tbody></table>`;
                insertText(tableHtml);
                setShowTableModal(false);
                toast.success("Table inserted!");
              }}
              onClose={() => setShowTableModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Embed Video</h3>
              <button onClick={() => setShowVideoModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <VideoModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowVideoModal(false);
                toast.success("Video inserted!");
              }}
              onClose={() => setShowVideoModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Callout Modal */}
      {showCalloutModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCalloutModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Callout</h3>
              <button onClick={() => setShowCalloutModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <CalloutModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowCalloutModal(false);
                toast.success("Callout inserted!");
              }}
              onClose={() => setShowCalloutModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCodeModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Code Block</h3>
              <button onClick={() => setShowCodeModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <CodeModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowCodeModal(false);
                toast.success("Code block inserted!");
              }}
              onClose={() => setShowCodeModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Figure Modal */}
      {showFigureModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowFigureModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Figure</h3>
              <button onClick={() => setShowFigureModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <FigureModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowFigureModal(false);
                toast.success("Figure inserted!");
              }}
              onClose={() => setShowFigureModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Collapsible Section</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <DetailsModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowDetailsModal(false);
                toast.success("Collapsible section inserted!");
              }}
              onClose={() => setShowDetailsModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQuoteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Quote</h3>
              <button onClick={() => setShowQuoteModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <QuoteModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowQuoteModal(false);
                toast.success("Quote inserted!");
              }}
              onClose={() => setShowQuoteModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Badge Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBadgeModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Badge</h3>
              <button onClick={() => setShowBadgeModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <BadgeModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowBadgeModal(false);
                toast.success("Badge inserted!");
              }}
              onClose={() => setShowBadgeModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Kbd Modal */}
      {showKbdModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowKbdModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Keyboard Shortcut</h3>
              <button onClick={() => setShowKbdModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <KbdModalForm
              onInsert={(keys: string[]) => {
                insertText(keys.map((k: string) => `<kbd>${k}</kbd>`).join(" + "));
                setShowKbdModal(false);
                toast.success("Keyboard shortcut inserted!");
              }}
              onClose={() => setShowKbdModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive CTA Modal */}
      {showCTAModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCTAModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert CTA Button</h3>
              <button onClick={() => setShowCTAModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <CTAModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowCTAModal(false);
                toast.success("CTA button inserted!");
              }}
              onClose={() => setShowCTAModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Citation Modal */}
      {showCitationModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCitationModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Citation</h3>
              <button onClick={() => setShowCitationModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <CitationModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowCitationModal(false);
                toast.success("Citation inserted!");
              }}
              onClose={() => setShowCitationModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Anchor Modal */}
      {showAnchorModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAnchorModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Anchor</h3>
              <button onClick={() => setShowAnchorModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <AnchorModalForm
              defaultSlug={slugValue}
              onInsert={(id: string) => {
                insertText(`<a id="${id}"></a>`);
                setShowAnchorModal(false);
                toast.success("Anchor inserted!");
              }}
              onClose={() => setShowAnchorModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Footnote Modal */}
      {showFootnoteModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowFootnoteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Insert Footnote</h3>
              <button onClick={() => setShowFootnoteModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <FootnoteModalForm
              onInsert={(content: string) => {
                insertText(content);
                setShowFootnoteModal(false);
                toast.success("Footnote inserted!");
              }}
              onClose={() => setShowFootnoteModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Steps Modal */}
      {showStepsModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowStepsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Step-by-Step Guide</h3>
              <button onClick={() => setShowStepsModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <StepsModalForm
              onInsert={(content: string) => { insertText(content); setShowStepsModal(false); toast.success("Steps inserted!"); }}
              onClose={() => setShowStepsModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Timeline Modal */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTimelineModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Timeline</h3>
              <button onClick={() => setShowTimelineModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <TimelineModalForm
              onInsert={(content: string) => { insertText(content); setShowTimelineModal(false); toast.success("Timeline inserted!"); }}
              onClose={() => setShowTimelineModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowComparisonModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Comparison Table</h3>
              <button onClick={() => setShowComparisonModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <ComparisonModalForm
              onInsert={(content: string) => { insertText(content); setShowComparisonModal(false); toast.success("Comparison inserted!"); }}
              onClose={() => setShowComparisonModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAlertModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Alert Box</h3>
              <button onClick={() => setShowAlertModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <AlertModalForm
              onInsert={(content: string) => { insertText(content); setShowAlertModal(false); toast.success("Alert inserted!"); }}
              onClose={() => setShowAlertModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Tabs Modal */}
      {showTabsModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTabsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Tabs</h3>
              <button onClick={() => setShowTabsModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <TabsModalForm
              onInsert={(content: string) => { insertText(content); setShowTabsModal(false); toast.success("Tabs inserted!"); }}
              onClose={() => setShowTabsModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Definition Modal */}
      {showDefinitionModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDefinitionModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Definitions</h3>
              <button onClick={() => setShowDefinitionModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <DefinitionModalForm
              onInsert={(content: string) => { insertText(content); setShowDefinitionModal(false); toast.success("Definitions inserted!"); }}
              onClose={() => setShowDefinitionModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Code Diff Modal */}
      {showCodeDiffModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCodeDiffModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Code Diff</h3>
              <button onClick={() => setShowCodeDiffModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <CodeDiffModalForm
              onInsert={(content: string) => { insertText(content); setShowCodeDiffModal(false); toast.success("Code diff inserted!"); }}
              onClose={() => setShowCodeDiffModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive FAQ Modal */}
      {showFAQModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowFAQModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">FAQ</h3>
              <button onClick={() => setShowFAQModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <FAQModalForm
              onInsert={(content: string) => { insertText(content); setShowFAQModal(false); toast.success("FAQ inserted!"); }}
              onClose={() => setShowFAQModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowVersionModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Changelog</h3>
              <button onClick={() => setShowVersionModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <VersionModalForm
              onInsert={(content: string) => { insertText(content); setShowVersionModal(false); toast.success("Changelog inserted!"); }}
              onClose={() => setShowVersionModal(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Key-Value Modal */}
      {showKeyValueModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowKeyValueModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Key-Value</h3>
              <button onClick={() => setShowKeyValueModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X size={18} /></button>
            </div>
            <KeyValueModalForm
              onInsert={(content: string) => { insertText(content); setShowKeyValueModal(false); toast.success("Key-Value inserted!"); }}
              onClose={() => setShowKeyValueModal(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0 flex-col overflow-hidden lg:flex-row">
        {/* Editor Side */}
        <div
          className={`flex-1 min-h-0 flex flex-col bg-white transition-all duration-300 ${viewMode === "preview" ? "hidden" : "block"}`}
        >
          {" "}
          {/* Metadata Inputs */}
          <div className="px-8 pt-8 pb-4 space-y-4">
            <input
              type="text"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Guide Title"
              className="w-full text-4xl font-black tracking-tight placeholder:text-gray-300 border-none focus:ring-0 p-0"
            />
            <input
              type="text"
              value={formData.keywords}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setFormData({ ...formData, keywords: e.target.value })
              }
              placeholder="Add keywords (e.g., react, tutorial, web-dev)..."
              className="w-full text-gray-500 placeholder:text-gray-300 border-none focus:ring-0 p-0 text-lg"
            />
            <div className="grid gap-3 md:grid-cols-[1fr_auto] items-start">
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Cover Image</p>
                    <p className="text-xs text-gray-500">
                      Recommended size: 1200×675 pixels, 16:9 ratio.
                    </p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div
                          onClick={(e) => { e.preventDefault(); setAutoResize(!autoResize); }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${autoResize ? "bg-black" : "bg-gray-200"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${autoResize ? "translate-x-[18px]" : "translate-x-0.5"}`}
                          />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors">
                          Auto Resize (16:9)
                        </span>
                      </label>
                      {formData.cover_image && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, cover_image: "" }));
                            setCoverImageError(null);
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-medium cursor-pointer hover:bg-gray-900 transition-colors">
                    <ImageIcon size={16} />
                    Select cover image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverImageUpload}
                    />
                  </label>
                  {coverImageError && (
                    <p className="text-xs text-red-600">{coverImageError}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    The cover will appear above the preview and in guide listings.
                  </p>
                  {formData.cover_image && (
                    <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                      <img
                        src={formData.cover_image}
                        alt="Cover preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Type Toggle */}
          <div className="px-8 pb-4 flex gap-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("markdown")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "markdown" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              Markdown
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "advanced" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              Custom HTML
            </button>
          </div>
          {/* Markdown Toolbar */}
          {activeTab === "markdown" && (
            <div
              className="px-3 py-2 border-b border-gray-100 bg-white/50 rounded-md shadow-sm flex flex-wrap gap-2 items-center justify-start"
              role="toolbar"
              aria-label="Formatting toolbar"
            >
              <ToolbarButton
                icon={<Bold size={18} />}
                onClick={() => handleToolbarAction("bold")}
                tooltip="Bold"
              />
              <ToolbarButton
                icon={<Italic size={18} />}
                onClick={() => handleToolbarAction("italic")}
                tooltip="Italic"
              />
              <ToolbarButton
                icon={<Strikethrough size={18} />}
                onClick={() => handleToolbarAction("strikethrough")}
                tooltip="Strikethrough"
              />
              <ToolbarButton
                icon={<FileCode size={16} />}
                onClick={() => handleToolbarAction("inline-code")}
                tooltip="Inline code"
              />

              <div
                className="hidden sm:block w-px h-5 bg-gray-100 mx-2"
                aria-hidden="true"
              />
              <ToolbarButton
                icon={<Heading1 size={18} />}
                onClick={() => handleToolbarAction("h1")}
                tooltip="Heading 1"
              />
              <ToolbarButton
                icon={<Heading2 size={18} />}
                onClick={() => handleToolbarAction("h2")}
                tooltip="Heading 2"
              />
              <ToolbarButton
                icon={<Hash size={16} />}
                onClick={() => handleToolbarAction("h3")}
                tooltip="Heading 3"
              />
              <div
                className="hidden sm:block w-px h-5 bg-gray-100 mx-2"
                aria-hidden="true"
              />
              <ToolbarButton
                icon={<LinkIcon size={18} />}
                onClick={() => handleToolbarAction("link")}
                tooltip="Link"
              />
              <ToolbarButton
                icon={<Code size={18} />}
                onClick={() => handleToolbarAction("code")}
                tooltip="Code Block"
              />
              <ToolbarButton
                icon={<Quote size={18} />}
                onClick={() => handleToolbarAction("quote")}
                tooltip="Quote"
              />
              <div
                className="hidden sm:block w-px h-5 bg-gray-100 mx-2"
                aria-hidden="true"
              />
              <ToolbarButton
                icon={<List size={18} />}
                onClick={() => handleToolbarAction("list")}
                tooltip="Bullet List"
              />
              <ToolbarButton
                icon={<ListOrdered size={18} />}
                onClick={() => handleToolbarAction("ordered-list")}
                tooltip="Numbered List"
              />
              <ToolbarButton
                icon={<ListChecks size={18} />}
                onClick={() => handleToolbarAction("task-list")}
                tooltip="Task list"
              />
              <div
                className="hidden sm:block w-px h-5 bg-gray-100 mx-2"
                aria-hidden="true"
              />
              <ToolbarButton
                icon={<Table size={18} />}
                onClick={() => handleToolbarAction("table")}
                tooltip="Insert table"
              />
              <ToolbarButton
                icon={<Minus size={18} />}
                onClick={() => handleToolbarAction("hr")}
                tooltip="Horizontal rule"
              />
              <div
                className="hidden sm:block w-px h-5 bg-gray-100 mx-2"
                aria-hidden="true"
              />
              <label
                className="p-2 text-gray-500 hover:bg-gray-100 hover:text-black rounded cursor-pointer transition-colors"
                title="Upload Image"
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <ImageIcon size={18} />
              </label>

              {/* New formatting tools requested by user */}
              <ToolbarButton
                icon={<Video size={18} />}
                onClick={() => handleToolbarAction("youtube")}
                tooltip="Embed video (YouTube/Vimeo)"
              />

              <ToolbarButton
                icon={<Wand2 size={18} />}
                onClick={() => handleToolbarAction("callout")}
                tooltip="Insert callout (info/warn/success)"
              />

              <ToolbarButton
                icon={<ChevronDown size={18} />}
                onClick={() => handleToolbarAction("details")}
                tooltip="Insert collapsible section"
              />

              <ToolbarButton
                icon={<Star size={18} />}
                onClick={() => handleToolbarAction("highlight")}
                tooltip="Inline highlight"
              />

              <ToolbarButton
                icon={<FileText size={18} />}
                onClick={() => handleToolbarAction("footnote")}
                tooltip="Insert footnote"
              />

              <ToolbarButton
                icon={<BookOpen size={18} />}
                onClick={() => handleToolbarAction("toc")}
                tooltip="Insert Table of Contents (auto)"
              />

              {/* primary helper buttons (kept visible) */}
              <ToolbarButton
                icon={<FileImage size={18} />}
                onClick={() => handleToolbarAction("figure")}
                tooltip="Insert figure"
              />

              <ToolbarButton
                icon={<FileCode size={16} />}
                onClick={() => handleToolbarAction("code")}
                tooltip="Code block"
              />

              <ToolbarButton
                icon={<Table size={18} />}
                onClick={() => handleToolbarAction("table")}
                tooltip="Insert table"
              />

              <ToolbarButton
                icon={<Star size={18} />}
                onClick={() => handleToolbarAction("highlight")}
                tooltip="Inline highlight"
              />

              {/* More (overflow) */}
              <div className="relative">
                <ToolbarButton
                  icon={<MoreHorizontal size={18} />}
                  onClick={() => setShowMoreTools((s) => !s)}
                  tooltip="More tools"
                />

                {showMoreTools && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("badge");
                          setShowMoreTools(false);
                        }}
                        title="Badge"
                      >
                        <BadgeCheck size={18} />
                        <span>Badge</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("kbd");
                          setShowMoreTools(false);
                        }}
                        title="Kbd"
                      >
                        <Keyboard size={16} />
                        <span>Kbd</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("pull-quote");
                          setShowMoreTools(false);
                        }}
                        title="Pull quote"
                      >
                        <MessageCircle size={18} />
                        <span>Pull</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("columns");
                          setShowMoreTools(false);
                        }}
                        title="Columns"
                      >
                        <LayoutTemplate size={18} />
                        <span>Columns</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("anchor");
                          setShowMoreTools(false);
                        }}
                        title="Anchor"
                      >
                        <Anchor size={16} />
                        <span>Anchor</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("mermaid");
                          setShowMoreTools(false);
                        }}
                        title="Mermaid"
                      >
                        <FileCode size={16} />
                        <span>Mermaid</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("emoji");
                          setShowMoreTools(false);
                        }}
                        title="Emoji"
                      >
                        <Zap size={16} />
                        <span>Emoji</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("cta");
                          setShowMoreTools(false);
                        }}
                        title="CTA"
                      >
                        <Activity size={16} />
                        <span>CTA</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("citation");
                          setShowMoreTools(false);
                        }}
                        title="Citation"
                      >
                        <BookOpen size={16} />
                        <span>Cite</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => {
                          handleToolbarAction("run");
                          setShowMoreTools(false);
                        }}
                        title="Run code"
                      >
                        <Terminal size={16} />
                        <span>Run</span>
                      </button>

                      {/* ===== ADVANCED GUIDE CREATOR TOOLS ===== */}
                      <div className="col-span-3 border-t border-gray-200 pt-2 mt-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Advanced Tools</span>
                      </div>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("steps"); setShowMoreTools(false); }}
                        title="Steps"
                      >
                        <ListOrdered size={16} />
                        <span>Steps</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("timeline"); setShowMoreTools(false); }}
                        title="Timeline"
                      >
                        <Clock size={16} />
                        <span>Time</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("comparison"); setShowMoreTools(false); }}
                        title="Comparison"
                      >
                        <GitMerge size={16} />
                        <span>Compare</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("alert"); setShowMoreTools(false); }}
                        title="Alert"
                      >
                        <AlertTriangle size={16} />
                        <span>Alert</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("tabs"); setShowMoreTools(false); }}
                        title="Tabs"
                      >
                        <HashIcon size={16} />
                        <span>Tabs</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("definition"); setShowMoreTools(false); }}
                        title="Definition"
                      >
                        <BookOpen size={16} />
                        <span>Define</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("code-diff"); setShowMoreTools(false); }}
                        title="Code Diff"
                      >
                        <FileCode size={16} />
                        <span>Diff</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("faq"); setShowMoreTools(false); }}
                        title="FAQ"
                      >
                        <HelpCircle size={16} />
                        <span>FAQ</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("version"); setShowMoreTools(false); }}
                        title="Version"
                      >
                        <Download size={16} />
                        <span>Version</span>
                      </button>

                      <button
                        className="tool-item flex flex-col items-center gap-1 text-xs text-gray-600"
                        onClick={() => { handleToolbarAction("key-value"); setShowMoreTools(false); }}
                        title="Key-Value"
                      >
                        <Key size={16} />
                        <span>KeyValue</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="hidden sm:block w-px h-5 bg-gray-100 mx-2"
                aria-hidden="true"
              />
              <ToolbarButton
                icon={<HelpCircle size={18} className="text-indigo-600" />}
                onClick={() => setShowQuizBuilder(true)}
                tooltip="Insert Interactive Quiz"
              />
            </div>
          )}
          {/* Editor Area */}
          <div className="flex-1 overflow-auto bg-gray-50/50 relative">
            {activeTab === "markdown" ? (
              <>
                {formData.content.includes("```markdown") || formData.content.includes("````markdown") ? (
                  <div className="absolute top-2 right-6 z-10">
                    <button
                      onClick={() => {
                        const match = formData.content.match(/`{3,4}markdown\n([\s\S]*?)\n`{3,4}/);
                        if (match && match[1]) {
                          setFormData({ ...formData, content: match[1].trim() });
                          toast.success("Extracted Markdown from AI wrapper!");
                        }
                      }}
                      className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm hover:bg-indigo-700 transition-colors"
                    >
                      ✨ Extract Markdown
                    </button>
                  </div>
                ) : null}
                <textarea
                  ref={textareaRef}
                  value={formData.content}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData("text");
                    const isEntirelyWrapped = /^(?:[\s\S]*?)`{3,4}markdown\n([\s\S]*?)\n`{3,4}(?:[\s\S]*)$/.exec(pastedText);

                    // If they're pasting into an empty editor, or pasting a full AI response with ONE huge markdown block
                    if (isEntirelyWrapped && isEntirelyWrapped[1] && (!formData.content || formData.content.trim() === "")) {
                      e.preventDefault();
                      const cleanText = isEntirelyWrapped[1].trim();
                      setFormData({ ...formData, content: cleanText });
                      toast.success("Auto-extracted guide from AI wrapper!");
                    }
                  }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Start writing your amazing guide..."
                  className="w-full h-full p-8 bg-transparent border-none resize-none focus:ring-0 font-mono text-base text-gray-800 leading-relaxed"
                  spellCheck={false}
                />
              </>
            ) : (
              <textarea
                value={formData.html_content}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setFormData({ ...formData, html_content: e.target.value })
                }
                placeholder="<html>...</html>"
                className="w-full h-full p-8 bg-gray-900 text-gray-100 border-none resize-none focus:ring-0 font-mono text-sm leading-relaxed"
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Live Preview Side */}
        <div
          className={`flex-1 min-h-0 border-t border-gray-200 bg-white overflow-y-auto h-full transition-all duration-300 lg:border-t-0 lg:border-l ${viewMode === "edit" ? "hidden" : "block"} ${viewMode === "preview" ? "max-w-4xl mx-auto border-l-0 shadow-xl my-8 rounded-xl" : ""}`}
        >
          {viewMode === "split" && (
            <div className="bg-gray-50 px-6 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
              Live Preview
            </div>
          )}
          <div className="p-8 prose prose-lg prose-slate max-w-none prose-headings:font-black prose-a:text-indigo-600">
            {/* Integrated preview card (now part of Live Preview to avoid duplication) */}
            <div className="mb-6">
              <div className="bg-white border rounded-2xl ring-1 ring-gray-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 bg-white">
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    Guide Preview
                  </div>
                </div>
                {formData.cover_image ? (
                  <div className="w-full h-56 overflow-hidden">
                    <img
                      src={formData.cover_image}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  <h4 className="font-bold text-lg text-gray-900 truncate">
                    {formData.title || "Untitled guide"}
                  </h4>
                  {/* Removed excerpt to avoid duplicate content — full content appears below in Live Preview */}
                  <div className="flex items-center gap-3 mt-4">
                    <img
                      src={
                        (user?.user_metadata?.avatar_url as string) ||
                        (getAvatarForUser(user?.email) as string)
                      }
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {(user?.user_metadata?.full_name as string) ||
                          (user?.email?.split("@")[0] as string) ||
                          "Author"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {readTime} min •{" "}
                        <span className="font-mono">{slugValue || "auto"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(formData.keywords || "")
                      .split(",")
                      .map((k: any) => k.trim())
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((k, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-gray-100 rounded"
                        >
                          {k}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {activeTab === "markdown" ? (
              formData.content ? (
                (() => {
                  // Generate TOC if marker present
                  let md = String(formData.content || "");

                  // 1) support ==highlight== (convert to <mark>) so preview shows highlights
                  md = md.replace(/==([^=]+)==/g, "<mark>$1</mark>");

                  // 2) extract footnote definitions (they will be appended below)
                  const footnoteDefs: Record<string, string> = {};
                  md = md.replace(/^\[\^(\d+)\]:\s*(.*)$/gim, (_m: string, id: string, def: string) => {
                    footnoteDefs[id] = def.trim();
                    return "";
                  });

                  if (/\[toc\]/i.test(md)) {
                    const slugify = (s: string) =>
                      String(s || "")
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
                        .replace(/^-|-$/g, "");

                    const matches = Array.from(
                      md.matchAll(/^#{1,6}\s+(.*)$/gim),
                    );
                    if (matches.length > 0) {
                      const tocItems = matches.map((m: any) => {
                        const text = m[1].trim();
                        const level = (m[0].match(/^#+/) || ["#"])[0].length;
                        const id = slugify(text);
                        return { text, level, id };
                      });

                      // Build nested list (simple flat list with indentation)
                      const tocHtml = `\n<nav class="guide-toc"><ul class="space-y-1">${tocItems
                        .map((it: any) =>
                          `\n<li class="text-sm ml-${Math.max(0, (it.level - 1) * 4)}"><a href=\"#${it.id}\" class=\"text-gray-600 hover:text-gray-900\">${it.text}</a></li>`,
                        )
                        .join("")}\n</ul></nav>\n`;

                      md = md.replace(/\[TOC\]/g, tocHtml);
                    } else {
                      md = md.replace(/\[TOC\]/g, "");
                    }
                  }

                  const htmlRaw = marked.parse(md) as string;

                  // Ensure headings have stable IDs that match TOC links
                  const slugify = (s: string) =>
                    String(s || "")
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
                      .replace(/^-|-$/g, "");

                  let html = htmlRaw.replace(
                    /<h([1-6])>(.*?)<\/h\1>/g,
                    (_m: string, level: string, inner: string) => {
                      const text = inner.replace(/<[^>]+>/g, "").trim();
                      const id = slugify(text);
                      return `<h${level} id="${id}">${inner}</h${level}>`;
                    },
                  );

                  // Replace inline footnote markers with anchors and append definitions
                  if (Object.keys(footnoteDefs).length) {
                    html = html.replace(
                      /\[\^(\d+)\]/g,
                      (_m: string, id: string) =>
                        `<sup id="fnref-${id}"><a href="#fn-${id}">${id}</a></sup>`,
                    );

                    const footnotesHtml = `<section class="guide-footnotes"><hr />\n<ol>${Object.keys(
                      footnoteDefs,
                    )
                      .sort((a: string, b: string) => parseInt(a) - parseInt(b))
                      .map(
                        (id: string) =>
                          `<li id="fn-${id}">${(marked.parse(footnoteDefs[id]) as string).replace(/^<p>|<\/p>$/g, "")}&nbsp;<a href="#fnref-${id}" class="footnote-back">↩︎</a></li>`,
                      )
                      .join("")}</ol></section>`;

                    html += footnotesHtml;
                  }

                  // Allow callout/iframe/highlight through sanitizeContent
                  return (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitizeContent(
                          highlightForbiddenContent(html),
                        ),
                      }}
                    />
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-64 opacity-20">
                  <Eye size={48} />
                  <p className="mt-4 font-medium">Nothing to preview</p>
                </div>
              )
            ) : (
              <iframe
                srcDoc={
                  validationErrors.some((e) => e.includes("Forbidden"))
                    ? highlightForbiddenContent(formData.html_content)
                    : formData.html_content
                }
                className="w-full h-full min-h-[500px] border-0"
                sandbox="allow-scripts allow-same-origin"
                title="Preview"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
}

function ToolbarButton({ icon, onClick, tooltip }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      aria-label={tooltip}
      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black rounded-md transition-colors border border-transparent hover:border-gray-100 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      {icon}
    </button>
  );
}
