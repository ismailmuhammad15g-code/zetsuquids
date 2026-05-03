import { Calendar, Code, X } from "lucide-react";
import React, { useState } from "react";
import { guidesApi, Guide } from "../lib/api";

interface ModalFormProps {
  onInsert: (content: string) => void;
  onClose: () => void;
}

interface LinkModalFormProps {
  onInsert: (linkText: string, url: string) => void;
  onClose: () => void;
}

interface TableModalFormProps {
  onInsert: (rows: number, cols: number) => void;
  onClose: () => void;
}

interface VideoModalFormProps {
  onInsert: (embedCode: string) => void;
  onClose: () => void;
}

interface CalloutModalFormProps {
  onInsert: (type: "info" | "warn" | "success", message: string) => void;
  onClose: () => void;
}

interface CodeModalFormProps {
  onInsert: (code: string, language: string) => void;
  onClose: () => void;
}

interface FigureModalFormProps {
  onInsert: (url: string, caption: string) => void;
  onClose: () => void;
}

interface DetailsModalFormProps {
  onInsert: (summary: string, content: string) => void;
  onClose: () => void;
}

interface QuoteModalFormProps {
  onInsert: (quote: string, author: string) => void;
  onClose: () => void;
}

interface BadgeModalFormProps {
  onInsert: (text: string) => void;
  onClose: () => void;
}

interface KbdModalFormProps {
  onInsert: (keys: string[]) => void;
  onClose: () => void;
}

interface CTAModalFormProps {
  onInsert: (label: string, url: string) => void;
  onClose: () => void;
}

interface CitationModalFormProps {
  onInsert: (citation: string, sourceUrl: string) => void;
  onClose: () => void;
}

interface AnchorModalFormProps {
  defaultSlug: string;
  onInsert: (id: string) => void;
  onClose: () => void;
}

interface FootnoteModalFormProps {
  onInsert: (marker: string, definition: string) => void;
  onClose: () => void;
}

export function LinkModalForm({ onInsert, onClose }: LinkModalFormProps) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("https://");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
        <input
          type="text"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(e.target.value)}
          placeholder="Click here..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
        <input
          type="url"
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(text, url)} disabled={!text || !url} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function TableModalForm({ onInsert, onClose }: TableModalFormProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
          <input type="number" min={1} max={10} value={rows} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRows(parseInt(e.target.value) || 1)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
          <input type="number" min={1} max={10} value={cols} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCols(parseInt(e.target.value) || 1)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(rows, cols)} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">Insert</button>
      </div>
    </div>
  );
}

