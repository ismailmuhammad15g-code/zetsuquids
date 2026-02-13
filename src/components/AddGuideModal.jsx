import {
    BookOpen,
    ChevronUp,
    Code,
    Eye,
    FileText,
    Loader2,
    Save,
    Sparkles,
    Wand2,
    X,
} from "lucide-react";
import { marked } from "marked";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { guidesApi } from "../lib/api";
import { sanitizeContent } from "../lib/utils";

export default function AddGuideModal({ onClose }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("markdown");
  const [showPreview, setShowPreview] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  const [formData, setFormData] = useState({
    title: "",
    keywords: "",
    content: "",
    html_content: "",
    css_content: "",
  });

  // Disable body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Prevent non-authenticated users from creating guides
  if (!isAuthenticated() || !user) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-2xl p-12 max-w-md w-full text-center animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-3xl font-black mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            You must be signed in to create guides. This helps us track
            authorship and maintain guide quality.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                navigate("/auth?redirect=guides");
              }}
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function callKimiAI(prompt) {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "kimi-k2-0905:free",
          messages: [{ role: "user", content: prompt }],
          userEmail: user?.email,
          skipCreditDeduction: false,
        }),
      });

      if (!response.ok) {
        // Handle different error types
        if (response.status === 504) {
          throw new Error(
            "AI service is taking too long to respond. Please try again with shorter content.",
          );
        }

        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `AI request failed (Status: ${response.status})`,
        );
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
      // Network errors or timeout
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      }
      throw error;
    }
  }

  async function handleEnhanceContent() {
    if (!formData.content.trim() && !formData.html_content.trim()) {
      setErrorModal({
        show: true,
        message: "Please write some content first before enhancing!",
      });
      return;
    }

    setAiProcessing(true);
    setShowAIMenu(false);

    try {
      const contentToEnhance =
        activeTab === "markdown" ? formData.content : formData.html_content;

      const prompt = `You are a professional content editor. Enhance the following ${activeTab === "markdown" ? "Markdown" : "HTML"} content to make it more professional, clear, and engaging. Keep the same format (${activeTab === "markdown" ? "Markdown" : "HTML"}).

Original Content:
${contentToEnhance}

Instructions:
- Improve clarity and readability
- Fix grammar and spelling
- Add professional formatting
- Keep the same structure and format
- Return ONLY the enhanced content, no explanations

Enhanced Content:`;

      const enhanced = await callKimiAI(prompt);

      if (activeTab === "markdown") {
        setFormData({ ...formData, content: enhanced });
      } else {
        setFormData({ ...formData, html_content: enhanced });
      }
    } catch (err) {
      console.error("AI Enhancement error:", err);
      setErrorModal({
        show: true,
        message: "Failed to enhance content: " + err.message,
      });
    } finally {
      setAiProcessing(false);
    }
  }

  async function handleGenerateContent() {
    if (!formData.title.trim()) {
      setErrorModal({
        show: true,
        message: "Please enter a title first so AI knows what to generate!",
      });
      return;
    }

    setAiProcessing(true);
    setShowAIMenu(false);

    try {
      const prompt = `You are a professional technical writer. Generate a comprehensive guide about: "${formData.title}"

Format: ${activeTab === "markdown" ? "Markdown" : "Complete HTML with inline CSS"}
Keywords: ${formData.keywords || "general programming"}

Instructions:
- Create a detailed, well-structured guide
- Include introduction, main sections, and conclusion
- Add code examples if relevant
- Use professional formatting
${activeTab === "markdown" ? "- Use Markdown syntax (headers, lists, code blocks, etc.)" : "- Create complete HTML with <style> tags for styling"}
- Make it educational and easy to understand
- Return ONLY the content, no explanations

Generated Content:`;

      const generated = await callKimiAI(prompt);

      if (activeTab === "markdown") {
        setFormData({ ...formData, content: generated });
      } else {
        setFormData({ ...formData, html_content: generated });
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      setErrorModal({
        show: true,
        message: "Failed to generate content: " + err.message,
      });
    } finally {
      setAiProcessing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrorModal({ show: true, message: "Please enter a title" });
      return;
    }

    if (!formData.content.trim() && !formData.html_content.trim()) {
      setErrorModal({
        show: true,
        message: "Please enter content (Markdown or HTML)",
      });
      return;
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
      });

      if (guide && guide.slug) {
        onClose();
        navigate(`/guide/${guide.slug}`);
      } else {
        throw new Error("Guide created but no slug returned");
      }
    } catch (err) {
      console.error("Error creating guide:", err);
      setErrorModal({
        show: true,
        message: "حدث خطأ أثناء الحفظ: " + (err.message || "حاول مرة أخرى"),
      });
    } finally {
      setSaving(false);
    }
  }

  const renderPreview = () => {
    if (activeTab === "markdown" && formData.content) {
      const html = marked.parse(formData.content);
      const sanitizedHtml = sanitizeContent(html);
      return (
        <div
          className="prose prose-lg max-w-none prose-headings:font-black"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      );
    } else if (activeTab === "advanced" && formData.html_content) {
      return (
        <iframe
          srcDoc={formData.html_content}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Preview"
        />
      );
    }
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Start typing to see preview...</p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Error Modal */}
      {errorModal.show && (
        <div
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setErrorModal({ show: false, message: "" })}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Oops!</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {errorModal.message}
            </p>
            <button
              onClick={() => setErrorModal({ show: false, message: "" })}
              className="px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div
        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        {/* Full Screen Modal */}
        <div
          className="h-screen flex flex-col bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-[1800px] mx-auto px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Create New Guide
                  </h1>
                  <p className="text-sm text-gray-500">
                    Share your knowledge with the world
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <div className="max-w-[1800px] mx-auto h-full flex gap-6 p-6">
              {/* Left Side - Form */}
              <div
                className={`${showPreview ? "w-1/2" : "w-full max-w-4xl mx-auto"} bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 relative`}
              >
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <BookOpen size={14} />
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-lg font-medium transition-all"
                        placeholder="Enter an amazing title..."
                        required
                      />
                    </div>

                    {/* Keywords */}
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wide">
                        Keywords{" "}
                        <span className="text-gray-400 font-normal normal-case">
                          (comma separated)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.keywords}
                        onChange={(e) =>
                          setFormData({ ...formData, keywords: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                        placeholder="react, javascript, tutorial, beginner..."
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Help others discover your guide
                      </p>
                    </div>

                    {/* Content Type Tabs */}
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wide">
                        Content Type
                      </label>
                      <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => setActiveTab("markdown")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
                            activeTab === "markdown"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <FileText size={16} />
                          Markdown
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("advanced")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
                            activeTab === "advanced"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <Code size={16} />
                          Full HTML
                        </button>
                      </div>
                    </div>

                    {/* Markdown Content */}
                    {activeTab === "markdown" && (
                      <div>
                        <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wide">
                          Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.content}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              content: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-mono text-sm transition-all resize-none"
                          rows={16}
                          placeholder={`# Getting Started

Write your guide content here using **Markdown**.

## Features
- Support for headers, lists, and more
- Code blocks with syntax highlighting
- Links and images

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`
`}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Supports full Markdown: **bold**, *italic*, `code`,
                          lists, headers, etc.
                        </p>
                      </div>
                    )}

                    {/* Advanced HTML */}
                    {activeTab === "advanced" && (
                      <div>
                        <label className="block text-xs font-semibold mb-2 text-gray-700 uppercase tracking-wide">
                          Full HTML Code <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.html_content}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              html_content: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-mono text-sm transition-all resize-none"
                          rows={20}
                          placeholder={`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello World</h1>
        <p>Your content here...</p>
    </div>
</body>
</html>`}
                        />
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-xs text-gray-600">
                            💡 <strong>Tip:</strong> Paste complete HTML
                            including &lt;style&gt; and &lt;script&gt; tags.
                            Full JavaScript support!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
                    >
                      <Eye size={16} />
                      {showPreview ? "Hide" : "Show"} Preview
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Publish Guide
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* AI Enhancement Button - Floating at Bottom */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
                  {/* AI Menu */}
                  {showAIMenu && (
                    <div className="mb-3 bg-white border-2 border-black rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                      <button
                        type="button"
                        onClick={handleEnhanceContent}
                        disabled={aiProcessing}
                        className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-all border-b border-gray-200 disabled:opacity-50"
                      >
                        <Wand2 size={18} className="text-black" />
                        <div className="text-left">
                          <div className="font-semibold text-sm">
                            Enhance Content
                          </div>
                          <div className="text-xs text-gray-500">
                            Improve clarity & grammar
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateContent}
                        disabled={aiProcessing}
                        className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50"
                      >
                        <Sparkles size={18} className="text-black" />
                        <div className="text-left">
                          <div className="font-semibold text-sm">
                            Generate Content
                          </div>
                          <div className="text-xs text-gray-500">
                            Create from title & keywords
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Main AI Button */}
                  <button
                    type="button"
                    onClick={() => setShowAIMenu(!showAIMenu)}
                    disabled={aiProcessing}
                    className="flex items-center gap-3 px-8 py-3.5 bg-black text-white rounded-lg shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 border border-gray-800"
                  >
                    {aiProcessing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>AI Processing...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={20} strokeWidth={2.5} />
                        <span className="text-base">AI Enhance</span>
                        <ChevronUp
                          size={18}
                          className={showAIMenu ? "rotate-180" : ""}
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Side - Live Preview */}
              {showPreview && (
                <div className="w-1/2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Eye size={16} />
                      Live Preview
                    </h3>
                  </div>
                  <div className="flex-1 overflow-auto p-8 bg-white">
                    {renderPreview()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
