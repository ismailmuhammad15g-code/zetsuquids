"use client";

import {
    AlertTriangle,
    Bot,
    Check,
    Copy,
    ExternalLink,
    ImageIcon,
    Link as LinkIcon,
    Loader2,
    MessageSquare,
    Sparkles,
    Upload,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { guidesApi } from "../lib/api";
import { resizeImage } from "../lib/resizepro";
import { ThinkingWave } from "./ThinkingWave";

interface GuideCoverBotProps {
    guide: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newCoverUrl: string) => void;
}

type ActiveTab = "chat" | "upload";
type ChatStep = "intro" | "generating" | "result";

export function GuideCoverBot({ guide, isOpen, onClose, onSuccess }: GuideCoverBotProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
    const [chatStep, setChatStep] = useState<ChatStep>("intro");
    const [prompt, setPrompt] = useState("");
    const [copied, setCopied] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [urlError, setUrlError] = useState("");
    const [autoResize, setAutoResize] = useState(true);
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            setActiveTab("chat");
            setChatStep("intro");
            setPrompt("");
            setImageUrl("");
            setUrlError("");
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [chatStep, prompt, activeTab]);

    if (!isOpen) return null;

    const isBusy = isFetchingUrl || isUploading;

    const handleGeneratePrompt = async () => {
        setChatStep("generating");
        try {
            const res = await fetch("/api/openrouter-cover-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: guide.title,
                    keywords: guide.keywords,
                    content: guide.content || guide.markdown || guide.html_content,
                }),
            });
            if (!res.ok) throw new Error("API error");
            const data = await res.json();
            setPrompt(data.prompt);
            setChatStep("result");
        } catch {
            toast.error("Failed to generate prompt. Please try again.");
            setChatStep("intro");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Prompt copied to clipboard");
    };

    const processImageBlob = async (blob: Blob, filename = "cover.jpg"): Promise<string> => {
        let finalBlob = blob;
        if (autoResize) {
            try {
                const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
                const resizedBlob = await resizeImage(file, {
                    width: 1200,
                    height: 675,
                    fitMode: "fill",
                    format: "image/jpeg",
                    quality: 92,
                });
                finalBlob = resizedBlob;
            } catch (err) {
                console.warn("Resize failed, using original:", err);
            }
        }
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(finalBlob);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        setIsUploading(true);
        const toastId = toast.loading(autoResize ? "Optimizing & uploading..." : "Processing image...");
        try {
            const base64 = await processImageBlob(file, file.name);
            await saveImageToGuide(base64, toastId);
        } catch {
            toast.error("Failed to process image.", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleUrlSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setUrlError("");
        const raw = imageUrl.trim();
        if (!raw) return;

        if (raw.includes("bing.com/images/create") || raw.includes("bing.com/images/search")) {
            setUrlError("Please provide a direct image link. Right-click the image on Bing and select 'Copy image address'.");
            return;
        }

        setIsFetchingUrl(true);
        const toastId = toast.loading("Downloading image from URL...");
        try {
            const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(raw)}`);
            if (!proxyRes.ok) throw new Error(`Proxy error ${proxyRes.status}`);
            const blob = await proxyRes.blob();
            const base64 = await processImageBlob(blob);
            await saveImageToGuide(base64, toastId);
            setImageUrl("");
        } catch (err) {
            console.error(err);
            toast.dismiss(toastId);
            setUrlError("Could not load this URL. Try uploading the file manually.");
        } finally {
            setIsFetchingUrl(false);
        }
    };

    const saveImageToGuide = async (base64: string, toastId: string | number) => {
        setIsUploading(true);
        toast.loading("Saving cover image to guide...", { id: toastId });
        try {
            const updated = await guidesApi.update(guide.id, { cover_image: base64 });
            if (updated) {
                toast.success("Cover image updated successfully! 🎉", { id: toastId });
                onSuccess(updated.cover_image || base64);
                onClose();
            } else {
                throw new Error("Update failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to save cover image.", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden">
            {/* Elegant Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-[12px] transition-opacity duration-500 ease-in-out" 
                onClick={onClose} 
            />
            
            {/* Main Modal Card */}
            <div className="relative w-full max-w-xl mx-4 bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] flex flex-col max-h-[85vh] border border-white/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300 ease-out">
                
                {/* Premium Header */}
                <div className="relative px-8 pt-8 pb-6 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100/60">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-[0_8px_20px_-4px_rgba(79,70,229,0.4)]">
                                    <Bot size={28} strokeWidth={2.5} />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Cover AI</h2>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em]">Professional Assistant</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100/50 rounded-2xl transition-all active:scale-90"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Engineering-Grade Tab Navigation */}
                <div className="px-8 mt-6">
                    <div className="flex p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
                        <button
                            onClick={() => setActiveTab("chat")}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-sm font-black rounded-[0.85rem] transition-all duration-200 ${activeTab === "chat"
                                ? "bg-white text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100"
                                : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Sparkles size={18} />
                            Smart Generator
                        </button>
                        <button
                            onClick={() => setActiveTab("upload")}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-sm font-black rounded-[0.85rem] transition-all duration-200 ${activeTab === "upload"
                                ? "bg-white text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100"
                                : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <Upload size={18} />
                            Direct Upload
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div 
                    ref={scrollAreaRef}
                    className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar"
                >
                    {activeTab === "chat" ? (
                        <div className="space-y-8">
                            <PremiumBotBubble>
                                <p className="text-slate-700 leading-relaxed font-medium text-base">
                                    I'm ready to craft a high-converting cover prompt for <span className="text-indigo-600 font-extrabold">{guide.title}</span>. Let's create something professional.
                                </p>
                            </PremiumBotBubble>

                            {chatStep === "intro" && (
                                <div className="flex justify-center pt-2">
                                    <button
                                        onClick={handleGeneratePrompt}
                                        className="group relative w-full py-5 bg-slate-900 hover:bg-black text-white font-black rounded-[1.25rem] shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 via-transparent to-purple-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <Sparkles size={20} className="text-indigo-400 group-hover:animate-pulse" />
                                        <span className="relative z-10">Generate Premium Prompt</span>
                                    </button>
                                </div>
                            )}

                            {chatStep === "generating" && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full"></div>
                                        <ThinkingWave text="Engineering your visual concept..." className="text-indigo-600 relative z-10" />
                                    </div>
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></div>
                                    </div>
                                </div>
                            )}

                            {chatStep === "result" && (
                                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
                                    <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 shadow-inner relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 p-1 opacity-10">
                                            <Sparkles size={80} />
                                        </div>
                                        <div className="flex justify-between items-center mb-5 relative z-10">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Optimized Prompt</p>
                                            <button
                                                onClick={handleCopy}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-600 rounded-xl hover:text-indigo-600 shadow-sm border border-slate-100 transition-all font-bold text-xs"
                                            >
                                                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                {copied ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                        <p className="text-slate-800 font-bold text-lg leading-relaxed relative z-10 italic">
                                            "{prompt}"
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-5">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
                                            <ImageIcon size={16} className="text-indigo-500" />
                                            Workflow Guide
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <ModernStep num="1" text="Copy the AI prompt above" />
                                            <ModernStep num="2" text={<>Generate on <a href="https://www.bing.com/images/create" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-black hover:underline">Bing Image Creator <ExternalLink size={12} className="inline mb-1" /></a></>} />
                                            <ModernStep num="3" text="Download and switch to the upload tab" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setActiveTab("upload")}
                                        className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.25rem] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl hover:bg-black"
                                    >
                                        <Upload size={20} />
                                        Open Upload Panel
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <p className="text-lg font-black text-slate-900 tracking-tight">Image Processor</p>
                                        <p className="text-xs font-bold text-slate-400">16:9 Cinema Aspect Ratio</p>
                                    </div>
                                    <button
                                        onClick={() => setAutoResize(!autoResize)}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${autoResize ? "bg-indigo-600 shadow-lg shadow-indigo-200" : "bg-slate-200"}`}
                                    >
                                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${autoResize ? "translate-x-7" : "translate-x-1"}`} />
                                    </button>
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    disabled={isBusy}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isBusy}
                                    className="w-full py-16 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600 rounded-[2rem] font-black text-sm transition-all flex flex-col items-center justify-center gap-5 group disabled:opacity-50"
                                >
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all shadow-sm">
                                        <Upload size={32} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-slate-900 font-black text-lg">Click to Upload</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">High Res JPG, PNG, WEBP</p>
                                    </div>
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-white px-6 text-slate-400 font-black tracking-[0.3em]">System Link</span>
                                </div>
                            </div>

                            <form onSubmit={handleUrlSubmit} className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                        <LinkIcon size={20} className="text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => { setImageUrl(e.target.value); setUrlError(""); }}
                                        placeholder="Paste direct image address..."
                                        className={`w-full pl-16 pr-6 py-5 bg-slate-50 border rounded-[1.25rem] text-base focus:outline-none focus:ring-4 transition-all font-bold text-slate-800 placeholder:text-slate-300 ${urlError
                                            ? "border-rose-200 focus:ring-rose-50"
                                            : "border-slate-100 focus:ring-indigo-50/50 focus:bg-white"}`}
                                        disabled={isBusy}
                                    />
                                </div>
                                {urlError && (
                                    <div className="flex items-center gap-3 text-rose-600 text-[11px] font-black p-5 bg-rose-50/50 rounded-2xl border border-rose-100 animate-in slide-in-from-top-2 duration-300">
                                        <AlertTriangle size={18} />
                                        <span>{urlError}</span>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={!imageUrl.trim() || isBusy}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] font-black text-lg shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {isFetchingUrl ? <Loader2 size={24} className="animate-spin" /> : <LinkIcon size={24} />}
                                    Apply Visual Link
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}

function PremiumBotBubble({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex gap-5 animate-in slide-in-from-left-6 duration-700">
            <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-xl border border-slate-800">
                <Bot size={22} className="text-white" />
            </div>
            <div className="relative flex-1 bg-white p-6 rounded-[2rem] rounded-tl-none border border-slate-100 text-slate-700 text-sm shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)]">
                <div className="absolute top-0 left-0 w-3 h-3 bg-white border-t border-l border-slate-100 -translate-x-1.5 -translate-y-1.5 rotate-45 hidden sm:block"></div>
                {children}
            </div>
        </div>
    );
}

function ModernStep({ num, text }: { num: string, text: React.ReactNode }) {
    return (
        <div className="flex items-center gap-5 group">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-black group-hover:scale-110 transition-transform">{num}</div>
            <p className="text-[13px] font-bold text-slate-600 leading-tight">{text}</p>
        </div>
    );
}
