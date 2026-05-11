import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Hash, 
  List, ListOrdered, Table, Link as LinkIcon, Image as ImageIcon, 
  Video, Wand2, Terminal, HelpCircle, MoreHorizontal, 
  Columns, Maximize2, Code, ListChecks, Minus, Star, 
  FileText, BookOpen, FileImage, FileCode, MessageCircle, 
  LayoutTemplate, Zap, Activity, Clock, GitMerge, AlertTriangle, 
  Key, Download, Keyboard, BadgeCheck, Anchor, ChevronDown, ChevronRight
} from "lucide-react";
import { ToolbarButton } from "./ToolbarButton";
import { FormData, ViewMode } from "./types";
import { getMarkdownHtml, highlightEditorText, getViolations, Violation } from "./utils";

interface EditorTabProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handleToolbarAction: (action: string) => void;
  setShowAdvancedImageModal: (s: boolean) => void;
  setShowVideoModal: (s: boolean) => void;
  setShowQuizBuilder: (s: boolean) => void;
  setShowDownloadLinkModal: (s: boolean) => void;
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
  textareaRef,
}) => {
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [previewHtml, setPreviewHtml] = useState(() => getMarkdownHtml(formData.content));
  const [violations, setViolations] = useState<Violation[]>([]);
  const [currentViolationIndex, setCurrentViolationIndex] = useState(0);
  const [isPreviewUpdating, setIsPreviewUpdating] = useState(false);

  useEffect(() => {
    // Debounce violations calculation to avoid infinite re-renders
    const timer = setTimeout(() => {
      setViolations(getViolations(formData.content));
    }, 200);
    return () => clearTimeout(timer);
  }, [formData.content]);

  const goToNextViolation = () => {
    if (violations.length === 0) return;
    const nextIndex = (currentViolationIndex + 1) % violations.length;
    setCurrentViolationIndex(nextIndex);
    
    const violation = violations[nextIndex];
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(violation.index, violation.index + violation.length);
      
      // Scroll to it
      const lineHeight = 24; // Approximation
      const textBefore = formData.content.substring(0, violation.index);
      const linesBefore = textBefore.split('\n').length;
      textareaRef.current.scrollTop = (linesBefore - 5) * lineHeight;
    }
  };

  useEffect(() => {
    setIsPreviewUpdating(true);
    const timer = setTimeout(() => {
      setPreviewHtml(getMarkdownHtml(formData.content));
      setIsPreviewUpdating(false);
    }, 400); // Slightly longer for a more noticeable premium feel
    return () => clearTimeout(timer);
  }, [formData.content]);

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
                      { label: "Guide", action: "guide-link", icon: <BookOpen size={18} />, color: "text-indigo-600" },
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

        </div>
      </div>

      <div className={`flex-1 flex min-h-0 bg-gray-50/30 ${viewMode === "split" ? "divide-x divide-gray-100" : ""}`}>
        {/* Editor Area */}
        <div className={`flex-1 flex flex-col min-h-0 ${viewMode === "preview" ? "hidden" : "block"} relative`}>
          <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/50 flex justify-between items-center h-9">
            <div className="flex items-center gap-2">
              <FileCode size={14} />
              <span>Markdown Editor</span>
            </div>
            
            {violations.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 animate-in fade-in slide-in-from-right-2">
                <AlertTriangle size={12} className="text-red-500" />
                <span className="text-[10px] text-red-600 font-black">
                  {violations.length} {violations.length === 1 ? 'VIOLATION' : 'VIOLATIONS'}
                </span>
                <button 
                  onClick={goToNextViolation}
                  className="flex items-center gap-0.5 px-1.5 py-px bg-red-600 text-white rounded hover:bg-red-700 transition-colors ml-1 shadow-sm"
                  title="Go to next violation"
                >
                  <span className="text-[9px]">FIX</span>
                  <ChevronRight size={10} />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-transparent">
            {/* Highlight Backdrop */}
            <div 
              aria-hidden="true"
              className="absolute inset-0 p-4 sm:p-6 md:p-8 font-mono text-[14px] sm:text-[15px] leading-relaxed text-transparent pointer-events-none whitespace-pre-wrap break-words overflow-y-auto no-scrollbar"
              style={{ 
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
              id="editor-highlight-backdrop"
              dangerouslySetInnerHTML={{ __html: highlightEditorText(formData.content) }}
            />

            <textarea
              ref={textareaRef}
              value={formData.content}
              onScroll={(e) => {
                const backdrop = document.getElementById("editor-highlight-backdrop");
                if (backdrop) backdrop.scrollTop = e.currentTarget.scrollTop;
              }}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData("text");
                const isEntirelyWrapped = /^(?:[\s\S]*?)`{3,4}markdown\n([\s\S]*?)\n`{3,4}(?:[\s\S]*)$/.exec(pastedText);

                if (isEntirelyWrapped && isEntirelyWrapped[1] && (!formData.content || formData.content.trim() === "")) {
                  e.preventDefault();
                  const cleanText = isEntirelyWrapped[1].trim();
                  setFormData(prev => ({ ...prev, content: cleanText }));
                }
              }}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, content: val }));
              }}
              dir="auto"
              placeholder="Unleash your creativity..."
              className="w-full h-full p-4 sm:p-6 md:p-8 resize-none focus:ring-0 border-none font-mono text-[14px] sm:text-[15px] leading-relaxed text-gray-800 bg-transparent relative z-10 custom-scrollbar whitespace-pre-wrap break-words"
              style={{ 
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {viewMode === "split" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white hidden lg:flex custom-scrollbar relative">
            <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-white shrink-0 flex justify-between items-center h-9">
              <span>Preview</span>
              {isPreviewUpdating && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-indigo-500 font-black">SYNCING</span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              <AnimatePresence>
                {isPreviewUpdating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] p-10 pointer-events-none"
                  >
                    <div className="space-y-4 max-w-none">
                      <div className="h-8 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-50 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-50 rounded w-5/6 animate-pulse" />
                        <div className="h-4 bg-gray-50 rounded w-4/6 animate-pulse" />
                      </div>
                      <div className="h-40 bg-gray-50 rounded-xl w-full animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-50 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-50 rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div 
                className={`p-10 prose prose-lg prose-slate max-w-none transition-opacity duration-300 ${isPreviewUpdating ? 'opacity-30' : 'opacity-100'}`} 
                dir="auto"
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: previewHtml,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
