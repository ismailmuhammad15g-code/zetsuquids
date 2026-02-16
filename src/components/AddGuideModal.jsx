import {
    Bold,
    Code,
    Coins,
    Eye,
    Heading1,
    Heading2,
    HelpCircle,
    Image as ImageIcon,
    Italic,
    LayoutTemplate,
    Link as LinkIcon,
    List,
    ListOrdered,
    Loader2,
    Quote,
    Sparkles,
    SplitSquareHorizontal,
    Wand2,
    X,
} from "lucide-react";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { creditsApi, guidesApi } from "../lib/api";
import { uploadImageToImgBB } from "../lib/imgbb";
import { sanitizeContent } from "../lib/utils";
import QuizBuilderModal from "./quiz/QuizBuilderModal";
import QuizComponent from "./quiz/QuizComponent";

// Configure marked renderer for quiz support
const quizRenderer = {
  code(code, language) {
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
            function toSolidBytes(match, p1) {
              return String.fromCharCode("0x" + p1);
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

marked.use({ renderer: quizRenderer });
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
});

export default function AddGuideModal({ onClose }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("markdown");
  const [viewMode, setViewMode] = useState("split"); // 'edit', 'preview', 'split'
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New state for success modal
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const textareaRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    keywords: "",
    content: "",
    html_content: "",
    css_content: "",
  });

  const [validationErrors, setValidationErrors] = useState([]);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (user?.email) {
      creditsApi.getBalance(user?.email).then(setCredits);
    }
  }, [user]);

  // Calculate read time
  const readTime = Math.max(
    1,
    Math.ceil((formData.content?.split(/\s+/).length || 0) / 200),
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    validateContent();
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [formData, activeTab]);

  // Hydrate Quizzes in Preview
  useEffect(() => {
    if (activeTab === "markdown" && viewMode !== "edit") {
      // Small delay to let DOM render
      const timer = setTimeout(() => {
        const containers = document.querySelectorAll(
          ".interactive-quiz-container",
        );
        containers.forEach((container) => {
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
    {
      pattern: /(<iframe[^>]*>[\s\S]*?<\/iframe>)/gi,
      message: "Iframes are forbidden for security",
    },
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

  const highlightForbiddenContent = (html) => {
    if (!html) return "";
    let highlighted = html;

    // Apply highlighting to all forbidden patterns
    forbiddenPatterns.forEach(({ pattern, message }) => {
      highlighted = highlighted.replace(pattern, (match) => {
        // Escape HTML entities to prevent execution while displaying
        const escapedMatch = match.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<span style="background-color: rgba(255, 0, 0, 0.2); outline: 2px solid red; cursor: help; color: red; font-weight: bold;" title="${message}" class="forbidden-highlight">${escapedMatch}</span>`;
      });
    });

    return highlighted;
  };

  const validateContent = () => {
    const errors = [];
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

    // 3. Forbidden Content Detection
    if (activeContent) {
      forbiddenPatterns.forEach(({ pattern, message }) => {
        // .search() is safe with /g regexes (ignores global flag, returns index)
        if (activeContent.search(pattern) !== -1) {
          if (!errors.includes(message)) errors.push(message);
        }
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  if (!isAuthenticated() || !user) return null; // Should be handled by parent or auth check

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const toastId = toast.loading("Uploading image...");
      const url = await uploadImageToImgBB(file);
      insertText(`![${file.name}](${url})`);
      toast.success("Image uploaded successfully", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    }
  };

  const insertText = (textToInsert) => {
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

  const handleToolbarAction = (action) => {
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
      case "link":
        insertText("[Link Text](url)");
        break;
      case "code":
        insertText("\n```javascript\nconsole.log('Code');\n```\n");
        break;
      case "quote":
        insertText("\n> Quote\n");
        break;
      case "list":
        insertText("\n- List item\n");
        break;
      case "ordered-list":
        insertText("\n1. List item\n");
        break;
      default:
        break;
    }
  };

  async function callKimiAI(prompt, onChunk) {
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

      const reader = response.body.getReader();
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
    } catch (error) {
      console.error("AI Error:", error);
      throw error;
    }
  }

  const handleAIAction = async (type) => {
    const COST = type === "enhance" ? 2 : 5;

    if (credits < COST) {
      toast.error(`Insufficient credits! You need ${COST} credits.`);
      return; // Stop here, maybe open pricing modal? Logic handled in UI button
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

      // Clear content before generating (for clean slate)
      if (type === "generate") {
        setFormData((prev) => ({ ...prev, content: "" }));
      }

      let accumulatedContent = type === "enhance" ? "" : "";

      console.log("🤖 Starting AI generation...");
      const result = await callKimiAI(prompt, (chunk) => {
        accumulatedContent += chunk;
        setFormData((prev) => ({
          ...prev,
          content: accumulatedContent,
        }));
      });

      console.log("✅ AI generation complete. Total length:", result?.length);

      // Final update with complete result
      if (result && result.trim()) {
        setFormData((prev) => ({ ...prev, content: result }));
        toast.success(`Content generated! (-${COST} credits)`, { id: toastId });
        setCredits((prev) => Math.max(0, prev - COST)); // Optimistically deduct
      } else {
        console.error("❌ Empty result from AI");
        throw new Error("AI returned empty response");
      }
    } catch (error) {
      console.error("❌ AI Error:", error);
      toast.error(error.message || "AI failed", { id: toastId });
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateContent()) {
      return toast.error("Please fix validation errors before publishing");
    }

    setSaving(true);
    try {
      const keywords = formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const guide = await guidesApi.create({
        title: formData.title,
        keywords,
        markdown: formData.content,
        html_content: formData.html_content,
        css_content: formData.css_content,
        content_type: activeTab === "advanced" ? "html" : "markdown",
        user_email: user?.email,
        author_name:
          user?.user_metadata?.full_name || user?.email?.split("@")[0],
        author_id: user?.id,
        status: "pending", // Explicitly set to pending
      });

      if (guide) {
        // Show success message instead of redirecting
        toast.success("Guide submitted for review!");
        setShowSuccessModal(true);
      }
    } catch (error) {
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
                      onClick={() => navigate("/pricing")}
                      className="text-xs bg-black text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                    >
                      Upgrade
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleAIAction("enhance")}
                  disabled={credits < 2}
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
                  disabled={credits < 5}
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
              onClick={handleSubmit}
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
          onInsert={(quizData) => {
            const quizBlock = `\n\`\`\`quiz\n${JSON.stringify(quizData, null, 2)}\n\`\`\`\n`;
            setFormData({
              ...formData,
              content: formData.content + quizBlock,
            });
            toast.success("Quiz inserted successfully!");
          }}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Side */}
        <div
          className={`flex-1 flex flex-col h-full bg-white transition-all duration-300 ${viewMode === "preview" ? "hidden" : "block"}`}
        >
          {/* Metadata Inputs */}
          <div className="px-8 pt-8 pb-4 space-y-4">
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Guide Title"
              className="w-full text-4xl font-black tracking-tight placeholder:text-gray-300 border-none focus:ring-0 p-0"
            />
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) =>
                setFormData({ ...formData, keywords: e.target.value })
              }
              placeholder="Add keywords (e.g., react, tutorial, web-dev)..."
              className="w-full text-gray-500 placeholder:text-gray-300 border-none focus:ring-0 p-0 text-lg"
            />
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
            <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-1 overflow-x-auto">
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
              <div className="w-px h-5 bg-gray-200 mx-2" />
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
              <div className="w-px h-5 bg-gray-200 mx-2" />
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
              <div className="w-px h-5 bg-gray-200 mx-2" />
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
              <div className="w-px h-5 bg-gray-200 mx-2" />
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
              <div className="w-px h-5 bg-gray-200 mx-2" />
              <ToolbarButton
                icon={<HelpCircle size={18} className="text-indigo-600" />}
                onClick={() => setShowQuizBuilder(true)}
                tooltip="Insert Interactive Quiz"
              />
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 overflow-auto bg-gray-50/50">
            {activeTab === "markdown" ? (
              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Start writing your amazing guide..."
                className="w-full h-full p-8 bg-transparent border-none resize-none focus:ring-0 font-mono text-base text-gray-800 leading-relaxed"
                spellCheck={false}
              />
            ) : (
              <textarea
                value={formData.html_content}
                onChange={(e) =>
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
          className={`flex-1 border-l border-gray-200 bg-white overflow-y-auto h-full transition-all duration-300 ${viewMode === "edit" ? "hidden" : "block"} ${viewMode === "preview" ? "max-w-4xl mx-auto border-l-0 shadow-xl my-8 rounded-xl" : ""}`}
        >
          {viewMode === "split" && (
            <div className="bg-gray-50 px-6 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
              Live Preview
            </div>
          )}
          <div className="p-8 prose prose-lg prose-slate max-w-none prose-headings:font-black prose-a:text-indigo-600">
            {activeTab === "markdown" ? (
              formData.content ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitizeContent(
                      highlightForbiddenContent(marked.parse(formData.content)),
                    ),
                  }}
                />
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

function ToolbarButton({ icon, onClick, tooltip }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className="p-2 text-gray-500 hover:bg-gray-100 hover:text-black rounded transition-colors"
    >
      {icon}
    </button>
  );
}
