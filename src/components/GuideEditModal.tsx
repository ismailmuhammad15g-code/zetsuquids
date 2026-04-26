"use client";
import { Edit2, Image as ImageIcon, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Guide, guidesApi } from "../lib/api";
import { uploadImageToImgBB } from "../lib/imgbb";

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
    const [saving, setSaving] = useState(false);
    const [coverImageError, setCoverImageError] = useState<string | null>(null);

    useEffect(() => {
        setTitle(guide.title || "");
        setKeywords((guide.keywords || []).join(", "));
        setCoverImage(guide.cover_image || "");
        setMarkdown(guide.markdown || guide.content || "");
        setHtmlContent(guide.html_content || "");
        setContentType(guide.content_type === "html" ? "html" : "markdown");
        setCoverImageError(null);
    }, [guide]);

    const handleCoverImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        try {
            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error("Failed to load image"));
                image.src = objectUrl;
            });

            const width = image.naturalWidth;
            const height = image.naturalHeight;
            URL.revokeObjectURL(objectUrl);

            const recommendedWidth = 1200;
            const recommendedHeight = 675;
            const aspectRatio = width / height;
            const recommendedRatio = 16 / 9;
            const ratioDiff = Math.abs(aspectRatio - recommendedRatio);
            const needsWarning =
                width < recommendedWidth ||
                height < recommendedHeight ||
                ratioDiff > 0.12;

            if (needsWarning) {
                setCoverImageError(
                    `Recommended size: ${recommendedWidth}x${recommendedHeight}px (16:9). Uploaded image is ${width}x${height}.`,
                );
            } else {
                setCoverImageError(null);
            }
        } catch (error) {
            console.error(error);
            setCoverImageError("Unable to verify image dimensions.");
            URL.revokeObjectURL(objectUrl);
        }

        try {
            const toastId = toast.loading("Uploading cover image...");
            const url = await uploadImageToImgBB(file);
            setCoverImage(url);
            toast.success("Cover uploaded successfully", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload cover image");
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
        <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2 text-gray-700 font-bold text-lg">
                            <Edit2 size={20} />
                            <span>Edit Guide</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Changes are saved as version history and tracked automatically.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label="Close edit modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6 p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-gray-700">
                            Title
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                placeholder="Guide title"
                            />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-gray-700">
                            Keywords
                            <input
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                                placeholder="react, tutorial, web-dev"
                            />
                        </label>
                    </div>

                    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Cover Image</p>
                                <p className="text-xs text-gray-500">
                                    Recommended 1200×675px, 16:9 ratio.
                                </p>
                            </div>
                            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black text-white text-sm font-medium cursor-pointer hover:bg-gray-900 transition-colors">
                                <ImageIcon size={16} />
                                Upload cover
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleCoverImageUpload}
                                />
                            </label>
                        </div>
                        {coverImageError && (
                            <p className="text-xs text-red-600">{coverImageError}</p>
                        )}
                        {coverImage ? (
                            <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
                                <img
                                    src={coverImage}
                                    alt="Cover preview"
                                    className="w-full h-52 object-cover"
                                />
                            </div>
                        ) : (
                            <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                                No cover image selected yet.
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => setContentType("markdown")}
                            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${contentType === "markdown"
                                    ? "bg-black text-white"
                                    : "border border-gray-300 text-gray-700 hover:border-black"
                                }`}
                        >
                            Markdown
                        </button>
                        <button
                            type="button"
                            onClick={() => setContentType("html")}
                            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${contentType === "html"
                                    ? "bg-black text-white"
                                    : "border border-gray-300 text-gray-700 hover:border-black"
                                }`}
                        >
                            Custom HTML
                        </button>
                    </div>

                    {contentType === "markdown" ? (
                        <label className="space-y-2 text-sm font-medium text-gray-700">
                            Markdown Content
                            <textarea
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                rows={10}
                                className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm font-mono outline-none focus:border-black resize-none"
                                placeholder="Write or paste markdown content here..."
                            />
                        </label>
                    ) : (
                        <label className="space-y-2 text-sm font-medium text-gray-700">
                            HTML Content
                            <textarea
                                value={htmlContent}
                                onChange={(e) => setHtmlContent(e.target.value)}
                                rows={10}
                                className="w-full rounded-3xl border border-gray-300 px-4 py-3 text-sm font-mono outline-none focus:border-black resize-none"
                                placeholder="Paste custom HTML content here..."
                            />
                        </label>
                    )}
                </div>

                <div className="flex flex-col gap-3 items-stretch px-6 pb-6 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!canSave || saving}
                        className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" /> Saving...
                            </span>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