export function VideoModalForm({ onInsert, onClose }: VideoModalFormProps) {
  const [url, setUrl] = useState("");
  const [videoType, setVideoType] = useState("youtube");

  const getEmbedUrl = (inputUrl: string): string => {
    if (!inputUrl) return "";
    if (videoType === "youtube") {
      const match = inputUrl.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,11})/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : inputUrl;
    } else {
      const match = inputUrl.match(/vimeo\.com\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : inputUrl;
    }
  };

  const handleInsert = () => {
    const embedUrl = getEmbedUrl(url);
    const html = `\n<div class="embed-responsive">\n  <iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n</div>\n`;
    onInsert(html);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setVideoType("youtube")} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${videoType === "youtube" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"}`}>YouTube</button>
        <button onClick={() => setVideoType("vimeo")} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${videoType === "vimeo" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>Vimeo</button>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{videoType === "youtube" ? "YouTube" : "Vimeo"} URL</label>
        <input type="url" value={url} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUrl(e.target.value)} placeholder={videoType === "youtube" ? "https://youtube.com/watch?v=..." : "https://vimeo.com/..."} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!url} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function CalloutModalForm({ onInsert, onClose }: CalloutModalFormProps) {
  const [type, setType] = useState<"info" | "warn" | "success">("info");
  const [message, setMessage] = useState("");

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="flex gap-2 mb-4">
        {["info", "warn", "success"].map((t: any) => (
          <button key={t} onClick={() => setType(t as "info" | "warn" | "success")} className={`flex-1 py-2 px-3 rounded-lg font-medium capitalize transition-colors ${type === t ? (t === "info" ? "bg-blue-500 text-white" : t === "warn" ? "bg-yellow-500 text-white" : "bg-green-500 text-white") : "bg-gray-100 text-gray-600"}`}>
            {t}
          </button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea value={message} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMessage(e.target.value)} placeholder="Your message..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(type, message)} disabled={!message} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function CodeModalForm({ onInsert, onClose }: CodeModalFormProps) {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  const languages = ["javascript", "python", "html", "css", "bash", "json", "typescript", "sql", "java", "c", "cpp", "go", "rust"];

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
        <select value={language} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
          {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
        <textarea value={code} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCode(e.target.value)} placeholder="// Your code here..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[150px] font-mono text-sm" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(code, language)} disabled={!code} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function FigureModalForm({ onInsert, onClose }: FigureModalFormProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
        <input type="url" value={url} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
        <input type="text" value={caption} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCaption(e.target.value)} placeholder="Figure description" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(url, caption)} disabled={!url} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function DetailsModalForm({ onInsert, onClose }: DetailsModalFormProps) {
  const [summary, setSummary] = useState("Click to expand");
  const [content, setContent] = useState("");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
        <input type="text" value={summary} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSummary(e.target.value)} placeholder="Click to expand" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea value={content} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContent(e.target.value)} placeholder="Hidden content..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(summary, content)} disabled={!content} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function QuoteModalForm({ onInsert, onClose }: QuoteModalFormProps) {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quote Text</label>
        <textarea value={quote} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuote(e.target.value)} placeholder="Enter quote..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
        <input type="text" value={author} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAuthor(e.target.value)} placeholder="Author name" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(quote, author)} disabled={!quote} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function BadgeModalForm({ onInsert, onClose }: BadgeModalFormProps) {
  const [text, setText] = useState("");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
        <input type="text" value={text} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setText(e.target.value)} placeholder="New" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(text)} disabled={!text} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function KbdModalForm({ onInsert, onClose }: KbdModalFormProps) {
  const [keys, setKeys] = useState("Ctrl+S");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Keys (comma separated)</label>
        <input type="text" value={keys} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setKeys(e.target.value)} placeholder="Ctrl+S" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <p className="text-xs text-gray-500">Separate multiple keys with commas</p>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(keys.split(",").map(k => k.trim()).filter(Boolean))} disabled={!keys} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function CTAModalForm({ onInsert, onClose }: CTAModalFormProps) {
  const [label, setLabel] = useState("Get Started");
  const [url, setUrl] = useState("https://");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
        <input type="text" value={label} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLabel(e.target.value)} placeholder="Get Started" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
        <input type="url" value={url} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(label, url)} disabled={!label || !url} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function CitationModalForm({ onInsert, onClose }: CitationModalFormProps) {
  const [citation, setCitation] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Citation</label>
        <input type="text" value={citation} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCitation(e.target.value)} placeholder="Author, Year" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source URL (optional)</label>
        <input type="url" value={sourceUrl} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSourceUrl(e.target.value)} placeholder="https://source.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(citation, sourceUrl)} disabled={!citation} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

interface AnchorModalFormProps {
  defaultSlug: string;
  onInsert: (id: string) => void;
  onClose: () => void;
}

export function AnchorModalForm({ defaultSlug, onInsert, onClose }: AnchorModalFormProps) {
  const [id, setId] = useState(defaultSlug || "");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Anchor ID</label>
        <input type="text" value={id} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setId(e.target.value)} placeholder="section-name" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <p className="text-xs text-gray-500">Use lowercase letters, numbers, and hyphens only</p>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(id)} disabled={!id} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

export function FootnoteModalForm({ onInsert, onClose }: FootnoteModalFormProps) {
  const [marker, setMarker] = useState("1");
  const [definition, setDefinition] = useState("");

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Footnote Number</label>
        <input type="number" min={1} value={marker} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setMarker(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Definition</label>
        <textarea value={definition} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDefinition(e.target.value)} placeholder="Source or explanation..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
        <button onClick={() => onInsert(marker, definition)} disabled={!definition} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Insert</button>
      </div>
    </div>
  );
}

// ===== NEW ADVANCED TOOLS FOR GUIDE CREATORS =====

