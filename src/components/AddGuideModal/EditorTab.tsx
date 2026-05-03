import React, { useState } from "react";
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Hash, 
  List, ListOrdered, Table, Link as LinkIcon, Image as ImageIcon, 
  Video, Wand2, Terminal, HelpCircle, MoreHorizontal, Sparkles, 
  Columns, Maximize2, Code, ListChecks, Minus, Star, 
  FileText, BookOpen, FileImage, FileCode, MessageCircle, 
  LayoutTemplate, Zap, Activity, Clock, GitMerge, AlertTriangle, 
  Key, Download, Keyboard, BadgeCheck, Anchor, ChevronDown
} from "lucide-react";
import { ToolbarButton } from "./ToolbarButton";
import { FormData, ViewMode } from "./types";
import { getMarkdownHtml } from "./utils";

interface EditorTabProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  handleToolbarAction: (action: string) => void;
  setShowAdvancedImageModal: (s: boolean) => void;
  setShowVideoModal: (s: boolean) => void;
  setShowQuizBuilder: (s: boolean) => void;
  setShowDownloadLinkModal: (s: boolean) => void;
  handleAIAction: (type: string) => Promise<void>;
  aiProcessing: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const EditorTab: React.FC<EditorTabProps> = ({
  formData,
  setFormData,
  handleToolbarAction,
  setShowAdvancedImageModal,
  setShowVideoModal,
  setShowQuizBuilder,
  setShowDownloadLinkModal,
  handleAIAction,
  aiProcessing,

  textareaRef,
}) => {
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-[1005]">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <ToolbarButton icon={<Bold size={18} />} onClick={() => handleToolbarAction("bold")} tooltip="Bold" />
            <ToolbarButton icon={<Italic size={18} />} onClick={() => handleToolbarAction("italic")} tooltip="Italic" />
            <ToolbarButton icon={<Strikethrough size={18} />} onClick={() => handleToolbarAction("strikethrough")} tooltip="Strikethrough" />
            <ToolbarButton icon={<Code size={18} />} onClick={() => handleToolbarAction("inline-code")} tooltip="Inline Code" />
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

            <ToolbarButton icon={<Heading1 size={18} />} onClick={() => handleToolbarAction("h1")} tooltip="H1" />
            <ToolbarButton icon={<Heading2 size={18} />} onClick={() => handleToolbarAction("h2")} tooltip="H2" />
            <ToolbarButton icon={<Hash size={16} />} onClick={() => handleToolbarAction("h3")} tooltip="H3" />
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

            <ToolbarButton icon={<List size={18} />} onClick={() => handleToolbarAction("list")} tooltip="Bullets" />
            <ToolbarButton icon={<ListOrdered size={18} />} onClick={() => handleToolbarAction("ordered-list")} tooltip="Numbers" />
            <ToolbarButton icon={<ListChecks size={18} />} onClick={() => handleToolbarAction("task-list")} tooltip="Task List" />
            <ToolbarButton icon={<Table size={18} />} onClick={() => handleToolbarAction("table")} tooltip="Table" />
            <ToolbarButton icon={<LinkIcon size={18} />} onClick={() => handleToolbarAction("link")} tooltip="Link" />
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

            <ToolbarButton icon={<ImageIcon size={18} />} onClick={() => setShowAdvancedImageModal(true)} tooltip="Upload Images" />
            <ToolbarButton icon={<Video size={18} />} onClick={() => setShowVideoModal(true)} tooltip="Embed Video" />
            <ToolbarButton icon={<Wand2 size={18} />} onClick={() => handleToolbarAction("callout")} tooltip="Callout" />
            <ToolbarButton icon={<Terminal size={18} className="text-emerald-600" />} onClick={() => handleToolbarAction("run")} tooltip="Code Playground" />
            <ToolbarButton icon={<HelpCircle size={18} className="text-indigo-600" />} onClick={() => setShowQuizBuilder(true)} tooltip="Quiz" />
          </div>

          {/* More Tools - Outside the scrollable area */}
          <div className="relative shrink-0 ml-1">
            <ToolbarButton
              icon={<MoreHorizontal size={18} />}
              onClick={() => setShowMoreTools((s) => !s)}
              tooltip="More tools"
            />
            {showMoreTools && (
              <>
                <div className="fixed inset-0 z-[1008]" onClick={() => setShowMoreTools(false)} />
                <div className="absolute right-0 sm:left-[-240px] mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[1010] animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "CTA", action: "cta", icon: <Activity size={18} />, color: "text-blue-500" },
                      { label: "Steps", action: "steps", icon: <ListOrdered size={18} />, color: "text-emerald-500" },
                      { label: "Alert", action: "alert", icon: <AlertTriangle size={18} />, color: "text-red-500" },
                      { label: "Compare", action: "comparison", icon: <GitMerge size={18} />, color: "text-purple-500" },
                      { label: "Time", action: "timeline", icon: <Clock size={18} />, color: "text-orange-500" },
                      { label: "Tabs", action: "tabs", icon: <LayoutTemplate size={18} />, color: "text-indigo-500" },
                      { label: "Columns", action: "columns", icon: <Columns size={18} />, color: "text-cyan-500" },
                      { label: "Anchor", action: "anchor", icon: <Anchor size={18} />, color: "text-gray-500" },
                      { label: "Mermaid", action: "mermaid", icon: <FileCode size={18} />, color: "text-teal-500" },
                      { label: "Emoji", action: "emoji", icon: <Zap size={18} />, color: "text-yellow-500" },
                      { label: "Mark", action: "highlight", icon: <Star size={18} />, color: "text-amber-500" },
                      { label: "Footnote", action: "footnote", icon: <FileText size={18} />, color: "text-gray-400" },
                      { label: "TOC", action: "toc", icon: <BookOpen size={18} />, color: "text-blue-400" },
                      { label: "Figure", action: "figure", icon: <FileImage size={18} />, color: "text-emerald-400" },
                      { label: "Details", action: "details", icon: <ChevronDown size={18} />, color: "text-indigo-400" },
                      { label: "Badge", action: "badge", icon: <BadgeCheck size={18} />, color: "text-emerald-600" },
                      { label: "Kbd", action: "kbd", icon: <Keyboard size={18} />, color: "text-gray-600" },
                      { label: "Quote", action: "pull-quote", icon: <MessageCircle size={18} />, color: "text-purple-600" },
                      { label: "Cite", action: "citation", icon: <BookOpen size={18} />, color: "text-gray-500" },
                      { label: "Define", action: "definition", icon: <BookOpen size={18} />, color: "text-indigo-600" },
                      { label: "Diff", action: "code-diff", icon: <FileCode size={18} />, color: "text-red-400" },
                      { label: "FAQ", action: "faq", icon: <HelpCircle size={18} />, color: "text-amber-600" },
                      { label: "Version", action: "version", icon: <Download size={18} />, color: "text-blue-600" },
                      { label: "KeyVal", action: "key-value", icon: <Key size={18} />, color: "text-amber-500" },
                      { label: "HR", action: "hr", icon: <Minus size={18} />, color: "text-gray-300" },
                      { label: "DL Link", action: "dl-link", icon: <Download size={18} />, color: "text-cyan-600" },
                    ].map((tool) => (
                      <button
                        key={tool.label}
                        onClick={() => {
                          if (tool.action === "dl-link") setShowDownloadLinkModal(true);
                          else handleToolbarAction(tool.action as any);
                          setShowMoreTools(false);
                        }}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-all group"
                      >
                        <span className={`${tool.color} group-hover:scale-110 transition-transform`}>{tool.icon}</span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter text-center">{tool.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <div className="hidden lg:flex items-center bg-gray-100 p-1 rounded-lg gap-1">
            <button
              onClick={() => setViewMode("edit")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "edit" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-gray-600"}`}
              title="Editor Only"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "split" ? "bg-white shadow-sm text-black" : "text-gray-400 hover:text-gray-600"}`}
              title="Split View"
            >
              <Columns size={16} />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAIMenu(!showAIMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">AI Writing</span>
            </button>

            {showAIMenu && (
              <>
                <div className="fixed inset-0 z-[1008]" onClick={() => setShowAIMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[1010] animate-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-gray-50 mb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Assistants</p>
                  </div>
                  <button
                    onClick={() => { handleAIAction("generate"); setShowAIMenu(false); }}
                    disabled={aiProcessing}
                    className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <Wand2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Generate Guide</p>
                      <p className="text-[10px] text-gray-500">From title & keywords (5c)</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { handleAIAction("enhance"); setShowAIMenu(false); }}
                    disabled={aiProcessing}
                    className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50 rounded-xl transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Enhance Content</p>
                      <p className="text-[10px] text-gray-500">Improve flow & tone (2c)</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 flex min-h-0 bg-gray-50/30 ${viewMode === "split" ? "divide-x divide-gray-100" : ""}`}>
        {/* Editor Area */}
        <div className={`flex-1 flex flex-col min-h-0 ${viewMode === "preview" ? "hidden" : "block"}`}>
          <textarea
            ref={textareaRef}
            value={formData.content}
            onPaste={(e) => {
              const pastedText = e.clipboardData.getData("text");
              const isEntirelyWrapped = /^(?:[\s\S]*?)`{3,4}markdown\n([\s\S]*?)\n`{3,4}(?:[\s\S]*)$/.exec(pastedText);

              if (isEntirelyWrapped && isEntirelyWrapped[1] && (!formData.content || formData.content.trim() === "")) {
                e.preventDefault();
                const cleanText = isEntirelyWrapped[1].trim();
                setFormData({ ...formData, content: cleanText });
              }
            }}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Unleash your creativity..."
            className="w-full h-full p-8 resize-none focus:ring-0 border-none font-mono text-[15px] leading-relaxed text-gray-800 bg-transparent custom-scrollbar"
            spellCheck={false}
          />
        </div>

        {/* Live Preview Area */}
        {viewMode === "split" && (
          <div className="flex-1 overflow-y-auto bg-white hidden lg:block custom-scrollbar">
            <div className="p-10 prose prose-lg prose-slate max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: getMarkdownHtml(formData.content),
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
