import {
  ArrowLeft,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Languages,
  Loader2,
  Lock,
  Mail,
  MoreVertical,
  Search,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { marked } from "marked";
import mermaid from "mermaid";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import Breadcrumbs from "../components/Breadcrumbs";
import ConfirmModal from "../components/ConfirmModal";
import DownloadGuideModal from "../components/DownloadGuideModal";
import FollowButton from "../components/FollowButton";
import { GuideAIChat } from "../components/GuideAIChat";
import GuideComments from "../components/GuideComments";
import GuideHistoryModal from "../components/GuideHistoryModal";
import GuideRating from "../components/GuideRating";
import GuideRecommendations from "../components/GuideRecommendations";
import { GuideSummarizer } from "../components/GuideSummarizer";
import GuideTimer from "../components/GuideTimer";
import { GuideTranslator } from "../components/GuideTranslator";
import QuizComponent from "../components/quiz/QuizComponent";
import SEOHelmet from "../components/SEOHelmet";
import TextToSpeech from "../components/TextToSpeech";
import { ScrollProgress } from "../components/ui/scroll-progress";
import { useAuth } from "../contexts/AuthContext";
import { useGuideInteraction } from "../hooks/useGuideInteraction";
import { guidesApi } from "../lib/api";
import { getAvatarForUser } from "../lib/avatar";
import { supabase } from "../lib/supabase";
import { sanitizeContent } from "../lib/utils";

// Configure marked
const renderer = {
  code(code, language) {
    // Handle newer marked versions passing object
    let text = code;
    let lang = language;

    if (typeof code === "object" && code !== null) {
      text = code.text || "";
      lang = code.lang || "";
    }

    // Ensure text is a string
    text = String(text || "");

    if (
      lang === "mermaid" ||
      text.trim().startsWith("graph ") ||
      text.trim().startsWith("sequenceDiagram") ||
      text.trim().startsWith("classDiagram") ||
      text.trim().startsWith("stateDiagram") ||
      text.trim().startsWith("erDiagram") ||
      text.trim().startsWith("gantt") ||
      text.trim().startsWith("pie") ||
      text.trim().startsWith("flowchart")
    ) {
      return `<pre class="mermaid">${text}</pre>`;
    }

    if (lang === "quiz") {
      try {
        const jsonStr = typeof code === "object" ? code.text : code;
        // Secure encoding for data attribute
        const encoded = btoa(
          encodeURIComponent(jsonStr).replace(
            /%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
              return String.fromCharCode("0x" + p1);
            },
          ),
        );
        return `<div class="interactive-quiz-container my-8" data-quiz="${encoded}"></div>`;
      } catch (e) {
        console.error("Quiz encoding error", e);
        return `<pre class="bg-red-50 text-red-600 p-4 rounded border border-red-200">Error rendering quiz</pre>`;
      }
    }

    // Manual fallback for normal code blocks to avoid renderer recursion issues
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    if (!lang) {
      return `<pre><code>${escapedText}</code></pre>`;
    }

    const langClass = `language-${lang}`;
    return `<pre><code class="${langClass}">${escapedText}</code></pre>`;
  },
};

marked.use({ renderer });
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
});