// Step-by-step Guide Modal
export function StepsModalForm({ onInsert, onClose }: ModalFormProps) {
  const [steps, setSteps] = useState<Array<{ title: string; content: string }>>([{ title: "", content: "" }]);

  const addStep = (): void => setSteps([...steps, { title: "", content: "" }]);
  const removeStep = (idx: number): void => setSteps(steps.filter((_, i) => i !== idx));
  const updateStep = (idx: number, field: "title" | "content", value: string): void => {
    const newSteps = [...steps];
    newSteps[idx][field] = value;
    setSteps(newSteps);
  };

  const handleInsert = () => {
    let md = "\n## Steps\n\n";
    steps.forEach((step, i) => {
      md += `${i + 1}. **${step.title}**\n${step.content}\n\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="max-h-[300px] overflow-y-auto space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Step {idx + 1}</span>
              {steps.length > 1 && <button onClick={() => removeStep(idx)} className="text-red-500 text-xs hover:underline">Remove</button>}
            </div>
            <input type="text" value={step.title} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateStep(idx, "title", e.target.value)} placeholder="Step title" className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg text-sm" />
            <textarea value={step.content} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateStep(idx, "content", e.target.value)} placeholder="Step description" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[60px]" />
          </div>
        ))}
      </div>
      <button onClick={addStep} className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-gray-400 hover:text-gray-600 text-sm">+ Add Step</button>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!steps[0].title} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}

// Timeline Modal
export function TimelineModalForm({ onInsert, onClose }: ModalFormProps) {
  const [items, setItems] = useState<Array<{ date: string; event: string }>>([{ date: "", event: "" }]);

  const addItem = (): void => setItems([...items, { date: "", event: "" }]);
  const removeItem = (idx: number): void => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: "date" | "event", value: string): void => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const handleInsert = () => {
    let md = "\n## Timeline\n\n";
    items.forEach((item: any) => {
      md += `- **${item.date}**: ${item.event}\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="max-h-[300px] overflow-y-auto space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Calendar size={18} className="text-gray-400" />
            <input type="text" value={item.date} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItem(idx, "date", e.target.value)} placeholder="Date (e.g. Jan 2024)" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={item.event} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItem(idx, "event", e.target.value)} placeholder="Event" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            {items.length > 1 && <button onClick={() => removeItem(idx)} className="text-red-500"><X size={16} /></button>}
          </div>
        ))}
      </div>
      <button onClick={addItem} className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-gray-400 text-sm">+ Add Timeline Item</button>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!items[0].event} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}

