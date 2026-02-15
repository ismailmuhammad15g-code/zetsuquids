import {
  Bold,
  Code,
  Eye,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  LayoutTemplate,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Minimize2,
  Quote,
  Save,
  Sparkles,
  SplitSquareHorizontal,
  Type,
  Wand2,
  X,
} from "lucide-react";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { guidesApi } from "../lib/api";
import { uploadImageToImgBB } from "../lib/imgbb";
import { sanitizeContent } from "../lib/utils";

export default function AddGuideModal({ onClose }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("markdown");
  const [viewMode, setViewMode] = useState("split"); // 'edit', 'preview', 'split'
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const textareaRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    keywords: "",
    content: "",
    html_content: "",
    css_content: "",
  });

  // Calculate read time
  const readTime = Math.max(
    1,
    Math.ceil((formData.content?.split(" ").length || 0) / 200),
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

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

  async function callKimiAI(prompt) {
    // Reuse existing AI logic from previous implementation
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

      if (!response.ok) throw new Error("AI request failed");
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
      console.error("AI Error:", error);
      throw error;
    }
  }

  const handleAIAction = async (type) => {
    setAiProcessing(true);
    setShowAIMenu(false);
    const toastId = toast.loading("AI is working its magic...");

    try {
      let prompt = "";
      if (type === "enhance") {
        if (!formData.content) throw new Error("Write some content first!");
        prompt = `Enhance this Markdown content to be more professional, clear, and engaging. Keep the same Markdown format:\n\n${formData.content}`;
      } else if (type === "generate") {
        if (!formData.title) throw new Error("Enter a title first!");
        prompt = `Write a comprehensive technical guide in Markdown about: "${formData.title}". Keywords: ${formData.keywords}. Include code examples if relevant.`;
      }

      const result = await callKimiAI(prompt);
      setFormData({ ...formData, content: result });
      toast.success("Content generated successfully!", { id: toastId });
    } catch (error) {
      toast.error(error.message || "AI failed", { id: toastId });
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Please enter a title");
    if (!formData.content && !formData.html_content)
      return toast.error("Please enter some content");

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

      if (guide?.slug) {
        toast.success("Guide published successfully!");
        onClose();
        navigate(`/guide/${guide.slug}`);
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

          <button
            onClick={() => setShowAIMenu(!showAIMenu)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity relative"
          >
            <Sparkles size={16} />
            <span>AI Assistant</span>
            {showAIMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50 animate-in slide-in-from-top-2">
                <button
                  onClick={() => handleAIAction("enhance")}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 hover:text-black"
                >
                  <Wand2 size={16} className="text-purple-600" />
                  Enhance Content
                </button>
                <button
                  onClick={() => handleAIAction("generate")}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 hover:text-black"
                >
                  <Sparkles size={16} className="text-indigo-600" />
                  Generate from Title
                </button>
              </div>
            )}
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : "Publish"}
          </button>
        </div>
      </div>

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
              <label className="p-2 text-gray-500 hover:bg-gray-100 hover:text-black rounded cursor-pointer transition-colors" title="Upload Image">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <ImageIcon size={18} />
              </label>
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
                    __html: sanitizeContent(marked.parse(formData.content)),
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
                srcDoc={formData.html_content}
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
