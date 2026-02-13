import {
    ArrowLeft,
    Calendar,
    Check,
    Clock,
    ExternalLink,
    Loader2,
    Mail,
    Share2,
    Tag,
    Trash2,
} from "lucide-react";
import { marked } from "marked";
import mermaid from "mermaid";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ConfirmModal from "../components/ConfirmModal";
import FollowButton from "../components/FollowButton";
import GuideComments from "../components/GuideComments";
import GuideHistoryModal from "../components/GuideHistoryModal";
import GuideTimer from "../components/GuideTimer";
import SEOHelmet from "../components/SEOHelmet";
import { ScrollProgress } from "../components/ui/scroll-progress";
import { useAuth } from "../contexts/AuthContext";
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
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadGuide();
  }, [slug]);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "default" });
  }, []);

  useEffect(() => {
    if (guide) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        try {
          mermaid.run({
            querySelector: ".mermaid",
          });
        } catch (err) {
          console.error("Mermaid failed to render:", err);
        }
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [guide]);

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

  // Render content based on type
  function renderContent() {
    if (!guide) return null;

    // If HTML content exists, render in iframe with full support
    if (guide.html_content && guide.html_content.trim()) {
      const htmlContent = guide.html_content.trim();

      // Check if it's a complete HTML document
      const isFullDocument =
        htmlContent.toLowerCase().includes("<!doctype") ||
        htmlContent.toLowerCase().includes("<html");

      // If it's a full HTML document, use it directly
      // Otherwise wrap it in a basic HTML structure
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

      return (
        <iframe
          srcDoc={fullHTML}
          className="w-full min-h-[700px] border-2 border-black bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          title={guide.title}
          style={{ display: "block" }}
        />
      );
    }

    // Otherwise render markdown
    const markdownContent = guide.markdown || guide.content || "";
    const html = marked.parse(markdownContent);
    const sanitizedHtml = sanitizeContent(html);

    return (
      <div
        className="prose md:prose-lg max-w-none prose-headings:font-black prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }
  // Check if admin is authenticated via sessionStorage
  const isAdmin = sessionStorage.getItem("adminAuthenticated") === "true";

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

  const isOwner = user?.email && guide?.user_email === user.email;

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
        <div className="flex items-center justify-between mb-8">
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

        {/* Header */}
        <header className="mb-8 pb-8 border-b-2 border-black">
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

            {/* ONLY SHOW ACTIONS IF OWNER OR ADMIN */}
            {(isOwner || isAdmin) && (
              <>
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-black transition-colors text-sm"
                >
                  <Clock size={16} />
                  History
                </button>

                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
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
        </header>

        {/* Content */}
        <div className="guide-content">{renderContent()}</div>

        {/* Comments Section */}
        <GuideComments guideId={guide.id} />

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
      </article>
    </>
  );
}