// Comparison Table Modal
export function ComparisonModalForm({ onInsert, onClose }: ModalFormProps) {
  const [features, setFeatures] = useState<string[]>([""]);
  const [options, setOptions] = useState<string[]>(["Option 1", "Option 2"]);
  const [values, setValues] = useState<Record<number, string[]>>({ 0: ["", ""], 1: ["", ""] });

  const updateFeature = (idx: number, val: string): void => {
    const newFeatures = [...features];
    newFeatures[idx] = val;
    setFeatures(newFeatures);
  };

  const updateValue = (featureIdx: number, optionIdx: number, val: string): void => {
    const newValues = { ...values };
    newValues[featureIdx] = newValues[featureIdx] || ["", ""];
    newValues[featureIdx][optionIdx] = val;
    setValues(newValues);
  };

  const handleInsert = () => {
    let md = "\n| Feature | " + options.join(" | ") + " |\n";
    md += "| " + options.map(() => "---").join(" | ") + " |\n";
    features.forEach((f, i) => {
      if (f) md += `| ${f} | ${(values[i] || ["", ""]).join(" | ")} |\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="space-y-2">
        {options.map((opt, i) => (
          <input key={i} type="text" value={opt} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts); }} placeholder={`Option ${i + 1}`} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        ))}
      </div>
      <div className="space-y-3 max-h-[200px] overflow-y-auto">
        {features.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={f} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateFeature(i, e.target.value)} placeholder="Feature name" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            {options.map((_, j) => (
              <input key={j} type="text" value={(values[i] || ["", ""])[j] || ""} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateValue(i, j, e.target.value)} placeholder="Value" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            ))}
          </div>
        ))}
        <button onClick={() => setFeatures([...features, ""])} className="w-full py-1 border border-dashed border-gray-300 text-gray-500 rounded-lg text-xs">+ Feature</button>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800">Insert</button>
      </div>
    </div>
  );
}

// Alert/Notice Modal
export function AlertModalForm({ onInsert, onClose }: ModalFormProps) {
  const [type, setType] = useState("info");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const types = [
    { value: "info", label: "Info", color: "bg-blue-500" },
    { value: "warning", label: "Warning", color: "bg-yellow-500" },
    { value: "error", label: "Error", color: "bg-red-500" },
    { value: "success", label: "Success", color: "bg-green-500" },
    { value: "tip", label: "Tip", color: "bg-purple-500" },
    { value: "note", label: "Note", color: "bg-gray-500" },
  ];

  const handleInsert = () => {
    onInsert(`\n:::alert{${type}}\n**${title}**\n${content}\n:::\n`);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {types.map((t: any) => (
          <button key={t.value} onClick={() => setType(t.value)} className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${type === t.value ? `${t.color} text-white` : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <input type="text" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTitle(e.target.value)} placeholder="Alert title" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
      <textarea value={content} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContent(e.target.value)} placeholder="Alert content" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg min-h-[80px]" />
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!title} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}

// Tabs Modal
export function TabsModalForm({ onInsert, onClose }: ModalFormProps) {
  const [tabs, setTabs] = useState<Array<{ label: string; content: string }>>([{ label: "Tab 1", content: "" }]);

  const addTab = (): void => setTabs([...tabs, { label: `Tab ${tabs.length + 1}`, content: "" }]);
  const updateTab = (idx: number, field: "label" | "content", value: string): void => {
    const newTabs = [...tabs];
    newTabs[idx][field] = value;
    setTabs(newTabs);
  };

  const handleInsert = () => {
    let md = "\n:::tabs\n";
    tabs.forEach((tab, _i) => {
      md += `### ${tab.label}\n${tab.content || "(empty)"}\n\n`;
    });
    md += ":::\n";
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="space-y-3 max-h-[250px] overflow-y-auto">
        {tabs.map((tab, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex gap-2 mb-2">
              <input type="text" value={tab.label} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateTab(i, "label", e.target.value)} placeholder="Tab label" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              {tabs.length > 1 && <button onClick={() => setTabs(tabs.filter((_, idx) => idx !== i))} className="text-red-500"><X size={16} /></button>}
            </div>
            <textarea value={tab.content} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateTab(i, "content", e.target.value)} placeholder="Tab content" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[60px]" />
          </div>
        ))}
      </div>
      <button onClick={addTab} className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-gray-400 text-sm">+ Add Tab</button>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!tabs[0].label} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}

