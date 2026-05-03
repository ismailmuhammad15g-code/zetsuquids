"use client";
import { AlertTriangle, Edit2, Image as ImageIcon, Link as LinkIcon, Loader2, X, Eye } from "lucide-react";
import { Editor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Guide, guidesApi } from "../lib/api";
import { uploadImageToImgBB } from "../lib/imgbb";
import { resizeImage } from "../lib/resizepro";

interface GuideEditModalProps {
    guide: Guide;
    onClose: () => void;
    onSaved?: (updatedGuide: Guide) => void;
}

export default function GuideEditModal({ guide, onClose, onSaved }: GuideEditModalProps) {
    const [title, setTitle] = useState(guide.title || "");
    const [keywords, setKeywords] = useState((guide.keywords || []).join(", "));
    const [coverImage, setCoverImage] = useState(guide.cover_image || "");
    const [markdown, setMarkdown] = useState(guide.markdown || guide.content || "");
    const [htmlContent, setHtmlContent] = useState(guide.html_content || "");
    const [contentType, setContentType] = useState(
        guide.content_type === "html" ? "html" : "markdown",
    );
    
    // Premium fields
    const [category, setCategory] = useState(guide.category || "Development");
    const [difficulty, setDifficulty] = useState(guide.difficulty || "Beginner");
    const [estimatedTime, setEstimatedTime] = useState(guide.estimated_time || "5 mins");

    // UI states
    const [mainTab, setMainTab] = useState("editor"); // "editor", "preview", "details"
    const [previewDevice, setPreviewDevice] = useState("laptop"); // "laptop", "tablet", "phone"
    const [saving, setSaving] = useState(false);
    const [_coverImageError, setCoverImageError] = useState<string | null>(null);
    const [autoResize, setAutoResize] = useState(true);
    const [coverUrlInput, setCoverUrlInput] = useState("");
    const [coverUrlError, setCoverUrlError] = useState("");
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);

    useEffect(() => {
        setTitle(guide.title || "");
        setKeywords((guide.keywords || []).join(", "));
        setCoverImage(guide.cover_image || "");
        setMarkdown(guide.markdown || guide.content || "");
        setHtmlContent(guide.html_content || "");
        setContentType(guide.content_type === "html" ? "html" : "markdown");
        setCategory(guide.category || "Development");
        setDifficulty(guide.difficulty || "Beginner");
        setEstimatedTime(guide.estimated_time || "5 mins");
        setCoverImageError(null);
    }, [guide]);

    const handleCoverImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = e.target.files?.[0];
        if (!file) return;

        let finalFile: File | Blob = file;

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

        try {
            const toastId = toast.loading("Uploading cover image...");
            const url = await uploadImageToImgBB(finalFile as File);
            setCoverImage(url);
            toast.success("Cover uploaded successfully", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload cover image");
        }
    };

    const handleUrlPaste = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setCoverUrlError("");
        const raw = coverUrlInput.trim();
        if (!raw) return;

        if (raw.includes("bing.com/images/create") || raw.includes("bing.com/images/search")) {
            setCoverUrlError("This looks like a Bing page link. Please copy the direct image URL.");
            return;
        }

        setIsFetchingUrl(true);
        const toastId = toast.loading("Downloading image...");
        try {
            const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(raw)}`);
            if (!proxyRes.ok) throw new Error(`Failed (${proxyRes.status})`);

            const blob = await proxyRes.blob();
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            setCoverImage(base64);
            setCoverUrlInput("");
            toast.success("Image loaded! Click Save Changes to apply.", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.dismiss(toastId);
            setCoverUrlError("Could not load that URL. Try downloading the image and using the file upload instead.");
        } finally {
            setIsFetchingUrl(false);
        }
    };

    const canSave = title.trim().length > 0 && keywords.trim().length > 0;

    const handleSave = async (): Promise<void> => {
        if (!canSave) {
            toast.error("Title and keywords are required");
            return;
        }

        setSaving(true);
        try {
            const keywordList = keywords
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean);

            const updates: any = {
                title: title.trim(),
                keywords: keywordList,
                cover_image: coverImage || null,
                content_type: contentType === "html" ? "html" : "markdown",
                updated_at: new Date().toISOString(),
                category: category,
                difficulty: difficulty,
                estimated_time: estimatedTime
            };

            if (contentType === "html") {
                updates.html_content = htmlContent;
                updates.markdown = "";
                updates.content = "";
            } else {
                updates.markdown = markdown;
                updates.content = markdown;
                updates.html_content = guide.html_content || "";
            }

            const updatedGuide = await guidesApi.update(guide.id!, updates);
            toast.success("Guide updated successfully");
            if (updatedGuide) {
                onSaved?.(updatedGuide);
            }
            onClose();
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : typeof error === "object" && error !== null
                        ? JSON.stringify(error)
                        : String(error);
            console.warn("Guide update failed:", errorMessage);
            toast.error(`Unable to save guide. ${errorMessage}`);
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
                        <Edit2 size={16} />
                        <span>Editing Guide: {title || "Untitled"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex bg-gray-100 p-1 rounded-lg gap-1">
                        <button
                            onClick={() => setMainTab("editor")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${mainTab === "editor" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Editor
                        </button>
                        <button
                            onClick={() => setMainTab("preview")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${mainTab === "preview" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Preview
                        </button>
                        <button
                            onClick={() => setMainTab("details")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${mainTab === "details" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}
                        >
                            Details
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || !canSave}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex min-h-0 flex-col overflow-hidden bg-gray-50/50">
                {mainTab === "details" && (
                    <div className="max-w-4xl mx-auto w-full p-8 overflow-y-auto h-full bg-white shadow-sm my-4 rounded-2xl border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-4">Guide Details</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Category</label>
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                >
                                    <option value="Development">Development</option>
                                    <option value="Design">Design</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Business">Business</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Difficulty</label>
                                <select 
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Estimated Time</label>
                                <input 
                                    type="text"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value)}
                                    placeholder="e.g. 10 mins"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Guide Title"
                                className="w-full text-4xl font-black tracking-tight placeholder:text-gray-300 border-none focus:ring-0 p-0"
                            />
                            <input
                                type="text"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="Add keywords (e.g., react, tutorial, web-dev)..."
                                className="w-full text-gray-500 placeholder:text-gray-300 border-none focus:ring-0 p-0 text-lg"
                            />

                            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Cover Image</p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div
                                                    onClick={(e) => { e.preventDefault(); setAutoResize(!autoResize); }}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${autoResize ? "bg-black" : "bg-gray-200"}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${autoResize ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors">
                                                    Auto Resize (16:9)
                                                </span>
                                            </label>
                                            {coverImage && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCoverImage("")}
                                                    className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-800"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-medium cursor-pointer hover:bg-gray-900 transition-colors">
                                        <ImageIcon size={16} />
                                        Upload
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleCoverImageUpload}
                                        />
                                    </label>
                                </div>

                                <form onSubmit={handleUrlPaste} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LinkIcon size={13} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={coverUrlInput}
                                            onChange={(e) => { setCoverUrlInput(e.target.value); setCoverUrlError(""); }}
                                            placeholder="Or paste a direct image URL..."
                                            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black transition-all text-gray-700"
                                            disabled={isFetchingUrl}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!coverUrlInput.trim() || isFetchingUrl}
                                        className="px-3 py-2 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
                                    >
                                        {isFetchingUrl ? <Loader2 size={13} className="animate-spin" /> : <LinkIcon size={13} />}
                                        Use URL
                                    </button>
                                </form>
                                {coverUrlError && (
                                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs p-2.5 rounded-xl mt-2">
                                        <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                                        {coverUrlError}
                                    </div>
                                )}

                                {coverImage && (
                                    <div className="mt-4 rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                                        <img src={coverImage} alt="Cover preview" className="w-full h-48 object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {mainTab === "editor" && (
                    <div className="flex-1 flex flex-col min-h-0 bg-white">
                        <div className="px-8 pt-4 pb-4 flex gap-4 border-b border-gray-100">
                            <button
                                onClick={() => setContentType("markdown")}
                                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${contentType === "markdown" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                            >
                                Markdown
                            </button>
                            <button
                                onClick={() => setContentType("html")}
                                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${contentType === "html" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                            >
                                Custom HTML
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-hidden relative">
                            {contentType === "markdown" ? (
                                <textarea
                                    value={markdown}
                                    onChange={(e) => setMarkdown(e.target.value)}
                                    placeholder="Start editing your amazing guide..."
                                    className="w-full h-full p-8 bg-transparent border-none resize-none focus:ring-0 font-mono text-base text-gray-800 leading-relaxed"
                                    spellCheck={false}
                                />
                            ) : (
                                <Editor
                                    height="100%"
                                    defaultLanguage="html"
                                    language="html"
                                    theme="vs-dark"
                                    value={htmlContent}
                                    onChange={(val) => setHtmlContent(val || "")}
                                    options={{
                                        minimap: { enabled: false },
                                        wordWrap: "on",
                                        padding: { top: 24, bottom: 24 },
                                        fontSize: 15,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        lineHeight: 1.6,
                                        scrollBeyondLastLine: false,
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )}

                {mainTab === "preview" && (
                    <div className="flex-1 overflow-y-auto h-full flex flex-col items-center bg-gray-100 py-8 px-4">
                        <div className="mb-4 flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
                            <button onClick={() => setPreviewDevice("laptop")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${previewDevice === "laptop" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}>Laptop</button>
                            <button onClick={() => setPreviewDevice("tablet")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${previewDevice === "tablet" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}>Tablet</button>
                            <button onClick={() => setPreviewDevice("phone")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${previewDevice === "phone" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}>Phone</button>
                        </div>
                        <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-y-auto overflow-x-hidden transition-all duration-300 w-full flex-1 ${previewDevice === "laptop" ? "max-w-4xl" : previewDevice === "tablet" ? "max-w-[768px]" : "max-w-[375px]"}`}>
                            <div className="p-8 prose prose-lg prose-slate max-w-none prose-headings:font-black prose-a:text-indigo-600">
                                <div className="mb-6">
                                    <div className="bg-white border rounded-2xl ring-1 ring-gray-50 overflow-hidden">
                                        <div className="px-4 py-2 border-b border-gray-100 bg-white">
                                            <div className="text-xs font-semibold uppercase text-gray-500">Guide Preview</div>
                                        </div>
                                        {coverImage && (
                                            <div className="w-full h-56 overflow-hidden">
                                                <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <h4 className="font-bold text-lg text-gray-900 truncate">{title || "Untitled guide"}</h4>
                                        </div>
                                    </div>
                                </div>

                                {contentType === "markdown" ? (
                                    markdown ? (
                                        <div dangerouslySetInnerHTML={{ __html: "<p>Markdown preview requires unified pipeline, which is normally used on the backend. This acts as a placeholder.</p>" }} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-64 opacity-20">
                                            <Eye size={48} />
                                            <p className="mt-4 font-medium">Nothing to preview</p>
                                        </div>
                                    )
                                ) : (
                                    <iframe
                                        srcDoc={htmlContent}
                                        className="w-full h-full min-h-[500px] border-0"
                                        sandbox="allow-scripts allow-same-origin"
                                        title="Preview"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
