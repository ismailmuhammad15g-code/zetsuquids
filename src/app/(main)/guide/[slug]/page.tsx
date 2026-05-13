"use client";
import {
    ArrowLeft,
    Bot,
    Calendar,
    Check,
    ChevronDown,
    ChevronUp,
    Clock,
    Download,
    Edit2,
    ExternalLink,
    Eye,
    FileText,
    Languages,
    List,
    Loader2,
    Lock,
    Moon,
    MoreVertical,
    Search,
    Share2,
    Sparkles,
    Sun,
    Trash2,
    UserPlus,
    Volume2,
    VolumeX,
    X
} from "lucide-react";


import "highlight.js/styles/github-dark.css";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import ConfirmModal from "../../../../components/ConfirmModal";
import DownloadGuideModal from "../../../../components/DownloadGuideModal";
import FollowButton from "../../../../components/FollowButton";
import { GuideAIChat } from "../../../../components/GuideAIChat";
import GuideComments from "../../../../components/GuideComments";
import GuideEditModal from "../../../../components/GuideEditModal";
import GuideHistoryModal from "../../../../components/GuideHistoryModal";
import GuideInlineComments from "../../../../components/GuideInlineComment";
import GuideMarkdownRenderer from "../../../../components/GuideMarkdownRenderer";
import GuideRating from "../../../../components/GuideRating";
import GuideRecommendations from "../../../../components/GuideRecommendations";
import { GuideSummarizer } from "../../../../components/GuideSummarizer";
import GuideTimer from "../../../../components/GuideTimer";
import GuideTOC, { type TocItem } from "../../../../components/GuideTOC";
import { GuideTranslator } from "../../../../components/GuideTranslator";
import QuizComponent from "../../../../components/quiz/QuizComponent";
import SEOHelmet from "../../../../components/SEOHelmet";
import TextToSpeech from "../../../../components/TextToSpeech";
import { ScrollProgress } from "../../../../components/ui/scroll-progress";
import { useAuth } from "../../../../contexts/AuthContext";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useGuideInteraction } from "../../../../hooks/useGuideInteraction";
import { Guide, guidesApi } from "../../../../lib/api";
import { getAvatarForUser } from "../../../../lib/avatar";
import { supabase } from "../../../../lib/supabase";

import { GuideCoverBot } from "../../../../components/GuideCoverBot";

// Type definitions
// TableOfContentsItem is imported as TocItem from GuideTOC

interface InlineComment {
    id: string
    text: string
    position: number
}

interface ProcessedContent {
    type: "html" | "markdown"
    content: string
}