// Definition List Modal
export function DefinitionModalForm({ onInsert, onClose }: ModalFormProps) {
  const [items, setItems] = useState<Array<{ term: string; definition: string }>>([{ term: "", definition: "" }]);

  const addItem = (): void => setItems([...items, { term: "", definition: "" }]);
  const updateItem = (idx: number, field: "term" | "definition", value: string): void => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const handleInsert = () => {
    let md = "\n## Definitions\n\n";
    items.forEach((item: any) => {
      if (item.term) md += `**${item.term}**: ${item.definition}\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item.term} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItem(i, "term", e.target.value)} placeholder="Term" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={item.definition} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItem(i, "definition", e.target.value)} placeholder="Definition" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            {items.length > 1 && <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-500"><X size={16} /></button>}
          </div>
        ))}
      </div>
      <button onClick={addItem} className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-gray-400 text-sm">+ Add Definition</button>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!items[0].term} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}

// Code Comparison Modal
export function CodeDiffModalForm({ onInsert, onClose }: ModalFormProps) {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");

  const handleInsert = () => {
    onInsert(`\n\`\`\`diff\n- ${before}\n+ ${after}\n\`\`\`\n`);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Before (removed -)</label>
        <textarea value={before} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setBefore(e.target.value)} placeholder="// old code" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg font-mono text-sm min-h-[80px]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">After (added +)</label>
        <textarea value={after} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAfter(e.target.value)} placeholder="// new code" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg font-mono text-sm min-h-[80px]" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!before && !after} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}

// FAQ Modal
export function FAQModalForm({ onInsert, onClose }: ModalFormProps) {
  const [items, setItems] = useState<Array<{ question: string; answer: string }>>([{ question: "", answer: "" }]);

  const addItem = (): void => setItems([...items, { question: "", answer: "" }]);
  const updateItem = (idx: number, field: "question" | "answer", value: string): void => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const handleInsert = () => {
    let md = "\n## FAQ\n\n";
    items.forEach((item, i) => {
      if (item.question) md += `**Q${i + 1}: ${item.question}?**\n\n${item.answer}\n\n---\n\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="space-y-4 max-h-[300px] overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Question {i + 1}</span>
              {items.length > 1 && <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-500 text-xs hover:underline">Remove</button>}
            </div>
            <input type="text" value={item.question} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItem(i, "question", e.target.value)} placeholder="Your question?" className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg text-sm" />
            <textarea value={item.answer} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItem(i, "answer", e.target.value)} placeholder="Answer..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[60px]" />
          </div>
        ))}
      </div>
      <button onClick={addItem} className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-gray-400 text-sm">+ Add FAQ Item</button>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!items[0].question} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}

// Version History Modal
export function VersionModalForm({ onInsert, onClose }: ModalFormProps) {
  const [versions, setVersions] = useState<Array<{ version: string; date: string; changes: string }>>([{ version: "1.0", date: "", changes: "" }]);

  const addVersion = (): void => setVersions([...versions, { version: `${versions.length + 1}.0`, date: "", changes: "" }]);
  const updateVersion = (idx: number, field: "version" | "date" | "changes", value: string): void => {
    const newVersions = [...versions];
    newVersions[idx][field] = value;
    setVersions(newVersions);
  };

  const handleInsert = () => {
    let md = "\n## Changelog\n\n";
    versions.forEach((v: any) => {
      if (v.version) md += `### v${v.version}${v.date ? ` (${v.date})` : ""}\n${v.changes || "(no changes)"}\n\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="space-y-3 max-h-[250px] overflow-y-auto">
        {versions.map((v, idx: number) => (
          <div key={idx} className="flex gap-2">
            <input type="text" value={v.version} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateVersion(idx, "version", e.target.value)} placeholder="v1.0" className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={v.date} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateVersion(idx, "date", e.target.value)} placeholder="2024-01-01" className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={v.changes} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateVersion(idx, "changes", e.target.value)} placeholder="Changes..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            {versions.length > 1 && <button onClick={() => setVersions(versions.filter((_, idx2) => idx2 !== idx))} className="text-red-500"><X size={16} /></button>}
          </div>
        ))}
      </div>
      <button onClick={addVersion} className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-gray-400 text-sm">+ Add Version</button>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!versions[0].version} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}

// Key-Value Pairs Modal
export function KeyValueModalForm({ onInsert, onClose }: ModalFormProps) {
  const [items, setItems] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }]);

  const addItem = (): void => setItems([...items, { key: "", value: "" }]);
  const updateItem = (idx: number, field: "key" | "value", value: string): void => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const handleInsert = () => {
    let md = "\n| Key | Value |\n| --- | --- |\n";
    items.forEach((item: any) => {
      if (item.key) md += `| ${item.key} | ${item.value} |\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="space-y-2 max-h-[250px] overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item.key} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItem(i, "key", e.target.value)} placeholder="Key" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={item.value} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateItem(i, "value", e.target.value)} placeholder="Value" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            {items.length > 1 && <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-500"><X size={16} /></button>}
          </div>
        ))}
      </div>
      <button onClick={addItem} className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-gray-400 text-sm">+ Add Row</button>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!items[0].key} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}



export function DownloadLinkModalForm({ onInsert, onClose }: ModalFormProps) {
  const [title, setTitle] = useState("");
  const [fileInfo, setFileInfo] = useState("");
  const [url, setUrl] = useState("");

  const handleInsert = () => {
    const html = `
<div class="my-6 bg-[#2a2a2a] text-white p-4 rounded-lg flex items-center justify-between" style="border: 1px solid #3f3f3f;">
  <div class="flex items-center gap-4">
    <div class="bg-white/10 p-3 rounded-md flex-shrink-0">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    </div>
    <div class="overflow-hidden">
      <h4 class="text-base font-bold text-white m-0 leading-tight truncate">${title}</h4>
      <div class="flex gap-3 text-gray-400 mt-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="hover:text-white cursor-pointer transition-colors"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="hover:text-white cursor-pointer transition-colors"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="hover:text-white cursor-pointer transition-colors"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </div>
    </div>
  </div>
  <a href="${url}" target="_blank" rel="noopener noreferrer" class="bg-[#0d6efd] hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded text-sm transition-colors uppercase no-underline inline-block flex-shrink-0 ml-4">
    DOWNLOAD ${fileInfo ? `(${fileInfo})` : ""}
  </a>
</div>
`;
    onInsert(html);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="GitHub Repository (FREE RDP Script)" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">File Size/Info</label>
        <input type="text" value={fileInfo} onChange={(e) => setFileInfo(e.target.value)} placeholder="4.87KB" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Download URL</label>
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={handleInsert} disabled={!title || !url} className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Insert</button>
      </div>
    </div>
  );
}

// ─── PlaygroundPreview ───────────────────────────────────────────────────────
export function PlaygroundPreview({ data }: { data: any }) {
  const [activeTab, setActiveTab] = React.useState<"html" | "css" | "js" | "result">("result");
  const [zoom, setZoom] = React.useState(1);
  const [reloadKey, setReloadKey] = React.useState(0);

  return (
    <div className="my-8 rounded overflow-hidden border flex flex-col font-mono" style={{ borderColor: "#444857", backgroundColor: "#1e1e1e", height: "400px" }}>
      {/* Header tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b text-xs" style={{ borderColor: "#444857", backgroundColor: "#1e1e1e" }}>
        <div className="flex gap-1">
          {(["html", "css", "js", "result"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-sm uppercase font-semibold transition-colors ${activeTab === tab ? "bg-[#444857] text-white" : "text-[#858585] hover:text-white"}`}
            >{tab}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[#858585]">
          <span className="text-[10px] uppercase tracking-widest">Edit on</span>
          <div className="flex items-center gap-1 text-white font-bold text-xs">
            <Code size={14} />
            <span>ZETSUGUIDE</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden bg-white relative">
        {activeTab === "result" ? (
          <div className="w-full h-full" style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%`, height: `${100 / zoom}%` }}>
            <iframe
              key={reloadKey}
              sandbox="allow-scripts"
              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${data.css || "body{font-family:sans-serif;padding:20px;}"}</style></head><body>${data.html || ""}<script>${data.js || ""}<\/script></body></html>`}
              className="w-full h-full border-none block bg-white"
              title={data.title || "Live Demo"}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-[#1e1e1e] p-4 overflow-auto text-sm text-[#d4d4d4]">
            <pre className="font-mono"><code>{data[activeTab] || ""}</code></pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t text-xs" style={{ borderColor: "#444857", backgroundColor: "#1e1e1e" }}>
        <span className="text-[#858585] font-mono">{data.title || "Live Demo"}</span>
        <div className="flex gap-1 bg-[#343436] rounded-sm p-0.5">
          {([1, 0.5, 0.25] as const).map((level) => (
            <button key={level} onClick={() => setZoom(level)}
              className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${zoom === level ? "bg-[#5a5f73] text-white" : "text-[#cccccc] hover:text-white"}`}
            >{level}x</button>
          ))}
        </div>
        <button
          onClick={() => { setActiveTab("result"); setReloadKey((k) => k + 1); }}
          className="px-4 py-1.5 bg-[#444857] text-[#cccccc] hover:text-white rounded-sm font-medium transition-colors"
        >Rerun</button>
      </div>
    </div>
  );
}

// ─── PlaygroundModalForm ──────────────────────────────────────────────────────
export function PlaygroundModalForm({ onInsert, onClose: _onClose }: { onInsert: (code: string) => void; onClose: () => void }) {
  const [pgHtml, setPgHtml] = React.useState("");
  const [pgCss, setPgCss] = React.useState("");
  const [pgJs, setPgJs] = React.useState("document.addEventListener('DOMContentLoaded', () => {\n  // Your JS here\n});");
  const [pgTitle, setPgTitle] = React.useState("Live Demo");
  const [previewKey, setPreviewKey] = React.useState(0);

  const srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${pgCss}</style></head><body>${pgHtml}<script>${pgJs}<\/script></body></html>`;

  const handleInsert = () => {
    const payload = JSON.stringify({ title: pgTitle, html: pgHtml, css: pgCss, js: pgJs }, null, 2);
    onInsert(`\n\`\`\`playground\n${payload}\n\`\`\`\n`);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-gray-50 flex-shrink-0">
        <label className="text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Title</label>
        <input type="text" value={pgTitle} onChange={(e) => setPgTitle(e.target.value)} placeholder="Live Demo"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
        <button type="button" onClick={() => setPreviewKey((k) => k + 1)}
          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">▶ Run</button>
        <button type="button" onClick={handleInsert}
          className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">✓ Insert</button>
      </div>
      {/* Editors + Preview */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "500px" }}>
        <div className="flex flex-col w-1/2 border-r border-gray-200 bg-gray-950 divide-y divide-gray-800">
          {[{ label: "HTML", color: "text-orange-400", val: pgHtml, set: setPgHtml },
            { label: "CSS",  color: "text-blue-400",   val: pgCss,  set: setPgCss  },
            { label: "JS",   color: "text-yellow-400", val: pgJs,   set: setPgJs   }].map(({ label, color, val, set }) => (
            <div key={label} className="flex flex-col flex-1 min-h-0">
              <div className={`px-3 py-1 text-xs font-bold font-mono bg-gray-900 border-b border-gray-800 flex-shrink-0 ${color}`}>{label}</div>
              <textarea value={val} onChange={(e) => set(e.target.value)}
                className="flex-1 resize-none bg-gray-950 text-gray-100 font-mono text-sm p-3 focus:outline-none" spellCheck={false} />
            </div>
          ))}
        </div>
        <div className="w-1/2 flex flex-col bg-white">
          <div className="px-3 py-1 text-xs font-bold text-gray-500 font-mono bg-gray-50 border-b border-gray-100 flex-shrink-0">Preview</div>
          <iframe key={previewKey} sandbox="allow-scripts" srcDoc={srcdoc} className="flex-1 border-none" title="Playground Preview" />
        </div>
      </div>
    </div>
  );
}

export function GuideLinkModalForm({ currentUserId, onInsert, onClose }: { currentUserId: string; onInsert: (content: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let active = true;
    guidesApi.getAll().then(allGuides => {
      if (active) {
        const sorted = [...allGuides].sort((a, b) => {
          const aMine = (a.author_id && a.author_id === currentUserId);
          const bMine = (b.author_id && b.author_id === currentUserId);
          if (aMine && !bMine) return -1;
          if (!aMine && bMine) return 1;
          return 0;
        });
        setGuides(sorted);
        setLoading(false);
      }
    }).catch(err => {
      console.error(err);
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [currentUserId]);

  const filteredGuides = guides.filter(g => 
    g.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleInsert = () => {
    if (!selectedGuide) return;
    const coverImage = selectedGuide.cover_image || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80";
    const authorName = selectedGuide.author_name || "Author";
    const slug = selectedGuide.slug || "";
    
    const htmlBlock = `
<div class="guide-link-card">
  <a href="/guide/${slug}" class="guide-link-inner" target="_blank" rel="noopener noreferrer">
    <img src="${coverImage}" alt="${selectedGuide.title}" class="guide-link-cover" />
    <div class="guide-link-info">
      <h4 class="guide-link-title">${selectedGuide.title}</h4>
      <span class="guide-link-author">By ${authorName}</span>
    </div>
  </a>
</div>
`;
    onInsert(htmlBlock);
    onClose();
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Search and Select a Guide</label>
        <div className="space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all"
          />
          {loading ? (
            <div className="text-xs text-gray-500 py-2">Loading guides...</div>
          ) : (
            <div className="max-h-[220px] overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 custom-scrollbar">
              {filteredGuides.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">No guides found</div>
              ) : (
                filteredGuides.map((guide) => (
                  <button
                    key={guide.id || guide.slug}
                    type="button"
                    onClick={() => setSelectedGuide(guide)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedGuide?.id === guide.id ? "bg-gray-50/80 font-semibold" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{guide.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        By {guide.author_name || "Author"} {(guide.author_id && guide.author_id === currentUserId) ? "(Mine)" : ""}
                      </div>
                    </div>
                    {selectedGuide?.id === guide.id && (
                      <span className="w-2 h-2 rounded-full bg-black flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedGuide && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in duration-200">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preview Card</div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100">
            <img 
              src={selectedGuide.cover_image || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"} 
              alt={selectedGuide.title} 
              className="w-16 h-12 object-cover rounded-md flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-gray-900 truncate leading-tight">{selectedGuide.title}</div>
              <div className="text-xs text-gray-400 mt-1">By {selectedGuide.author_name || "Author"}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleInsert}
          disabled={!selectedGuide}
          className="flex-1 px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Insert Guide Card
        </button>
      </div>
    </div>
  );
}