export default function GuidePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user

  // Track interactions for recommendations
  const { recordComment, recordRate } = useGuideInteraction(slug);

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false); // New Feature: Focus Mode
  const [searchQuery, setSearchQuery] = useState("");
  const [viewsCount, setViewsCount] = useState(0);
  const [hasRecordedView, setHasRecordedView] = useState(false);
  // AI Tools Modals
  const [showAIChat, setShowAIChat] = useState(false);
  const [showSummarizer, setShowSummarizer] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [aiToolsExpanded, setAiToolsExpanded] = useState(false);
  const moreMenuRef = useRef(null);
  const ttsRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    loadGuide();
  }, [slug]);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "default" });
  }, []);

  // Track view when user scrolls to bottom
  useEffect(() => {
    if (!guide || hasRecordedView) return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollPercentage = (scrollTop + windowHeight) / documentHeight;

      // If user scrolled 85% or more, record view
      if (scrollPercentage >= 0.85 && !hasRecordedView) {
        recordView();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [guide, hasRecordedView]);

  // Fetch views count
  useEffect(() => {
    if (guide?.id) {
      fetchViewsCount();
    }
  }, [guide?.id]);

  // Close More menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  useEffect(() => {
    if (guide) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const timer = setTimeout(async () => {
          try {
            // Reset mermaid to default before running to clear any bad state
            mermaid.initialize({
              startOnLoad: false,
              theme: "default",
              securityLevel: "loose",
              flowchart: { htmlLabels: true },
              failOnError: false,
              suppressErrorRendering: true // Suppress the ugly error box
            });

            await mermaid.run({
              querySelector: ".mermaid",
            });
          } catch (err) {
            // Suppress the "Could not find a suitable point" error which is a known Mermaid bug
            if (!err.message?.includes("suitable point")) {
              console.error("Mermaid failed to render:", err);
            }
          }
        }, 500); // Increased delay slightly to ensures fonts/styles are loaded
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [guide]);

  // Process content with memoization to avoid Hook violations and performance issues
  const processedContent = useMemo(() => {
    if (!guide) return null;

    // 1. Handle HTML Content Type
    if (
      guide.content_type === "html" ||
      (guide.html_content && guide.html_content.trim())
    ) {
      const htmlContent = guide.html_content?.trim() || "";
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

    // 2. Handle Markdown Content
    const markdownContent = guide.markdown || guide.content || "";
    const html = marked.parse(markdownContent);
    const sanitizedHtml = sanitizeContent(html);

    // Apply Search Highlighting
    if (!searchQuery || !searchQuery.trim()) {
      return { type: "markdown", content: sanitizedHtml };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizedHtml, "text/html");
      const walker = document.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT,
        null,
        false,
      );
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      const regex = new RegExp(
        `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
      );

      nodes.forEach((node) => {
        if (node.nodeValue && regex.test(node.nodeValue)) {
          const fragment = document.createDocumentFragment();
          const parts = node.nodeValue.split(regex);
          parts.forEach((part) => {
            if (regex.test(part)) {
              const mark = document.createElement("mark");
              mark.className =
                "bg-yellow-200 text-black font-bold px-1 rounded-sm";
              mark.textContent = part;
              fragment.appendChild(mark);
            } else {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          node.parentNode.replaceChild(fragment, node);
        }
      });
      return { type: "markdown", content: doc.body.innerHTML };
    } catch (e) {
      console.error("Highlight error:", e);
      return { type: "markdown", content: sanitizedHtml };
    }
  }, [guide, searchQuery]);

  // Hydrate Interactive Quizzes
  useEffect(() => {
    const containers = document.querySelectorAll(".interactive-quiz-container");
    containers.forEach((container) => {
      if (container.getAttribute("data-hydrated") === "true") return;

      const encoded = container.getAttribute("data-quiz");
      if (!encoded) return;

      try {
        const json = decodeURIComponent(
          atob(encoded)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
        );

        const data = JSON.parse(json);
        const root = createRoot(container);
        root.render(<QuizComponent data={data} />);
        container.setAttribute("data-hydrated", "true");
      } catch (e) {
        console.error("Quiz hydration error:", e);
        container.innerHTML = `<div class="p-4 bg-red-50 text-red-600 rounded">Failed to load quiz.</div>`;
      }
    });
  }, [guide, processedContent]);

  async function loadGuide() {
    try {
      setLoading(true);
      setError(null);

      // Try to find by slug first
      let guideData = await guidesApi.getBySlug(slug);

      // If not found by slug, try by ID (for backward compatibility)
      if (!guideData && /^\d+$/.test(slug)) {
        guideData = await guidesApi.getById(parseInt(slug));
      }

      if (!guideData) {
        setError("Guide not found");
        return;
      }

      setGuide(guideData);

      // Fetch author avatar
      if (guideData.user_email) {
        try {
          const { data: profileData } = await supabase
            .from("zetsuguide_user_profiles")
            .select("avatar_url")
            .eq("user_email", guideData.user_email)
            .maybeSingle();

          const avatarUrl = getAvatarForUser(
            guideData.user_email,
            profileData?.avatar_url,
          );
          setAuthorAvatar(avatarUrl);
        } catch (err) {
          console.error("Error fetching author avatar:", err);
          // Fallback to deterministic avatar
          setAuthorAvatar(getAvatarForUser(guideData.user_email, null));
        }
      }
    } catch (err) {
      console.error("Error loading guide:", err);
      setError("Failed to load guide");
    } finally {
      setLoading(false);
    }
  }

  async function fetchViewsCount() {
    try {
      const { data, error } = await supabase
        .from("guides")
        .select("views_count")
        .eq("id", guide.id)
        .single();

      if (error) throw error;
      setViewsCount(data?.views_count || 0);
    } catch (err) {
      // If views_count column doesn't exist yet, default to 0
      console.log("Views count not available yet");
      setViewsCount(0);
    }
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
        err.message,
      );
      setHasRecordedView(false); // Allow retry
    }
  }

  function handleDeleteClick() {
    console.log("[GuidePage] Delete button clicked", {
      guide: guide?.id,
      user: user?.email,
    });

    if (!guide.user_email) {
      console.error("[GuidePage] Cannot delete: Guide has no owner", {
        guideId: guide.id,
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

    setDeleting(true);
    console.log("[GuidePage] Starting deletion process...");

    try {
      await guidesApi.delete(guide.id);
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
        navigate("/guides");
      }, 500);
    } catch (err) {
      console.error("[GuidePage] Deletion failed:", {
        error: err,
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        guideId: guide.id,
        userEmail: user?.email,
      });

      // Provide specific error messages
      let errorTitle = "Failed to delete guide";
      let errorMessage = "";

      if (err.code === "42501" || err.message?.includes("permission")) {
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

  // Render content based on processed data
  function renderContent() {
    if (!processedContent) return null;

    if (processedContent.type === "html") {
      return (
        <iframe
          srcDoc={processedContent.content}
          className="w-full min-h-[700px] border-2 border-black bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          title={guide.title}
          style={{ display: "block" }}
        />
      );
    }

    return (
      <div
        className="prose md:prose-lg max-w-none prose-headings:font-black prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white"
        dangerouslySetInnerHTML={{ __html: processedContent.content }}
      />
    );
  }
  // Check if admin is authenticated via sessionStorage
  const isAdmin = sessionStorage.getItem("adminAuthenticated") === "true";

  // Robust check for ownership (case-insensitive)
  const isOwner =
    user?.email &&
    guide?.user_email &&
    (guide.user_email === user.email ||
      guide.user_email.toLowerCase() === user.email.toLowerCase());

  // Debug permissions
  useEffect(() => {
    if (guide) {
      console.log("[GuidePage] Permissions Check:", {
        userEmail: user?.email,
        guideAuthor: guide?.user_email,
        isOwner,
        isAdmin,
        sessionAdmin: sessionStorage.getItem("adminAuthenticated"),
      });
    }
  }, [guide, user, isOwner, isAdmin]);

  // Loading State
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center">
          <Loader2 size={48} className="animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500">Loading guide...</p>
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
            to="/guides"
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
        <div className="absolute left-0 top-0 h-24 w-full bg-white/50 backdrop-blur-xl [-webkit-mask-image:linear-gradient(to_bottom,black,transparent)]" />
        {/* Focus Mode Overlay */}
        {isFocusMode && (
          <div className="fixed inset-0 z-[200] bg-white pointer-events-auto overflow-y-auto animate-in fade-in duration-300">
            <div className="max-w-3xl mx-auto px-6 py-12">
              <button
                onClick={() => setIsFocusMode(false)}
                className="fixed top-6 right-6 p-2 bg-gray-100 hover:bg-black hover:text-white rounded-full transition-all"
                title="Exit Focus Mode"
              >
                <Eye size={24} />
              </button>
              <h1 className="text-4xl font-black mb-12 text-center">
                {guide.title}
              </h1>
              <div className="guide-content prose md:prose-xl max-w-none">
                {renderContent()}
              </div>
              <div className="mt-20 text-center text-gray-400 text-sm">
                End of focus mode
              </div>
            </div>
          </div>
        )}

        {/* Progress Track */}
        <div className="absolute left-0 top-0 w-full">
          <div className="absolute left-0 top-0 h-1 w-full bg-gray-200/30" />
          <ScrollProgress
            className="absolute top-0 h-1 bg-[linear-gradient(to_right,rgba(0,0,0,0),#000000_75%,#000000_100%)]"
            springOptions={{ stiffness: 280, damping: 18, mass: 0.3 }}
          />
        </div>
      </div>
      <article className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Top Bar: Back Link & Timer */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/guides"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Guides
          </Link>

          {/* Real-time Usage Timer */}
          {user && guide && <GuideTimer guideId={guide.id} userId={user.id} />}
        </div>

        {/* Breadcrumbs Navigation */}
        <Breadcrumbs
          dividerType="chevron"
          items={[
            { href: "/", label: "Home" },
            { href: "/guides", label: "Guides" },
            { href: "#", label: guide.title },
          ]}
        />

        {/* Header */}
        <header className="mb-8 pb-8 border-b-2 border-black">
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
                  to="/auth"
                  className="px-8 py-3 bg-white text-black font-black text-lg border-2 border-transparent hover:border-black hover:bg-gray-200 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  Join Now
                </Link>
              </div>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            {guide.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-gray-500 mb-6">
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              {new Date(guide.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {viewsCount > 0 && (
              <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium border border-blue-100">
                <Eye size={16} />
                {viewsCount.toLocaleString()}{" "}
                {viewsCount === 1 ? "view" : "views"}
              </span>
            )}
            {guide.content_type === "html" && (
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs font-medium">
                <ExternalLink size={12} />
                HTML/CSS
              </span>
            )}
          </div>

          {/* Author Card */}
          {guide.user_email && (
            <div className="mb-8 p-4 border-2 border-black bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {authorAvatar ? (
                    <img
                      src={authorAvatar}
                      alt={guide.author_name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {(guide.author_name ||
                        guide.user_email)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">By</p>
                    <p className="font-bold text-lg">
                      {guide.author_name || guide.user_email.split("@")[0]}
                    </p>
                    {guide.user_email && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail size={12} />
                        {guide.user_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Follow Button and Profile Link */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <FollowButton
                    targetUserEmail={guide.user_email}
                    targetUserName={
                      guide.author_name || guide.user_email.split("@")[0]
                    }
                  />
                  <Link
                    to={`/@${(guide.author_name || guide.user_email.split("@")[0]).toLowerCase()}/workspace`}
                    className="px-4 py-2 bg-white text-black border-2 border-black text-sm font-medium hover:bg-gray-100 transition-colors text-center"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Keywords */}
          {guide.keywords && guide.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {guide.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-sm font-medium"
                >
                  <Tag size={12} />
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
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
                        to="/auth"
                        className="w-full text-left px-3 py-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-sm flex items-center gap-3 font-medium text-gray-700 hover:text-black mb-1"
                      >
                        <UserPlus size={16} />
                        Sign Up Free
                      </Link>
                      <Link
                        to="/auth?mode=login"
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
        </header>

        {/* Match Search Bar */}
        <div className="max-w-md mb-8 mx-auto sm:mx-0">
          <div className="flex w-full shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden border border-gray-300 hover:border-black group">
            <div className="flex-1 bg-white flex items-center px-4 group-focus-within:ring-2 group-focus-within:ring-black group-focus-within:ring-inset">
              <Search size={18} className="text-gray-400 mr-2 flex-shrink-0" />
              <input
                className="w-full py-3 outline-none text-gray-800 placeholder:text-gray-400 bg-transparent text-sm font-medium"
                placeholder="Search related text in guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="bg-black text-white px-6 py-3 font-bold text-sm hover:bg-gray-800 transition-colors flex-shrink-0">
              Search
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="guide-content">{renderContent()}</div>

        {/* Comments Section */}
        <GuideComments guideId={guide.id} onCommentPosted={recordComment} />

        {/* Recommendations Section */}
        <div className="mt-16 mb-12">
          <GuideRecommendations currentGuideSlug={slug} limit={3} />
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 pt-8 border-t-2 border-black">
          <Link
            to="/guides"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-gray-800"
          >
            <ArrowLeft size={18} />
            Back to All Guides
          </Link>
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

        {/* History Modal */}
        {showHistory && (
          <GuideHistoryModal
            guideId={guide.id}
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
        {guide && (
          <GuideRating
            guideId={guide.id}
            authorId={guide.author_id}
            guideTitle={guide.title}
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
    </>
  );
}