export default function GuidePage() {
    const params = useParams();
    const rawSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const slug = rawSlug ? decodeURIComponent(rawSlug) : "";
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPreviewMode = searchParams.get('preview') === 'true';
    const { user } = useAuth(); // Get current user

    // Track interactions for recommendations
    const { recordComment, recordGuideRead } = useGuideInteraction(slug);

    const [guide, setGuide] = useState<Guide | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [historyCount, setHistoryCount] = useState<number>(0);
    const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
    const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
    const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
    const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
    const { isDarkMode, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [inlineComments, setInlineComments] = useState<InlineComment[]>([]);
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const [viewsCount, setViewsCount] = useState<number>(0);
    const [hasRecordedView, setHasRecordedView] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [showAIChat, setShowAIChat] = useState<boolean>(false);
    const [showSummarizer, setShowSummarizer] = useState<boolean>(false);
    const [showTranslator, setShowTranslator] = useState<boolean>(false);
    const [aiToolsExpanded, setAiToolsExpanded] = useState<boolean>(false);
    const [showTOC, setShowTOC] = useState<boolean>(false);
    const [tableOfContents, setTableOfContents] = useState<TocItem[]>([]);
    // activeId is now handled internally by GuideTOC via IntersectionObserver
    const [contentWithAnchors, setContentWithAnchors] = useState<string | null>(null);
    const [showCoverBot, setShowCoverBot] = useState<boolean>(false);

    const moreMenuRef = useRef<HTMLDivElement>(null);
    const ttsRef = useRef<any>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search query for performance
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 400);
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);



    // Record guide read in localStorage for recommendation engine
    useEffect(() => {
        if (guide && !loading) {
            recordGuideRead({
                slug: guide.slug,
                title: guide.title,
                keywords: guide.keywords,
                user_email: guide.user_email,
            });
        }
    }, [guide?.slug, loading]);


    // Initialize Mermaid dynamically
    useEffect(() => {
        const initMermaid = async () => {
            try {
                const mermaidModule = await import("mermaid");
                mermaidModule.default.initialize({
                    startOnLoad: false,
                    theme: "default",
                    securityLevel: "loose",
                });
            } catch (error: unknown) {
                console.error("Failed to initialize Mermaid:", error);
            }
        };
        initMermaid();
    }, []);

    // Track view when user scrolls to bottom — throttled + passive
    useEffect(() => {
        if (!guide || hasRecordedView) return;

        let ticking = false;
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const scrollPercentage = (scrollTop + windowHeight) / documentHeight;
                if (scrollPercentage >= 0.85) {
                    recordView();
                }
                ticking = false;
            });
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [guide?.id, hasRecordedView]);

    // Fetch views count
    useEffect(() => {
        if (guide?.id) {
            fetchViewsCount();
        }
    }, [guide?.id]);

    /* Dark Mode handled by ThemeContext now
    // Handle Dark Mode
    // ... (Deleted local effect)
    */

    // Close More menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: Event) => {
            if (moreMenuRef.current && event.target && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };

        if (showMoreMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMoreMenu]);

    // Render Mermaid diagrams
    useEffect(() => {
        if (guide) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                const renderMermaid = async () => {
                    try {
                        const mermaidModule = await import("mermaid");
                        await mermaidModule.default.run({
                            querySelector: ".mermaid",
                        });
                    } catch (err) {
                        console.error("Mermaid failed to render:", err);
                        // Hide Mermaid blocks that fail to render to prevent visual issues
                        const mermaidBlocks = document.querySelectorAll(".mermaid");
                        mermaidBlocks.forEach((block: any) => {
                            block.style.display = "none";
                        });
                        toast.error("Failed to render diagram");
                    }
                };
                renderMermaid();
            }, 250);

            return () => clearTimeout(timer);
        }
    }, [guide]);

    // Process content — deps are primitives so no unnecessary re-runs
    const guideMarkdown = guide?.markdown ?? guide?.content ?? "";
    const guideHtmlContent = guide?.html_content ?? "";
    const guideContentType = guide?.content_type ?? "";

    const processedContent = useMemo((): ProcessedContent | null => {
        if (!guide) return null;

        if (
            guideContentType === "html" ||
            (guideHtmlContent && guideHtmlContent.trim())
        ) {
            const htmlContent = guideHtmlContent.trim();
            const isFullDocument =
                htmlContent.toLowerCase().includes("<!doctype") ||
                htmlContent.toLowerCase().includes("<html");

            const fullHTML = isFullDocument
                ? htmlContent
                : `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            padding: 20px;
            margin: 0;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
            return { type: "html", content: fullHTML };
        }

        let markdownContent = guideMarkdown;

        if (debouncedSearch && debouncedSearch.trim()) {
            const escaped = debouncedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escaped})`, "gi");
            markdownContent = markdownContent.replace(regex, '<mark class="bg-yellow-200 text-black font-bold px-1 rounded-sm">$1</mark>');
        }

        return { type: "markdown", content: markdownContent };
    }, [guideMarkdown, guideHtmlContent, guideContentType, debouncedSearch]);

    // Calculate reading time
    const readingTime = useMemo(() => {
        if (!guide) return 0;
        const content = guide.markdown || guide.content || "";
        const wordCount = content.trim().split(/\s+/).length;
        const readingTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min
        return readingTimeMinutes;
    }, [guide]);

    // Extract Table of Contents — only depends on markdown text (primitive)
    useEffect(() => {
        if (!guideMarkdown || guideContentType === "html" || (guideHtmlContent && guideHtmlContent.trim())) {
            setTableOfContents([]);
            setContentWithAnchors(null);
            return;
        }

        try {
            const headingRegex = /^(#{1,2})\s+(.+)$/gm;
            const tocItems: TocItem[] = [];
            const idMap = new Map<string, number>();
            let match;

            while ((match = headingRegex.exec(guideMarkdown)) !== null) {
                const level = match[1].length as 1 | 2;
                const text = match[2].trim().replace(/[*_`~\[\]]/g, "");
                let baseId = text
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-");
                
                let id = baseId;
                if (idMap.has(baseId)) {
                    const count = idMap.get(baseId)! + 1;
                    idMap.set(baseId, count);
                    id = `${baseId}-${count}`;
                } else {
                    idMap.set(baseId, 0); // first instance has no suffix usually, but rehype-slug uses -1 for the second instance. Wait, first is "id", second is "id-1" or "id-2"?
                    // Rehype-slug: first is `id`, second is `id-1`, third is `id-2`.
                }

                tocItems.push({ id, text, level });
            }

            setTableOfContents(tocItems);
            setContentWithAnchors(guideMarkdown);
        } catch (e) {
            // silent
        }
    }, [guideMarkdown, guideContentType, guideHtmlContent]);

    // Scroll Spy is now handled by GuideTOC component via IntersectionObserver

    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;

        const mediaNodes = Array.from(
            container.querySelectorAll("iframe, video"),
        ) as Array<HTMLIFrameElement | HTMLVideoElement>;

        const cleanupFns: Array<() => void> = [];

        mediaNodes.forEach((media) => {
            if (media.closest(".lazy-media-wrapper")) return;

            const wrapper = document.createElement("span");
            wrapper.className = "lazy-media-wrapper";
            wrapper.style.display = "block";
            wrapper.style.position = "relative";
            wrapper.style.overflow = "hidden";
            wrapper.style.borderRadius = "1rem";

            const originalParent = media.parentElement;
            if (!originalParent) return;

            originalParent.replaceChild(wrapper, media);
            wrapper.appendChild(media);

            const overlay = document.createElement("div");
            overlay.className = "lazy-media-overlay";
            overlay.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                        <line x1="7" y1="2" x2="7" y2="22"></line>
                        <line x1="17" y1="2" x2="17" y2="22"></line>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <line x1="2" y1="7" x2="7" y2="7"></line>
                        <line x1="2" y1="17" x2="7" y2="17"></line>
                        <line x1="17" y1="17" x2="22" y2="17"></line>
                        <line x1="17" y1="7" x2="22" y2="7"></line>
                    </svg>
                    <span style="font-size: 14px; font-weight: 500; font-family: sans-serif;">Loading Video...</span>
                </div>
            `;
            wrapper.appendChild(overlay);

            media.classList.add("lazy-media-loading");
            media.style.transition = "opacity .35s ease, filter .35s ease";
            if (media instanceof HTMLIFrameElement) {
                media.loading = "lazy";
                media.style.width = "100%";
                media.style.minHeight = "220px";
            } else if (media instanceof HTMLVideoElement) {
                media.preload = "metadata";
                media.muted = true;
                media.playsInline = true;
                media.style.width = "100%";
            }

            const onLoaded = () => {
                media.classList.remove("lazy-media-loading");
                media.classList.add("lazy-media-loaded");
                overlay.style.opacity = "0";
                setTimeout(() => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, 300);
            };

            const eventName = media instanceof HTMLIFrameElement ? "load" : "loadeddata";
            media.addEventListener(eventName, onLoaded);
            cleanupFns.push(() => {
                media.removeEventListener(eventName, onLoaded);
            });
        });

        return () => {
            cleanupFns.forEach((fn) => fn());
        };
    }, [contentWithAnchors, processedContent]);

    // Hydrate Interactive Quizzes — no hljs call (rehype-highlight handles it)
    useEffect(() => {
        const containers = document.querySelectorAll(".interactive-quiz-container");
        containers.forEach((container: any) => {
            if (container.getAttribute("data-hydrated") === "true") return;
            const encoded = container.getAttribute("data-quiz");
            if (!encoded) return;
            try {
                const json = decodeURIComponent(
                    atob(encoded).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""),
                );
                const data = JSON.parse(json);
                const root = createRoot(container);
                root.render(<QuizComponent data={data} />);
                container.setAttribute("data-hydrated", "true");
            } catch (e) {
                container.innerHTML = `<div class="p-4 bg-red-50 text-red-600 rounded">Failed to load quiz.</div>`;
            }
        });
    }, [guideMarkdown]);

    const loadGuide = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Try to find by slug first
            let guideData = null;

            // 1. Check AI Previews Storage FIRST (Dedicated key to avoid sync deletion)
            try {
                if (typeof window !== 'undefined') {
                    const aiPreviewsStr = localStorage.getItem("zetsuguide_ai_previews");
                    if (aiPreviewsStr) {
                        const aiPreviews = JSON.parse(aiPreviewsStr);
                        const match = aiPreviews.find((g: any) => g.slug === slug);
                        if (match) {
                            console.log("[GuidePage] Found guide in AI Previews:", slug);
                            guideData = match;
                        }
                    }
                }
            } catch (e) {
                console.error("[GuidePage] AI Previews load error:", e);
            }

            // 2. Fetch from API (Supabase + GitHub)
            if (!guideData) {
                try {
                    guideData = await guidesApi.getBySlug(slug as string);
                } catch (apiErr) {
                    console.error("[GuidePage] API load error:", apiErr);
                }
            }

            // 3. Check Standard LocalStorage (True Fallback if API fails or offline)
            if (!guideData || (!guideData.content && !guideData.markdown)) {
                try {
                    const localGuidesStr = typeof window !== 'undefined' ? localStorage.getItem("guides") : null;
                    if (localGuidesStr) {
                        const localGuides = JSON.parse(localGuidesStr);
                        const match = localGuides.find((g: any) => g.slug === slug);
                        // Only use local fallback if it has content, or if API completely failed
                        if (match && (match.content || match.markdown || !guideData)) {
                            console.log("[GuidePage] Using guide from local guides fallback:", slug);
                            // Merge to keep API metadata (like views) but use local content
                            guideData = guideData ? { ...guideData, ...match } : match;
                        }
                    }
                } catch (e) {
                    console.error("[GuidePage] Local guides fallback error:", e);
                }
            }

            // 4. If still not found by slug, try by ID (for backward compatibility)
            if (!guideData && slug && /^\d+$/.test(slug)) {
                guideData = await guidesApi.getById(parseInt(slug as string));
            }

            if (!guideData) {
                setError("Guide not found");
                return;
            }

            setGuide(guideData);

            try {
                const history = await guidesApi.getHistory(guideData.id!);
                setHistoryCount(history.length);
            } catch (err) {
                console.warn("Unable to load guide history count:", err);
                setHistoryCount(0);
            }

            // Fetch inline comments for text highlighting
            if (guideData.id) {
                try {
                    const { data: commentsData } = await supabase
                        .from('guide_inline_comments')
                        .select('*')
                        .eq('guide_id', guideData.id);

                    if (commentsData) {
                        setInlineComments(commentsData);
                        console.log('[GuidePage] Loaded inline comments:', commentsData.length);
                    }
                } catch (e) {
                    console.debug('[GuidePage] Inline comments fetch error:', e);
                }
            }

            // Fetch author avatar
            if (guideData.user_email) {
                try {
                    const { data: profileData, error: profileError } = await supabase
                        .from("zetsuguide_user_profiles")
                        .select("avatar_url")
                        .eq("user_email", guideData.user_email);

                    if (profileError) {
                        console.debug("[GuidePage] Profile fetch error:", profileError.message);
                    }

                    const avatarUrl = getAvatarForUser(
                        guideData.user_email,
                        profileData?.[0]?.avatar_url,
                    );
                    setAuthorAvatar(avatarUrl);
                } catch (err) {
                    console.debug("Error fetching author avatar:", (err as Error).message);
                    setAuthorAvatar(getAvatarForUser(guideData.user_email, null));
                }
            }
        } catch (err) {
            console.error("Error loading guide:", err);
            setError("Failed to load guide");
        } finally {
            setLoading(false);
        }
    }, [slug, isPreviewMode]);

    // Call loadGuide when slug changes
    useEffect(() => {
        loadGuide();
    }, [loadGuide]);

    async function fetchViewsCount() {
        try {
            const { data, error } = await supabase
                .from("guides")
                .select("views_count")
                .eq("id", guide?.id)
                .single();

            if (error) throw error;
            setViewsCount(data?.views_count || 0);
        } catch (err) {
            // If views_count column doesn't exist yet, default to 0
            console.log("Views count not available yet");
            setViewsCount(0);
        }
    }

    function toggleDarkMode() {
        toggleTheme();
    }

    async function recordView() {
        if (hasRecordedView || !guide?.id) return;

        try {
            // 🔒 SECURITY: Prevent author from viewing their own guide
            if (user?.id && guide.author_id && user.id === guide.author_id) {
                console.log(
                    "🔒 Security: Author cannot record views on their own guide",
                );
                setHasRecordedView(true);
                return;
            }

            // 🔒 SECURITY: Check if user already viewed this guide today
            const viewKey = `guide_view_${guide.id}_${user?.id || "anon"}`;
            const lastViewTime = localStorage.getItem(viewKey);
            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours

            if (lastViewTime) {
                const timeSinceLastView = now - parseInt(lastViewTime);
                if (timeSinceLastView < ONE_DAY) {
                    const hoursLeft = Math.ceil(
                        (ONE_DAY - timeSinceLastView) / (60 * 60 * 1000),
                    );
                    console.log(
                        `⏰ View already recorded. Next view allowed in ${hoursLeft} hours.`,
                    );
                    setHasRecordedView(true);
                    return;
                }
            }

            setHasRecordedView(true);

            // Generate session ID for anonymous users
            let sessionId = localStorage.getItem("guide_session_id");
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem("guide_session_id", sessionId);
            }

            const { error } = await supabase.from("guide_views").insert({
                guide_id: guide.id,
                user_id: user?.id || null,
                session_id: !user ? sessionId : null,
            });

            if (error) {
                // If duplicate or table doesn't exist, that's fine
                if (
                    !error.message?.includes("unique") &&
                    !error.message?.includes("does not exist") &&
                    !error.message?.includes("duplicate")
                ) {
                    console.log("View tracking not available yet");
                } else if (
                    error.message?.includes("unique") ||
                    error.message?.includes("duplicate")
                ) {
                    console.log("✅ View already recorded (database protection active)");
                }
            } else {
                // ✅ Success: Save timestamp and refresh count
                localStorage.setItem(viewKey, now.toString());
                setViewsCount((prev) => prev + 1);
                console.log("✅ View recorded successfully!");
            }
        } catch (err) {
            // Silently fail if views tracking is not set up yet
            console.log(
                "Error recording view (views tracking may not be enabled yet):",
                err instanceof Error ? err.message : String(err),
            );
            setHasRecordedView(false); // Allow retry
        }
    }

    function handleDeleteClick() {
        console.log("[GuidePage] Delete button clicked", {
            guide: guide?.id,
            user: user?.email,
        });

        if (!guide || !guide.user_email) {
            console.error("[GuidePage] Cannot delete: Guide has no owner", {
                guideId: guide?.id,
            });
            alert("Cannot delete legacy guides or guides without owner.");
            return;
        }

        if (guide.user_email !== user?.email) {
            console.error("[GuidePage] Cannot delete: User is not owner", {
                guideOwner: guide.user_email,
                currentUser: user?.email,
            });
            alert("You can only delete your own guides.");
            return;
        }

        console.log("[GuidePage] Opening delete confirmation modal");
        setShowDeleteConfirm(true);
    }

    async function handleDeleteConfirm() {
        console.log("[GuidePage] User confirmed deletion, proceeding...");

        if (!guide) return;
        setDeleting(true);
        console.log("[GuidePage] Starting deletion process...");

        try {
            await guidesApi.delete(guide.id!);
            console.log("[GuidePage] Guide deleted successfully!");

            // Show success toast
            toast.success("Guide deleted successfully!", {
                description: "The guide has been permanently removed.",
                duration: 3000,
            });

            // Close modal and navigate
            setShowDeleteConfirm(false);

            // Small delay to let user see the success message
            setTimeout(() => {
                console.log("[GuidePage] Navigating to /guides");
                router.push("/guides");
            }, 500);
        } catch (err) {
            console.error("[GuidePage] Deletion failed:", {
                error: err,
                message: err instanceof Error ? err.message : String(err),
                guideId: guide.id,
                userEmail: user?.email,
            });

            // Provide specific error messages
            let errorTitle = "Failed to delete guide";
            let errorMessage = "";

            if (err instanceof Error) {
                if ('code' in err && (err as any).code === "42501" || err.message?.includes("permission")) {
                    errorMessage =
                        "You do not have permission to delete this guide. Please check if you are the owner.";
                } else if (
                    err.message?.includes("network") ||
                    err.message?.includes("fetch")
                ) {
                    errorMessage =
                        "Network error. Please check your connection and try again.";
                } else {
                    errorMessage = err.message || "Unknown error occurred.";
                }
            } else {
                errorMessage = "Unknown error occurred.";
            }

            // Show error toast
            toast.error(errorTitle, {
                description: errorMessage,
                duration: 5000,
            });

            // Close modal on error too
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
            console.log("[GuidePage] Deletion process completed");
        }
    }

    function handleCopyLink() {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }



    // Memoized: inject inline comment spans into markdown
    const renderContentWithComments = useCallback((): JSX.Element | null => {
        if (!processedContent) return null;

        if (processedContent.type === "html") {
            return (
                <iframe
                    srcDoc={processedContent.content}
                    className="w-full min-h-[700px] bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                    title={guide?.title || "Guide Document"}
                    style={{ display: "block" }}
                />
            );
        }

        let md = contentWithAnchors || processedContent.content;
        inlineComments.forEach((comment: any) => {
            if (!comment.selected_text) return;
            const escaped = comment.selected_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escaped})`, 'gi');
            let isApproved = false;
            try {
                if (comment.position_json) {
                    const pos = typeof comment.position_json === 'string' ? JSON.parse(comment.position_json) : comment.position_json;
                    isApproved = !!pos.approved;
                }
            } catch (e) { }
            const bgClass = isApproved ? 'bg-blue-200/60' : 'bg-yellow-200/60';
            md = md.replace(regex, `<span id="comment-ghost-${comment.id}" class="relative ${bgClass} rounded px-0.5 cursor-pointer inline" data-comment-id="${comment.id}">$1</span>`);
        });

        return <div ref={contentRef}><GuideMarkdownRenderer content={md} /></div>;
    }, [processedContent, contentWithAnchors, inlineComments, guide?.title]);

    function renderContent(): JSX.Element | null {
        if (!processedContent) return null;

        if (processedContent.type === "html") {
            return (
                <iframe
                    srcDoc={processedContent.content}
                    className="w-full min-h-[700px] bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                    title={guide?.title || "Guide Document"}
                    style={{ display: "block" }}
                />
            );
        }

        return (
            <div ref={contentRef}>
                <GuideMarkdownRenderer content={contentWithAnchors || processedContent.content} />
            </div>
        );
    }
    // Check if admin is authenticated via sessionStorage in browser only
    useEffect(() => {
        if (typeof window !== "undefined" && window.sessionStorage) {
            const isSessionAdmin = window.sessionStorage.getItem("adminAuthenticated") === "true";
            const isSuperAdminEmail = user?.email?.toLowerCase() === "ismailmuhammad15g@gmail.com";
            setIsAdmin(isSessionAdmin || isSuperAdminEmail);
        }
    }, [user?.email]);

    // Robust check for ownership (case-insensitive)
    const isOwner =
        user?.email &&
        guide?.user_email &&
        (guide.user_email === user.email ||
            guide.user_email.toLowerCase() === user.email.toLowerCase());

    const handleGuideUpdated = async (updatedGuide: Guide) => {
        setGuide(updatedGuide);
        try {
            const history = await guidesApi.getHistory(updatedGuide.id!);
            setHistoryCount(history.length);
        } catch (err) {
            console.warn("Unable to refresh guide history count:", err);
        }
    };

    // (debug logging removed for performance)

    // Loading State
    if (loading) {
        return (
            <div className="bg-white dark:bg-black min-h-screen transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 animate-pulse">
                    {/* Main Content Column */}
                    <div className="flex-1 max-w-3xl w-full">
                        {/* Breadcrumbs Skeleton */}
                        <div className="flex items-center gap-2 mb-8">
                            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
                            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                        </div>

                        {/* Title Skeleton */}
                        <div className="space-y-3 mb-6">
                            <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                            <div className="h-10 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                        </div>

                        {/* Meta Row Skeleton */}
                        <div className="flex flex-wrap items-center gap-4 mb-8 py-4 border-y border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                </div>
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>
                            <div className="flex items-center gap-6">
                                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                            </div>
                        </div>

                        {/* Image/Cover Skeleton */}
                        <div className="w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl mb-10"></div>

                        {/* Content Skeleton */}
                        <div className="space-y-4">
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded"></div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                            <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-800 rounded"></div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded mt-6"></div>
                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                        </div>
                    </div>

                    {/* Sidebar TOC Skeleton */}
                    <div className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-24">
                            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded ml-4"></div>
                                <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-800 rounded ml-4"></div>
                                <div className="h-4 w-11/12 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !guide) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">😕</span>
                    </div>
                    <h1 className="text-2xl font-black mb-2">
                        {error || "Guide not found"}
                    </h1>
                    <p className="text-gray-500 mb-6">
                        The guide you're looking for doesn't exist or has been removed.
                    </p>
                    <Link
                        href="/guides"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-gray-800"
                    >
                        <ArrowLeft size={18} />
                        Back to Guides
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Dynamic SEO Meta Tags */}
            {guide && (
                <SEOHelmet
                    title={guide.title}
                    description={
                        guide.content
                            ? guide.content.substring(0, 150).replace(/[#*`]/g, "") + "..."
                            : "A comprehensive developer guide"
                    }
                    author={guide.author_name || guide.user_email?.split("@")[0]}
                    keywords={guide.keywords ? guide.keywords.join(", ") : ""}
                    type="article"
                />
            )}

            <div className="pointer-events-none fixed left-0 top-0 z-[100] w-full">
                {/* Backdrop Blur Effect */}
                <div className="absolute left-0 top-0 h-24 w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl [-webkit-mask-image:linear-gradient(to_bottom,black,transparent)]" />
                {/* Focus Mode Overlay */}
                {isFocusMode && (
                    <div className="fixed inset-0 z-[200] bg-white dark:bg-gray-900 pointer-events-auto overflow-y-auto animate-in fade-in duration-300">
                        <div className="max-w-3xl mx-auto px-6 py-12">
                            <button
                                onClick={() => setIsFocusMode(false)}
                                className="fixed top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 hover:text-white dark:text-gray-200 dark:hover:text-white rounded-full transition-all"
                                title="Exit Focus Mode"
                            >
                                <Eye size={24} />
                            </button>
                            <h1 className="text-4xl font-black mb-12 text-center text-black dark:text-white">
                                {guide.title}
                            </h1>
                            <div className="guide-content prose md:prose-xl max-w-none prose-headings:font-black prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white dark:prose-invert dark:prose-a:text-blue-400 dark:prose-code:bg-gray-800 dark:prose-pre:bg-gray-800">
                                {renderContent()}
                            </div>
                            <div className="mt-20 text-center text-gray-400 dark:text-gray-500 text-sm">
                                End of focus mode
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Track */}
                <div className="absolute left-0 top-0 w-full">
                    <div className="absolute left-0 top-0 h-1 w-full bg-gray-200/30 dark:bg-gray-700/30" />
                    <ScrollProgress
                        className="absolute top-0 h-1 bg-[linear-gradient(to_right,rgba(0,0,0,0),#000000_75%,#000000_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0),#ffffff_75%,#ffffff_100%)]"
                        springOptions={{ stiffness: 280, damping: 18 }}
                    />
                </div>
            </div>
            <article className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 bg-white dark:bg-gray-900 text-black dark:text-white">
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    {/* ── Left Column: Main Content ── */}
                    <div className="flex-1 min-w-0 max-w-[800px] w-full mx-auto lg:mx-0">
                        {/* Real-time Usage Timer */}
                        <div className="hidden">
                            {user && guide && <GuideTimer guideId={guide.id} userId={user.id} />}
                        </div>

                        {/* Breadcrumbs Navigation */}
                        <div className="mb-6">
                            <Breadcrumbs
                                dividerType="chevron"
                                items={[
                                    { href: "/", label: "Home" },
                                    { href: "/guides", label: "Blog" },
                                    { href: "#", label: guide.title },
                                ]}
                            />
                        </div>

                        {/* Header Section */}
                        <header className="mb-10">
                            {/* Sign Up Banner for Guest Users */}
                            {!user && (
                                <div className="mb-8 p-6 bg-black text-white border-2 border-gray-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                                        <div>
                                            <h3 className="text-xl font-black mb-2 flex items-center justify-center sm:justify-start gap-2">
                                                <UserPlus size={24} className="text-white" />
                                                Join ZetsuGuide Community
                                            </h3>
                                            <p className="text-gray-300 max-w-lg">
                                                Sign up now to unlock exclusive features: Follow authors,
                                                save guides to your profile, comment, and create your own
                                                content!
                                            </p>
                                        </div>
                                        <Link
                                            href="/auth"
                                            className="px-8 py-3 bg-white text-black font-black text-lg border-2 border-transparent hover:border-black hover:bg-gray-200 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                                        >
                                            Join Now
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Premium Guide Cover Image */}
                            {guide.cover_image && (
                                <div className="mb-8 w-full group">
                                    <div className="aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-800 transition-all duration-300">
                                        <img
                                            src={guide.cover_image}
                                            alt={guide.title}
                                            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Meta Badges/Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                {guide.category && (
                                    <span className="px-3 py-1 bg-white text-gray-700 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:text-gray-300 font-semibold text-xs tracking-wider uppercase rounded-full shadow-sm hover:shadow-md transition-shadow">
                                        {guide.category}
                                    </span>
                                )}
                                {guide.keywords && guide.keywords.length > 0 && guide.keywords.map((kw, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-white text-gray-700 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 dark:text-gray-300 font-semibold text-xs tracking-wider uppercase rounded-full shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] text-black dark:text-white tracking-tight">
                                {guide.title}
                            </h1>

                            <style>{`
            @keyframes shimmer-wave {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            /* Temporary highlight applied when navigating from TOC */
            .toc-highlight {
              background-color: rgba(37, 99, 235, 0.15);
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.1), inset 0 0 0 1px rgba(37, 99, 235, 0.2);
              border-radius: 0.5rem;
              position: relative;
              z-index: 10;
            }
            .dark .toc-highlight {
              background-color: rgba(96, 165, 250, 0.2);
              box-shadow: 0 0 0 8px rgba(96, 165, 250, 0.15), inset 0 0 0 1px rgba(96, 165, 250, 0.3);
            }
            .lazy-media-wrapper {
              position: relative;
              overflow: hidden;
              border-radius: 1rem;
              min-height: 250px;
            }
            .lazy-media-wrapper iframe,
            .lazy-media-wrapper video {
              width: 100%;
              height: 100%;
              display: block;
              opacity: 0;
              transition: opacity 0.35s ease;
            }
            .lazy-media-wrapper .lazy-media-loaded {
              opacity: 1 !important;
            }
            .lazy-media-overlay {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px dashed rgba(156, 163, 175, 0.4);
              border-radius: 1rem;
              background: transparent;
              color: rgba(156, 163, 175, 0.8);
              transition: opacity 0.3s ease;
              pointer-events: none;
            }
            .dark .lazy-media-overlay {
              border-color: rgba(75, 85, 99, 0.4);
              color: rgba(107, 114, 128, 0.8);
            }
            @keyframes pulse-slow {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>

                            {/* Meta & Author info in a clean flex layout */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-y border-gray-200 dark:border-gray-800 mb-8">
                                {/* Left side: Author */}
                                <div className="flex items-center gap-4">
                                    {authorAvatar ? (
                                        <img
                                            src={authorAvatar}
                                            alt={guide.author_name || "Author"}
                                            className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-200 dark:border-gray-800"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                            {(guide.author_name || guide.user_email || "A")?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                                            {guide.author_name || (guide.user_email ? guide.user_email.split("@")[0] : "Anonymous")}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(guide.created_at || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                                            {readingTime > 0 && <><span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span><span className="flex items-center gap-1"><Clock size={14} /> {readingTime} min read</span></>}
                                            {viewsCount > 0 && (
                                                <><span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span><span className="flex items-center gap-1"><Eye size={14} /> {viewsCount.toLocaleString()} views</span></>
                                            )}
                                            {historyCount > 0 && (
                                                <><span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span><span className="flex items-center gap-1"><Edit2 size={14} /> {historyCount} changes</span></>
                                            )}
                                            {guide.content_type === "html" && (
                                                <><span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span><span className="flex items-center gap-1"><ExternalLink size={14} /> HTML/CSS</span></>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right side: Actions & Follow */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    {guide.user_email && (
                                        <FollowButton
                                            targetUserEmail={guide.user_email}
                                            targetUserName={guide.author_name || guide.user_email.split("@")[0]}
                                        />
                                    )}
                                    {guide.user_email && (
                                        <Link
                                            href={`/@${(guide.author_name || guide.user_email.split("@")[0]).toLowerCase()}/workspace`}
                                            className="px-4 py-2 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md shadow-sm text-center"
                                        >
                                            View Profile
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Old Cover Image placement removed */}

                            {/* Table of Contents Button (mobile only) */}
                            {tableOfContents.length > 0 && (
                                <div className="mb-8 lg:hidden">
                                    <button
                                        onClick={() => setShowTOC(!showTOC)}
                                        className="flex items-center justify-between w-full gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm"
                                        aria-expanded={showTOC}
                                        aria-label="Toggle table of contents"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <List size={18} className="text-gray-500" />
                                            On This Page
                                        </span>
                                        <ChevronDown
                                            size={18}
                                            className={`text-gray-500 transition-transform duration-300 ${showTOC ? "rotate-180" : ""}`}
                                        />
                                    </button>

                                    {/* Table of Contents Dropdown */}
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${showTOC ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}
                                    >
                                        <div className="p-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-y-auto max-h-[400px]">
                                            <GuideTOC items={tableOfContents} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {!isPreviewMode && (
                                <div className="flex flex-wrap gap-2">
                                    {/* Save/Download Button - Available to all users */}
                                    <button
                                        onClick={() => setShowDownloadModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-black hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        <Download size={16} />
                                        Save
                                    </button>

                                    <button
                                        onClick={handleCopyLink}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-black transition-colors text-sm"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={16} className="text-green-600" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Share2 size={16} />
                                                Share
                                            </>
                                        )}
                                    </button>

                                    {/* More Menu */}
                                    <div className="relative" ref={moreMenuRef}>
                                        <button
                                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-black transition-colors text-sm"
                                        >
                                            <MoreVertical size={16} />
                                            More
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showMoreMenu && (
                                            <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                {/* Guest Actions */}
                                                {!user && (
                                                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                                                        <p className="text-xs font-bold text-gray-500 px-2 mb-2 uppercase tracking-wide">
                                                            Join Community
                                                        </p>
                                                        <Link
                                                            href="/auth"
                                                            className="w-full text-left px-3 py-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-sm flex items-center gap-3 font-medium text-gray-700 hover:text-black mb-1"
                                                        >
                                                            <UserPlus size={16} />
                                                            Sign Up Free
                                                        </Link>
                                                        <Link
                                                            href="/auth?mode=login"
                                                            className="w-full text-left px-3 py-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-sm flex items-center gap-3 font-medium text-gray-700 hover:text-black"
                                                        >
                                                            <Lock size={16} />
                                                            Login to Interact
                                                        </Link>
                                                    </div>
                                                )}

                                                {/* Text-to-Speech Button */}
                                                {guide.content && (
                                                    <button
                                                        onClick={() => {
                                                            if (ttsRef.current) {
                                                                if (isPlayingTTS) {
                                                                    ttsRef.current.stopSpeech();
                                                                    setIsPlayingTTS(false);
                                                                } else {
                                                                    ttsRef.current.startSpeech();
                                                                    setIsPlayingTTS(true);
                                                                }
                                                                setShowMoreMenu(false);
                                                            }
                                                        }}
                                                        className={
                                                            isPlayingTTS
                                                                ? "w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-sm flex items-center gap-3 font-medium text-red-600 border-b border-gray-100"
                                                                : "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm flex items-center gap-3 font-medium text-gray-700 hover:text-black border-b border-gray-100"
                                                        }
                                                        title={
                                                            isPlayingTTS ? "Stop listening" : "Listen to this guide"
                                                        }
                                                    >
                                                        {isPlayingTTS ? (
                                                            <VolumeX size={16} />
                                                        ) : (
                                                            <Volume2 size={16} />
                                                        )}
                                                        {isPlayingTTS ? "Stop Listening" : "Listen to Guide"}
                                                    </button>
                                                )}

                                                {/* Dark Mode Toggle - NEW FEATURE */}
                                                <button
                                                    onClick={() => {
                                                        toggleDarkMode();
                                                        setShowMoreMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-sm flex items-center gap-3 font-medium text-blue-600 border-b border-gray-100"
                                                >
                                                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                                                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                                                </button>

                                                {/* Focus Mode Button - NEW FEATURE */}
                                                <button
                                                    onClick={() => {
                                                        setIsFocusMode(true);
                                                        setShowMoreMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors text-sm flex items-center gap-3 font-medium text-purple-600 border-b border-gray-100"
                                                >
                                                    <Eye size={16} />
                                                    Enter Focus Mode
                                                </button>

                                                {/* AI Tools Section */}
                                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                                                    <button
                                                        onClick={() => setAiToolsExpanded(!aiToolsExpanded)}
                                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-100/50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles size={16} className="text-purple-600" />
                                                            <p className="text-sm font-bold text-purple-700 uppercase tracking-wide">
                                                                AI Tools
                                                            </p>
                                                        </div>
                                                        {aiToolsExpanded ? (
                                                            <ChevronUp size={16} className="text-purple-600" />
                                                        ) : (
                                                            <ChevronDown size={16} className="text-purple-600" />
                                                        )}
                                                    </button>

                                                    {aiToolsExpanded && (
                                                        <div className="px-2 pb-2">
                                                            <button
                                                                onClick={() => {
                                                                    setShowSummarizer(true);
                                                                    setShowMoreMenu(false);
                                                                }}
                                                                className="w-full text-left px-3 py-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-sm flex items-center gap-3 font-medium text-gray-700 hover:text-purple-600 mb-1"
                                                            >
                                                                <FileText size={16} />
                                                                <div className="flex-1">
                                                                    <div className="font-bold">Guide Summarizer</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        1 FREE trial
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setShowAIChat(true);
                                                                    setShowMoreMenu(false);
                                                                }}
                                                                className="w-full text-left px-3 py-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-sm flex items-center gap-3 font-medium text-gray-700 hover:text-purple-600 mb-1"
                                                            >
                                                                <Bot size={16} />
                                                                <div className="flex-1">
                                                                    <div className="font-bold">Ask Guide</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        2 credits/question
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setShowTranslator(true);
                                                                    setShowMoreMenu(false);
                                                                }}
                                                                className="w-full text-left px-3 py-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-sm flex items-center gap-3 font-medium text-gray-700 hover:text-purple-600"
                                                            >
                                                                <Languages size={16} />
                                                                <div className="flex-1">
                                                                    <div className="font-bold">Translator</div>
                                                                    <div className="text-xs text-gray-500">FREE</div>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Owner/Admin Actions */}
                                                {(isOwner || isAdmin) && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setShowEditModal(true);
                                                                setShowMoreMenu(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm flex items-center gap-3 font-medium text-gray-700 hover:text-black border-b border-gray-100"
                                                        >
                                                            <Edit2 size={16} />
                                                            Edit Guide
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowHistory(true);
                                                                setShowMoreMenu(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm flex items-center gap-3 font-medium text-gray-700 hover:text-black border-b border-gray-100"
                                                        >
                                                            <Clock size={16} />
                                                            History
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                handleDeleteClick();
                                                                setShowMoreMenu(false);
                                                            }}
                                                            disabled={deleting}
                                                            className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 transition-colors text-sm flex items-center gap-3 font-medium disabled:opacity-50"
                                                        >
                                                            {deleting ? (
                                                                <Loader2 size={16} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </header>

                        {/* Search Bar */}
                        <div className="mb-8">
                            <div className="flex w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors group">
                                <div className="flex-1 bg-white dark:bg-gray-800 flex items-center px-4 group-focus-within:ring-2 group-focus-within:ring-blue-500 group-focus-within:ring-inset">
                                    <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                                    <input
                                        className="w-full py-2.5 outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 bg-transparent text-sm"
                                        placeholder="Search in guide..."
                                        value={searchQuery}
                                        onChange={(e: any) => setSearchQuery(e.target.value)}
                                        aria-label="Search in guide"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                            aria-label="Clear search"
                                        >
                                            <X size={14} className="text-gray-400" />
                                        </button>
                                    )}
                                </div>
                                <button className="bg-gray-900 dark:bg-white dark:text-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors flex-shrink-0">
                                    Search
                                </button>
                            </div>
                            {debouncedSearch && (
                                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                                    Searching: <span className="font-medium text-gray-600 dark:text-gray-300">"{debouncedSearch}"</span>
                                </p>
                            )}
                        </div>

                        {/* Guide Content */}
                        {inlineComments.length > 0 ? renderContentWithComments() : renderContent()}

                        {/* Inline Comments */}
                        {!isPreviewMode && (
                            <GuideInlineComments
                                guideId={guide.id!}
                                isGuideOwner={!!isOwner}
                                onCommentsUpdated={loadGuide}
                                commentCount={0}
                                onCommentCountChange={() => { }}
                            />
                        )}

                        {/* Comments */}
                        {!isPreviewMode && (
                            <GuideComments guideId={String(guide.id)} onCommentPosted={recordComment} />
                        )}

                        {/* Recommendations */}
                        {!isPreviewMode && (
                            <div className="mt-16 mb-12">
                                <GuideRecommendations
                                    currentGuideSlug={slug}
                                    currentGuideKeywords={guide.keywords}
                                    currentGuideAuthor={guide.user_email}
                                    limit={3}
                                />
                            </div>
                        )}

                        {/* Bottom Nav */}
                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <Link
                                href="/guides"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white dark:text-black text-white text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors rounded-lg"
                            >
                                <ArrowLeft size={16} />
                                Back to Guides
                            </Link>
                        </div>
                    </div>

                    {/* ── Right Column: Sticky TOC ── */}
                    <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
                        {tableOfContents.length > 0 && <GuideTOC items={tableOfContents} />}
                    </aside>
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={showDeleteConfirm}
                    onClose={() => {
                        console.log("[GuidePage] Delete modal closed without confirmation");
                        setShowDeleteConfirm(false);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Guide?"
                    message="Are you sure you want to delete this guide? This action cannot be undone and all content will be permanently removed."
                    confirmText="Yes, Delete"
                    cancelText="Cancel"
                />

                {/* Edit Modal */}
                {showEditModal && guide && (
                    <GuideEditModal
                        guide={guide}
                        onClose={() => setShowEditModal(false)}
                        onSaved={handleGuideUpdated}
                    />
                )}

                {/* History Modal */}
                {showHistory && (
                    <GuideHistoryModal
                        guideId={String(guide.id)}
                        onClose={() => setShowHistory(false)}
                    />
                )}

                {/* Download Modal */}
                {showDownloadModal && (
                    <DownloadGuideModal
                        guide={guide}
                        authorName={
                            guide.author_name ||
                            guide.user_email?.split("@")[0] ||
                            "Unknown Author"
                        }
                        onClose={() => setShowDownloadModal(false)}
                    />
                )}

                {/* Text-to-Speech Component (Permanently Mounted) */}
                {guide && guide.content && (
                    <TextToSpeech
                        ref={ttsRef}
                        content={guide.content}
                        title={guide.title}
                        hideButton={true}
                        onClose={() => setIsPlayingTTS(false)}
                    />
                )}
                {/* Guide Rating System */}
                {guide && !isPreviewMode && (
                    <GuideRating
                        guideId={String(guide.id)}
                        authorId={guide.author_id!}
                        guideTitle={guide.title || "Untitled Guide"}
                    />
                )}

                {/* AI Tools Modals */}
                {guide && (
                    <>
                        <GuideAIChat
                            guide={guide}
                            isOpen={showAIChat}
                            onClose={() => setShowAIChat(false)}
                        />
                        <GuideSummarizer
                            guide={guide}
                            isOpen={showSummarizer}
                            onClose={() => setShowSummarizer(false)}
                        />
                        <GuideTranslator
                            guide={guide}
                            isOpen={showTranslator}
                            onClose={() => setShowTranslator(false)}
                        />
                    </>
                )}
            </article>

            {/* Scroll to Top Button */}
            <ScrollToTopButton />

            {/* AI Cover Image Generator Bot Floating Button */}
            {guide && !guide.cover_image && (isOwner || isAdmin) && (
                <button
                    onClick={() => setShowCoverBot(true)}
                    className="fixed bottom-24 right-8 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-all z-50 overflow-hidden border-2 border-white group"
                    title="Generate Cover Image"
                >
                    <img
                        src="/images/noimagecoverHint.png"
                        alt="No cover image hint"
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </button>
            )}

            {/* AI Cover Image Bot Modal */}
            {guide && (
                <GuideCoverBot
                    guide={guide}
                    isOpen={showCoverBot}
                    onClose={() => setShowCoverBot(false)}
                    onSuccess={(newCoverUrl) => {
                        setGuide({ ...guide, cover_image: newCoverUrl });
                        setShowCoverBot(false);
                    }}
                />
            )}
        </>
    );
}

// Scroll to Top Button Component
function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            setIsVisible(window.scrollY > 300);
        };
        window.addEventListener("scroll", toggleVisibility, { passive: true });
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-110 transition-transform z-50"
            aria-label="Scroll to top"
        >
            <ChevronUp size={24} />
        </button>
    );
}
