import { X, Calendar } from "lucide-react";
import { ReactNode, useState } from "react";

interface ModalContainerProps {
  children: ReactNode;
  title: string;
  onClose: () => void;
}

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

function ModalContainer({ children }: ModalContainerProps) {
  return (
    <div className="px-6 py-4">
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
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
          onChange={(e) => setText(e.target.value)}
          placeholder="Click here..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
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
          <input type="number" min={1} max={10} value={rows} onChange={(e) => setRows(parseInt(e.target.value) || 1)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
          <input type="number" min={1} max={10} value={cols} onChange={(e) => setCols(parseInt(e.target.value) || 1)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
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
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={videoType === "youtube" ? "https://youtube.com/watch?v=..." : "https://vimeo.com/..."} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
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
        {["info", "warn", "success"].map((t) => (
          <button key={t} onClick={() => setType(t as "info" | "warn" | "success")} className={`flex-1 py-2 px-3 rounded-lg font-medium capitalize transition-colors ${type === t ? (t === "info" ? "bg-blue-500 text-white" : t === "warn" ? "bg-yellow-500 text-white" : "bg-green-500 text-white") : "bg-gray-100 text-gray-600"}`}>
            {t}
          </button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]" />
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
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
          {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="// Your code here..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[150px] font-mono text-sm" />
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
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
        <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Figure description" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
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
        <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Click to expand" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Hidden content..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]" />
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
        <textarea value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Enter quote..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
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
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="New" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
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
        <input type="text" value={keys} onChange={(e) => setKeys(e.target.value)} placeholder="Ctrl+S" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
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
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Get Started" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
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
        <input type="text" value={citation} onChange={(e) => setCitation(e.target.value)} placeholder="Author, Year" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source URL (optional)</label>
        <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://source.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
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
        <input type="text" value={id} onChange={(e) => setId(e.target.value)} placeholder="section-name" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
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
        <input type="number" min={1} value={marker} onChange={(e) => setMarker(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Definition</label>
        <textarea value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="Source or explanation..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-h-[100px]" />
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
            <input type="text" value={step.title} onChange={(e) => updateStep(idx, "title", e.target.value)} placeholder="Step title" className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg text-sm" />
            <textarea value={step.content} onChange={(e) => updateStep(idx, "content", e.target.value)} placeholder="Step description" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[60px]" />
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
    items.forEach((item) => {
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
            <input type="text" value={item.date} onChange={(e) => updateItem(idx, "date", e.target.value)} placeholder="Date (e.g. Jan 2024)" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={item.event} onChange={(e) => updateItem(idx, "event", e.target.value)} placeholder="Event" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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
          <input key={i} type="text" value={opt} onChange={(e) => { const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts); }} placeholder={`Option ${i + 1}`} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        ))}
      </div>
      <div className="space-y-3 max-h-[200px] overflow-y-auto">
        {features.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder="Feature name" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            {options.map((_, j) => (
              <input key={j} type="text" value={(values[i] || ["", ""])[j] || ""} onChange={(e) => updateValue(i, j, e.target.value)} placeholder="Value" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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
        {types.map((t) => (
          <button key={t.value} onClick={() => setType(t.value)} className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${type === t.value ? `${t.color} text-white` : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Alert title" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Alert content" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg min-h-[80px]" />
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
              <input type="text" value={tab.label} onChange={(e) => updateTab(i, "label", e.target.value)} placeholder="Tab label" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              {tabs.length > 1 && <button onClick={() => setTabs(tabs.filter((_, idx) => idx !== i))} className="text-red-500"><X size={16} /></button>}
            </div>
            <textarea value={tab.content} onChange={(e) => updateTab(i, "content", e.target.value)} placeholder="Tab content" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[60px]" />
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
    items.forEach((item) => {
      if (item.term) md += `**${item.term}**: ${item.definition}\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item.term} onChange={(e) => updateItem(i, "term", e.target.value)} placeholder="Term" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={item.definition} onChange={(e) => updateItem(i, "definition", e.target.value)} placeholder="Definition" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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
        <textarea value={before} onChange={(e) => setBefore(e.target.value)} placeholder="// old code" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg font-mono text-sm min-h-[80px]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">After (added +)</label>
        <textarea value={after} onChange={(e) => setAfter(e.target.value)} placeholder="// new code" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg font-mono text-sm min-h-[80px]" />
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
            <input type="text" value={item.question} onChange={(e) => updateItem(i, "question", e.target.value)} placeholder="Your question?" className="w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg text-sm" />
            <textarea value={item.answer} onChange={(e) => updateItem(i, "answer", e.target.value)} placeholder="Answer..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[60px]" />
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
    versions.forEach((v) => {
      if (v.version) md += `### v${v.version}${v.date ? ` (${v.date})` : ""}\n${v.changes || "(no changes)"}\n\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="space-y-3 max-h-[250px] overflow-y-auto">
        {versions.map((v, idx: number) => (
          <div key={idx} className="flex gap-2">
            <input type="text" value={v.version} onChange={(e) => updateVersion(idx, "version", e.target.value)} placeholder="v1.0" className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={v.date} onChange={(e) => updateVersion(idx, "date", e.target.value)} placeholder="2024-01-01" className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={v.changes} onChange={(e) => updateVersion(idx, "changes", e.target.value)} placeholder="Changes..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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
    items.forEach((item) => {
      if (item.key) md += `| ${item.key} | ${item.value} |\n`;
    });
    onInsert(md);
  };

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="space-y-2 max-h-[250px] overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item.key} onChange={(e) => updateItem(i, "key", e.target.value)} placeholder="Key" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="text" value={item.value} onChange={(e) => updateItem(i, "value", e.target.value)} placeholder="Value" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
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

export default {
  LinkModalForm,
  TableModalForm,
  VideoModalForm,
  CalloutModalForm,
  CodeModalForm,
  FigureModalForm,
  DetailsModalForm,
  QuoteModalForm,
  BadgeModalForm,
  KbdModalForm,
  CTAModalForm,
  CitationModalForm,
  AnchorModalForm,
  FootnoteModalForm,
  StepsModalForm,
  TimelineModalForm,
  ComparisonModalForm,
  AlertModalForm,
  TabsModalForm,
  DefinitionModalForm,
  CodeDiffModalForm,
  FAQModalForm,
  VersionModalForm,
  KeyValueModalForm,
};
