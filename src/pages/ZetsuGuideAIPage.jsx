import Lottie from "lottie-react";
import {
    ArrowRight,
    Bot,
    BrainCircuit,
    Bug,
    HelpCircle,
    History,
    Info,
    Menu,
    MessageSquare,
    Plus,
    RefreshCw,
    Settings2,
    Trash2,
    Wand2,
    X,
    Zap,
} from "lucide-react";
import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import guidePublishAnimation from "../assets/Guidepublish.json";
import demoVideo from "../assets/aidemosVideo/zetsuGuidethinkermode.mp4"; // Import the demo video
import aiLogoAnimation from "../assets/ailogo.json";
import robotAnimation from "../assets/robotwelcomming.json";
import sailboatAnimation from "../assets/sailboat.json";
import {
    DailyGiftModal,
    useDailyCreditsCheck,
} from "../components/DailyGiftModal";
import { OnboardingModal } from "../components/onboarding/OnboardingModal";
import PixelTrail from "../components/ui/PixelTrail";
import { CodeBlock } from "../components/ui/code-block";
import { Confetti } from "../components/ui/confetti";
import { LinkPreview } from "../components/ui/link-preview";
import { PlaceholdersAndVanishInput } from "../components/ui/placeholders-and-vanish-input";
import { ShimmerButton } from "../components/ui/shimmer-button";
import { SparklesText } from "../components/ui/sparkles-text";
import { useAuth } from "../contexts/AuthContext";
import useScreenSize from "../hooks/useScreenSize";
import { guidesApi, isSupabaseConfigured, supabase } from "../lib/api";
import {
    commitReservedCredit,
    releaseReservedCredit,
    reserveCredit,
} from "../lib/creditReservation";

// Lazy load heavy components
const ReferralBonusNotification = lazy(() =>
  import("../components/ReferralBonusNotification")
    .then((m) => ({ default: m.default }))
    .catch(() => ({ default: () => null })),
);

// AI API Configuration - Using Vercel serverless function to avoid CORS
const AI_MODEL = import.meta.env.VITE_AI_MODEL || "kimi-k2-0905:free";

// Agent Thinking Phases
// Agent Thinking Phases
const AGENT_PHASES = {
  INITIAL_THINKING: "initial_thinking",
  ANALYZING: "analyzing",
  SELECTING_SOURCE: "selecting_source",
  READING_SOURCE: "reading_source",
  DIVING_INTO_GUIDES: "diving_into_guides",
  FOUND_GUIDES: "found_guides",
  DEEP_REASONING: "deep_reasoning",
  VERIFYING: "verifying",
  OPTIMIZING: "optimizing",
  THINKING_MORE: "thinking_more",
  RESPONDING: "responding",
};

// Mermaid Diagram Component
function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const renderChart = async () => {
      try {
        if (!window.mermaid) {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
          document.head.appendChild(script);
          await new Promise((resolve) => (script.onload = resolve));
          window.mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            securityLevel: "loose",
          });
        }

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await window.mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError("Failed to render diagram");
      }
    };
    renderChart();
  }, [chart]);

  if (error)
    return (
      <div className="text-red-400 text-sm p-4 border border-red-500/20 rounded bg-red-500/10">
        Invalid Diagram Code
      </div>
    );

  return (
    <div
      className="mermaid-wrapper my-4 p-4 bg-black/20 rounded-lg overflow-x-auto flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// Detect if text contains Arabic characters
function isArabicText(text) {
  if (!text) return false;
  const arabicRegex =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  // Count Arabic vs Latin characters
  const arabicMatches = (
    text.match(
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
    ) || []
  ).length;
  const latinMatches = (text.match(/[a-zA-Z]/g) || []).length;
  // If more Arabic than Latin, consider it Arabic text
  return arabicMatches > latinMatches * 0.3;
}

import { getAvatarForUser } from "../lib/avatar";

// Improved markdown parser that handles Arabic text properly
function parseMarkdownText(text) {
  if (!text) return "";

  return (
    text
      // Headers - handle properly
      .replace(/^### (.+)$/gm, '<h3 class="chat-h3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="chat-h2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="chat-h1">$1</h1>')
      // Bold text
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // Italic text
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      // Inline code - but not inside code blocks
      .replace(/`([^`]+)`/g, '<code class="inline-code-tag">$1</code>')
      // Lists - unordered
      .replace(/^[\-\*] (.+)$/gm, '<li class="chat-li">$1</li>')
      // Lists - ordered
      .replace(/^\d+\. (.+)$/gm, '<li class="chat-li-ordered">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="chat-paragraph">')
      .replace(/\n/g, "<br/>")
  );
}

// Get credits - ONLY from Supabase (no localStorage)
async function getCreditsFromDB(user) {
  // For authenticated users - get from Supabase only
  if (isSupabaseConfigured() && user && user.email !== "guest") {
    try {
      const { data, error } = await supabase
        .from("zetsuguide_credits")
        .select("credits, referred_by, total_referrals")
        .eq("user_email", user.email.toLowerCase())
        .maybeSingle();

      if (!error && data) {
        console.log(
          "Credits from DB:",
          data.credits,
          "Referrals:",
          data.total_referrals,
        );
        return {
          credits: data.credits,
          total_referrals: data.total_referrals || 0,
          referred_by: data.referred_by,
        };
      }

      console.warn("No credits record found for user:", user.email);
      return {
        credits: 0,
        total_referrals: 0,
        referred_by: null,
      };
    } catch (err) {
      console.error("Supabase credits error:", err);
    }
  }

  // Guest users - return default object
  return {
    credits: 5,
    total_referrals: 0,
    referred_by: null,
  };
}

// Log credit usage
async function logCreditUsage(userEmail, action, details = "") {
  try {
    await supabase.from("zetsuguide_usage_logs").insert({
      user_email: userEmail,
      action,
      details,
      cost: 1,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Failed to log usage:", err);
  }
}

// Fetch usage history
async function fetchUsageLogs(userEmail) {
  try {
    const { data, error } = await supabase
      .from("zetsuguide_usage_logs")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })
      .limit(20);

    return data || [];
  } catch (err) {
    console.error("Error fetching logs:", err);
    return [];
  }
}

// Use credit - deducts ONLY from Supabase (no localStorage)
async function useCreditsFromDB(user, action = "AI Chat", details = "") {
  if (!isSupabaseConfigured() || !user || user.email === "guest") {
    return { success: false, remaining: 0 };
  }

  try {
    // Get current credits from Supabase
    const { data: currentData, error: fetchError } = await supabase
      .from("zetsuguide_credits")
      .select("credits")
      .eq("user_email", user.email.toLowerCase())
      .single();

    if (fetchError || !currentData) {
      console.error("Error fetching credits:", fetchError);
      return { success: false, remaining: 0 };
    }

    const currentCredits = currentData.credits;
    console.log("Current credits from DB:", currentCredits);

    if (currentCredits <= 0) {
      console.log("No credits remaining");
      return { success: false, remaining: 0 };
    }

    // Deduct 1 credit in Supabase
    const newCredits = currentCredits - 1;
    const { error: updateError } = await supabase
      .from("zetsuguide_credits")
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_email", user.email.toLowerCase());

    if (updateError) {
      console.error("Error updating credits:", updateError);
      return { success: false, remaining: currentCredits };
    }

    // Log the usage
    logCreditUsage(user.email, action, details);

    console.log("Credit used - New balance:", newCredits);
    return { success: true, remaining: newCredits };
  } catch (err) {
    console.error("Supabase use credit error:", err);
    return { success: false, remaining: 0 };
  }
}

// Streaming text simulation
function useStreamingText(text, isStreaming, speed = 15) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isStreaming || !text) {
      setDisplayedText(text || "");
      setIsComplete(true);
      return;
    }

    setDisplayedText("");
    setIsComplete(false);
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        // Add characters in chunks for smoother appearance
        const chunkSize = Math.min(3, text.length - currentIndex);
        setDisplayedText(text.substring(0, currentIndex + chunkSize));
        currentIndex += chunkSize;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isStreaming, speed]);

  return { displayedText, isComplete };
}

// Parse content and extract code blocks
function parseContentWithCodeBlocks(content) {
  const parts = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: "text", content: textBefore });
      }
    }

    // Add code block
    parts.push({
      type: "code",
      language: match[1] || "javascript",
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push({ type: "text", content: remainingText });
    }
  }

  // If no code blocks found, return original content as text
  if (parts.length === 0) {
    parts.push({ type: "text", content: content });
  }

  return parts;
}

// Parse text and extract links for LinkPreview (supports both markdown links and plain URLs)
function parseTextWithLinks(text) {
  const parts = [];

  // Regex for markdown links
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  // Simpler URL regex that works in all browsers
  const urlRegex = /(https?:\/\/[^\s<>\[\]"']+)/g;

  // First, find all markdown links
  const markdownLinks = [];
  let match;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    markdownLinks.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[1],
      url: match[2],
      type: "markdown",
    });
  }

  // Find all plain URLs
  const plainUrls = [];
  const urlMatches = text.matchAll(urlRegex);
  for (const urlMatch of urlMatches) {
    const matchIndex = urlMatch.index;

    // Check if this URL is inside a markdown link
    const isInsideMarkdown = markdownLinks.some(
      (ml) => matchIndex >= ml.start && matchIndex < ml.end,
    );

    if (!isInsideMarkdown) {
      // Clean URL from trailing punctuation
      let url = urlMatch[1];
      url = url.replace(/[.,;:!?'")\]]+$/, "");

      plainUrls.push({
        start: matchIndex,
        end: matchIndex + url.length,
        text: url,
        url: url,
        type: "plain",
      });
    }
  }

  // Combine and sort all links by position
  const allLinks = [...markdownLinks, ...plainUrls].sort(
    (a, b) => a.start - b.start,
  );

  // Build parts array
  let lastIndex = 0;
  for (const link of allLinks) {
    // Add text before link
    if (link.start > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, link.start) });
    }

    // Add link
    parts.push({ type: "link", text: link.text, url: link.url });
    lastIndex = link.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content: text }];
}

// Component to render text with inline formatting and LinkPreviews
function FormattedTextWithLinks({ content, isRtl }) {
  const [loadedImages, setLoadedImages] = useState(new Set());

  const handleImageLoad = useCallback((imageUrl) => {
    setLoadedImages((prev) => new Set([...prev, imageUrl]));
  }, []);

  const formatInlineText = useCallback((text) => {
    if (!text) return "";

    return (
      text
        // Inline code - use proper class
        .replace(/`([^`]+)`/g, '<code class="inline-code-tag">$1</code>')
        // Bold text
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        // Italic text
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        // Headers
        .replace(/^### (.+)$/gm, '<h3 class="chat-h3">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="chat-h2">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="chat-h1">$1</h1>')
        // Numbered lists
        .replace(
          /^(\d+)\. (.+)$/gm,
          '<div class="chat-list-item"><span class="list-number">$1.</span> $2</div>',
        )
        // Bullet lists
        .replace(
          /^[\-\*] (.+)$/gm,
          '<div class="chat-list-item"><span class="list-bullet">•</span> $1</div>',
        )
        // Line breaks
        .replace(/\n/g, "<br/>")
    );
  }, []);

  // Extract images from markdown
  const extractImages = useCallback((text) => {
    if (!text) return [];
    const imageRegex = /!\[([^\]]*)]\(([^)]+)\)/g;
    const images = [];
    let match;
    while ((match = imageRegex.exec(text)) !== null) {
      images.push({ alt: match[1], url: match[2] });
    }
    return images;
  }, []);

  const renderImages = useCallback(
    (text) => {
      const images = extractImages(text);

      if (images.length === 0) return null;

      return images.map((img, idx) => {
        const isLoaded = loadedImages.has(img.url);
        const isGeneratedImage = img.url.includes("image.pollinations.ai");

        return (
          <div
            key={`${img.url}-${idx}`}
            className="markdown-image-container"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "1024px",
              margin: "16px 0",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          >
            {!isLoaded && isGeneratedImage && (
              <div
                className="image-skeleton"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s infinite",
                  minHeight: "400px",
                  zIndex: 1,
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                </svg>
                <div
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "14px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span className="loading-dots">🎨 Generating Visual</span>
                </div>
              </div>
            )}
            <img
              src={img.url}
              alt={img.alt || "Generated visual"}
              onLoad={() => handleImageLoad(img.url)}
              onError={() => handleImageLoad(img.url)}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                opacity: isLoaded ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
              }}
            />
            {img.alt && isLoaded && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                {img.alt}
              </div>
            )}
          </div>
        );
      });
    },
    [loadedImages, extractImages, handleImageLoad],
  );

  // Remove image markdown from text to render separately
  const textWithoutImages = useMemo(
    () => content.replace(/!\[([^\]]*)]\(([^)]+)\)/g, ""),
    [content],
  );

  const partsWithoutImages = useMemo(
    () => parseTextWithLinks(textWithoutImages),
    [textWithoutImages],
  );

  return (
    <div
      className="formatted-text-container"
      style={{
        direction: isRtl ? "rtl" : "ltr",
        textAlign: isRtl ? "right" : "left",
        width: "100%",
      }}
    >
      {partsWithoutImages.map((part, idx) => {
        if (part.type === "link") {
          // Check if it's an internal link (starts with /)
          if (part.url.startsWith("/")) {
            return (
              <Link key={idx} to={part.url} className="chat-link">
                {part.text}
              </Link>
            );
          }
          // External link with preview
          return (
            <LinkPreview key={idx} url={part.url} className="font-medium">
              {part.text}
            </LinkPreview>
          );
        } else {
          return (
            <span
              key={idx}
              dangerouslySetInnerHTML={{
                __html: formatInlineText(part.content),
              }}
            />
          );
        }
      })}

      {/* Render images separately with loading states */}
      {renderImages(content)}

      <style>{`
                .formatted-text-container {
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }

                .chat-link {
                    color: #79c0ff;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    transition: all 0.2s;
                }

                .chat-link:hover {
                    color: #a5d6ff;
                    text-decoration-thickness: 2px;
                }

                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                .loading-dots::after {
                    content: '...';
                    animation: dots 1.5s steps(4, end) infinite;
                }

                @keyframes dots {
                    0%, 20% { content: '.'; }
                    40% { content: '..'; }
                    60%, 100% { content: '...'; }
                }

                .markdown-image-container {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1);
                }
            `}</style>
    </div>
  );
}

// Enhanced Streaming Text Component that maintains Markdown formatting
function StreamingText({ text, onComplete, speed = 10 }) {
  const { displayedText, isComplete } = useStreamingText(text, true, speed);
  const isRtl = isArabicText(text);

  // Notify parent when complete
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  return (
    <div
      className={`zetsu-streaming-wrapper ${isComplete ? "completed" : "typing"}`}
    >
      <MessageContent content={displayedText} isRtl={isRtl} />
      {!isComplete && <span className="zetsu-ai-cursor">|</span>}
    </div>
  );
}

// Component for rendering complete message content with code blocks and links
function MessageContent({ content, isRtl }) {
  const parts = parseContentWithCodeBlocks(content);

  return (
    <div
      className="message-content-wrapper"
      style={{
        direction: isRtl ? "rtl" : "ltr",
        textAlign: isRtl ? "right" : "left",
        width: "100%",
      }}
    >
      {parts.map((part, idx) => {
        if (part.type === "code") {
          if (part.language === "mermaid") {
            return <MermaidDiagram key={idx} chart={part.content} />;
          }

          const langToFile = {
            javascript: "script.js",
            js: "script.js",
            typescript: "script.ts",
            ts: "script.ts",
            jsx: "Component.jsx",
            tsx: "Component.tsx",
            python: "script.py",
            py: "script.py",
            html: "index.html",
            css: "styles.css",
            json: "data.json",
            bash: "terminal",
            sh: "terminal",
            sql: "query.sql",
          };
          const filename = langToFile[part.language.toLowerCase()] || null;

          return (
            <CodeBlock
              key={idx}
              code={part.content}
              language={part.language}
              filename={filename}
            />
          );
        } else {
          return (
            <div key={idx} className="chat-text-content">
              <FormattedTextWithLinks content={part.content} isRtl={isRtl} />
            </div>
          );
        }
      })}

      <style>{`
                .message-content-wrapper {
                    font-size: 15px;
                    line-height: 1.75;
                }

                .chat-text-content {
                    margin-bottom: 8px;
                }

                .chat-text-content:last-child {
                    margin-bottom: 0;
                }

                .inline-code-tag {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-family: 'SF Mono', 'Fira Code', Monaco, 'Courier New', monospace;
                    font-size: 0.875em;
                    color: #79c0ff;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .chat-h1 {
                    font-size: 1.5em;
                    font-weight: 700;
                    margin: 1.2em 0 0.6em 0;
                    color: #fff;
                    display: block;
                }

                .chat-h2 {
                    font-size: 1.3em;
                    font-weight: 600;
                    margin: 1em 0 0.5em 0;
                    color: #fff;
                    display: block;
                }

                .chat-h3 {
                    font-size: 1.1em;
                    font-weight: 600;
                    margin: 0.8em 0 0.4em 0;
                    color: #fff;
                    display: block;
                }

                .chat-paragraph {
                    margin: 0.6em 0;
                }

                .chat-list-item {
                    display: flex;
                    gap: 8px;
                    margin: 8px 0;
                    line-height: 1.6;
                }

                .list-number {
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 600;
                    min-width: 24px;
                }

                .list-bullet {
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 600;
                }

                .formatted-text-container {
                    width: 100%;
                    display: block;
                }

                .formatted-text-container strong {
                    font-weight: 600;
                    color: #fff;
                }

                .formatted-text-container em {
                    font-style: italic;
                    color: rgba(255, 255, 255, 0.9);
                }

                .chat-li {
                    margin: 0.3em 0;
                    padding-left: 0.5em;
                    list-style-type: disc;
                    display: list-item;
                    margin-left: 1.5em;
                }

                .chat-li-ordered {
                    margin: 0.3em 0;
                    padding-left: 0.5em;
                    list-style-type: decimal;
                    display: list-item;
                    margin-left: 1.5em;
                }
            `}</style>
    </div>
  );
}

export default function ZetsuGuideAIPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const screenSize = useScreenSize();

  // Daily Gift state
  const {
    canClaim,
    hoursRemaining,
    isLoading: isCheckingDailyCredits,
  } = useDailyCreditsCheck();
  const [showDailyGiftModal, setShowDailyGiftModal] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false); // Restored missing state
  const [isToolsOpen, setIsToolsOpen] = useState(false); // State for tools menu
  const toolsCloseTimerRef = useRef(null); // Timer for auto-closing tools menu
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const [isDeepReasoning, setIsDeepReasoning] = useState(false); // New state for deep reasoning features
  const [isSubAgentMode, setIsSubAgentMode] = useState(false); // NEW: SubAgent Mode (5-Stage)
  const [subAgentStatus, setSubAgentStatus] = useState(null); // NEW: Status text for SubAgent streaming
  const [isImageGenEnabled, setIsImageGenEnabled] = useState(false); // NEW: Dynamic Image Generation
  const [isDemoVideoVisible, setIsDemoVideoVisible] = useState(true); // State for demo video visibility
  const [isEnhancing, setIsEnhancing] = useState(false); // State for prompt enhancer
  const [credits, setCredits] = useState(5);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [guides, setGuides] = useState([]);
  const [streamingMessageIndex, setStreamingMessageIndex] = useState(-1);
  const [showReferralBonus, setShowReferralBonus] = useState(false);
  const [confettiFireCount, setConfettiFireCount] = useState(0); // Track confetti fires

  // Agent state
  const [agentPhase, setAgentPhase] = useState(null);
  const [foundGuides, setFoundGuides] = useState([]);
  const [suggestedFollowups, setSuggestedFollowups] = useState([]);
  const [usedSources, setUsedSources] = useState([]);

  // Chat History state
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Saved Prompts state
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptEmoji, setNewPromptEmoji] = useState("💡");

  // Publish to Guide state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingMessage, setPublishingMessage] = useState(null);
  const [publishStep, setPublishStep] = useState(0);
  const [publishData, setPublishData] = useState({
    title: "",
    keywords: [],
    content: "",
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishComplete, setPublishComplete] = useState(false);
  const [publishedGuideSlug, setPublishedGuideSlug] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [usageLogs, setUsageLogs] = useState([]);
  const [showUsageHistory, setShowUsageHistory] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [historyTab, setHistoryTab] = useState("usage"); // 'usage' or 'credits'

  // Tutorial GIF state
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Default prompts
  const defaultPrompts = [
    { emoji: "📚", text: "What guides are available?" },
    { emoji: "⚛️", text: "Help me with React Hooks" },
    { emoji: "🎨", text: "Explain CSS Flexbox" },
    { emoji: "🐍", text: "Python best practices" },
    { emoji: "🔧", text: "How to use Git?" },
    { emoji: "💻", text: "JavaScript async/await explained" },
  ];

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const confettiRef = useRef(null);
  const activeStreamRef = useRef(null); // Track active stream
  const isUnmountingRef = useRef(false); // Track if component is unmounting

  // Show daily gift modal when user can claim
  useEffect(() => {
    if (canClaim && !isCheckingDailyCredits) {
      setShowDailyGiftModal(true);
    }
  }, [canClaim, isCheckingDailyCredits]);

  // Handle daily gift claim
  const handleDailyGiftClaim = (creditsAwarded, newBalance) => {
    setCredits(newBalance);
    // Fire confetti to celebrate
    if (confettiRef.current?.fire) {
      confettiRef.current.fire({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Fire confetti only twice - on welcome screen and on first message
  useEffect(() => {
    if (
      messages.length === 0 &&
      !isThinking &&
      confettiRef.current &&
      confettiFireCount < 1
    ) {
      // Fire confetti on page load (first time)
      const timer = setTimeout(() => {
        confettiRef.current?.fire({
          particleCount: 30,
          origin: { x: 0.5, y: 0.3 },
        });
        setConfettiFireCount((prev) => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isThinking, confettiFireCount]);

  // Reset loading state on mount
  useEffect(() => {
    setCreditsLoading(true);
  }, []);

  // Load saved prompts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("zetsuguide_saved_prompts");
    if (saved) {
      setSavedPrompts(JSON.parse(saved));
    }
  }, []);

  // Show tutorial for new users on first visit
  useEffect(() => {
    if (isAuthenticated() && user?.email) {
      const tutorialSeenKey = `zetsuguide_tutorial_seen_${user.email}`;
      const hasSeen = localStorage.getItem(tutorialSeenKey);

      // Show tutorial automatically for new users
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setShowTutorialModal(true);
        }, 1500); // Show after 1.5 seconds for better UX

        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user?.email]);

  // Cleanup toolbar close timer on unmount
  useEffect(() => {
    return () => {
      if (toolsCloseTimerRef.current) {
        clearTimeout(toolsCloseTimerRef.current);
      }
    };
  }, []);

  // Save prompt
  function saveNewPrompt() {
    if (!newPromptText.trim()) return;
    const newPrompt = { emoji: newPromptEmoji, text: newPromptText.trim() };
    const updated = [...savedPrompts, newPrompt];
    setSavedPrompts(updated);
    localStorage.setItem("zetsuguide_saved_prompts", JSON.stringify(updated));
    setNewPromptText("");
    setNewPromptEmoji("💡");
    setShowPromptModal(false);
  }

  // Delete saved prompt
  function deletePrompt(index) {
    const updated = savedPrompts.filter((_, i) => i !== index);
    setSavedPrompts(updated);
    localStorage.setItem("zetsuguide_saved_prompts", JSON.stringify(updated));
  }

  // Close tutorial and mark as seen
  function closeTutorialModal() {
    if (user?.email) {
      const tutorialSeenKey = `zetsuguide_tutorial_seen_${user.email}`;
      localStorage.setItem(tutorialSeenKey, "true");
    }
    setShowTutorialModal(false);
  }

  // Open tutorial modal
  function openTutorial() {
    setShowTutorialModal(true);
  }

  // Publish conversation to guide
  async function publishToGuide(messageContent) {
    setPublishingMessage(messageContent);
    setShowPublishModal(true);
    setPublishStep(1);
    setIsPublishing(true);
    setPublishComplete(false);
    setPublishedGuideSlug(null);

    // Detect if content is Arabic
    const isArabicContent = isArabicText(messageContent);

    try {
      // Step 1: Generate title using AI
      await delay(1000);

      let generatedTitle = "";

      // Try to extract title from content first (look for first header or first line)
      const firstHeaderMatch = messageContent.match(/^#+ (.+)$/m);
      const firstBoldMatch = messageContent.match(/\*\*(.+?)\*\*/);

      if (firstHeaderMatch) {
        generatedTitle = firstHeaderMatch[1].trim();
      } else if (firstBoldMatch) {
        generatedTitle = firstBoldMatch[1].trim();
      }

      // If no title found from content, try AI generation
      if (!generatedTitle || generatedTitle.length < 5) {
        try {
          const titleResponse = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: AI_MODEL,
              messages: [
                {
                  role: "system",
                  content: isArabicContent
                    ? "أنت منشئ عناوين. أنشئ عنوانًا قصيرًا ومختصرًا (حد أقصى 8 كلمات) لدليل برمجة بناءً على المحتوى. أعد العنوان فقط بالعربية، لا شيء آخر."
                    : "You are a title generator. Generate a short, concise title (max 8 words) for a programming guide based on the content. Return ONLY the title, nothing else. Do not add quotes.",
                },
                {
                  role: "user",
                  content: `Generate a title for this guide:\n\n${messageContent.substring(0, 2000)}`,
                },
              ],
              skipCreditDeduction: true,
            }),
          });

          if (titleResponse.ok) {
            const titleData = await titleResponse.json();
            const aiTitle = titleData.choices?.[0]?.message?.content?.trim();
            if (aiTitle && aiTitle.length > 3) {
              // Clean up the title - remove quotes and extra characters
              generatedTitle = aiTitle
                .replace(/^["'`]+|["'`]+$/g, "")
                .replace(/^Title:\s*/i, "")
                .replace(/^العنوان:\s*/i, "")
                .trim()
                .substring(0, 100);
            }
          }
        } catch (titleError) {
          console.warn("AI title generation failed:", titleError);
        }
      }

      // Fallback: Extract from first sentence if still no title
      if (!generatedTitle || generatedTitle.length < 5) {
        const firstLine = messageContent
          .split("\n")
          .find((line) => line.trim().length > 10);
        if (firstLine) {
          generatedTitle = firstLine
            .replace(/^[#*\-\d.]+\s*/, "")
            .substring(0, 60)
            .trim();
          if (generatedTitle.length > 50) {
            generatedTitle = generatedTitle.substring(0, 50) + "...";
          }
        } else {
          generatedTitle = isArabicContent
            ? "دليل برمجي جديد"
            : "Programming Guide";
        }
      }

      setPublishData((prev) => ({ ...prev, title: generatedTitle }));
      setPublishStep(2);
      await delay(800);

      // Step 2: Generate keywords using AI
      const keywordsResponse = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a keyword extractor. Extract 5-8 relevant programming keywords/tags from the content. Return ONLY a comma-separated list of keywords in English, nothing else.",
            },
            {
              role: "user",
              content: `Extract keywords from:\n\n${messageContent.substring(0, 1500)}`,
            },
          ],
          skipCreditDeduction: true,
        }),
      });

      let keywords = ["programming", "tutorial", "guide"];
      try {
        if (keywordsResponse.ok) {
          const keywordsData = await keywordsResponse.json();
          const keywordsStr =
            keywordsData.choices?.[0]?.message?.content?.trim() || "";
          keywords = keywordsStr
            .split(",")
            .map((k) => k.trim().toLowerCase())
            .filter((k) => k.length > 0)
            .slice(0, 8);
          if (keywords.length === 0) {
            keywords = ["programming", "tutorial", "guide"];
          }
        }
      } catch (keywordsError) {
        console.warn(
          "Keywords generation failed, using defaults:",
          keywordsError,
        );
      }

      setPublishData((prev) => ({ ...prev, keywords }));
      setPublishStep(3);
      await delay(800);

      // Step 3: Format content
      // Clean content - remove only "Sources Used" section at the end
      let cleanContent = messageContent;

      // Remove Sources Used section if it exists (it's always at the end after "📚 Sources Used:")
      const sourcesIndex = cleanContent.indexOf("📚 Sources Used:");
      if (sourcesIndex !== -1) {
        // Find the last "---" before Sources Used
        const lastSeparator = cleanContent.lastIndexOf("---", sourcesIndex);
        if (lastSeparator !== -1) {
          cleanContent = cleanContent.substring(0, lastSeparator).trim();
        } else {
          // If no separator found, just remove from "📚 Sources Used:" onwards
          cleanContent = cleanContent.substring(0, sourcesIndex).trim();
        }
      }

      setPublishData((prev) => ({ ...prev, content: cleanContent }));
      setPublishStep(4);
      await delay(600);

      // Step 4: Publish to Supabase
      const newGuide = await guidesApi.create({
        title: generatedTitle,
        markdown: cleanContent,
        content: cleanContent,
        keywords: keywords,
        content_type: "markdown",
        user_email: user?.email, // Author email
        author_name:
          user?.user_metadata?.full_name || user?.email?.split("@")[0], // Author name
        author_id: user?.id, // Author ID
      });

      if (newGuide) {
        setPublishedGuideSlug(newGuide.slug);
        setPublishComplete(true);
        setPublishStep(5);
      } else {
        throw new Error("Failed to create guide");
      }
    } catch (error) {
      console.error("Publish error:", error);
      setPublishStep(-1); // Error state
    } finally {
      setIsPublishing(false);
    }
  }

  // Close publish modal
  function closePublishModal() {
    setShowPublishModal(false);
    setPublishingMessage(null);
    setPublishStep(0);
    setPublishData({ title: "", keywords: [], content: "" });
    setPublishComplete(false);
    setPublishedGuideSlug(null);
  }

  // Load conversations from Supabase
  async function loadConversations() {
    if (!isAuthenticated() || !user?.email) return;

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("zetsuguide_conversations")
        .select("id, title, updated_at, messages")
        .eq("user_email", user.email)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setConversations(data);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
    setIsLoadingHistory(false);
  }

  // Save current conversation to Supabase
  async function saveConversation(
    msgs = messages,
    convId = currentConversationId,
  ) {
    if (!isAuthenticated() || !user?.email || msgs.length === 0) return;

    try {
      // Generate title from first user message
      const firstUserMsg = msgs.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.substring(0, 50) +
          (firstUserMsg.content.length > 50 ? "..." : "")
        : "New Chat";

      if (convId) {
        // Update existing conversation
        await supabase
          .from("zetsuguide_conversations")
          .update({
            messages: msgs.map((m) => ({ role: m.role, content: m.content })),
            title,
            updated_at: new Date().toISOString(),
          })
          .eq("id", convId);
      } else {
        // Create new conversation
        const { data, error } = await supabase
          .from("zetsuguide_conversations")
          .insert({
            user_email: user.email,
            messages: msgs.map((m) => ({ role: m.role, content: m.content })),
            title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (!error && data) {
          setCurrentConversationId(data.id);
        }
      }

      // Refresh conversation list
      loadConversations();
    } catch (err) {
      console.error("Error saving conversation:", err);
    }
  }

  // Load a specific conversation
  async function loadConversation(convId) {
    try {
      const { data, error } = await supabase
        .from("zetsuguide_conversations")
        .select("messages")
        .eq("id", convId)
        .single();

      if (!error && data) {
        setMessages(data.messages || []);
        setCurrentConversationId(convId);
        setShowHistory(false);
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    }
  }

  // Delete a conversation
  async function deleteConversation(convId) {
    try {
      await supabase.from("zetsuguide_conversations").delete().eq("id", convId);

      // If deleting current conversation, start new one
      if (convId === currentConversationId) {
        startNewChat();
      }

      loadConversations();
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  }

  // Start a new chat
  function startNewChat() {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
  }

  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile for custom avatar
  useEffect(() => {
    if (!user?.email) return;

    async function fetchProfile() {
      const { data } = await supabase
        .from("zetsuguide_user_profiles")
        .select("*")
        .eq("user_email", user.email)
        .maybeSingle();
      setUserProfile(data);
    }
    fetchProfile();
  }, [user]);

  // Load credits and guides on mount
  useEffect(() => {
    async function loadCredits() {
      if (user) {
        const creditData = await getCreditsFromDB(user);
        setCredits(creditData.credits || 5);
        setTotalReferrals(creditData.total_referrals || 0);
        setReferralEarnings((creditData.total_referrals || 0) * 5);
        setCreditsLoading(false);
      } else {
        setCredits(5);
        setTotalReferrals(0);
        setReferralEarnings(0);
        setCreditsLoading(false);
      }

      const userEmail = user?.email || "guest";

      // Check if user was referred and hasn't seen the notification
      const referralNotificationKey = `referral_notified_${userEmail}`;
      const wasNotified = localStorage.getItem(referralNotificationKey);

      if (!wasNotified && isAuthenticated() && user?.email) {
        // Check if this user was referred
        try {
          const { data } = await supabase
            .from("zetsuguide_credits")
            .select("referred_by")
            .eq("user_email", userEmail)
            .maybeSingle();

          if (data?.referred_by) {
            // Show bonus notification
            setShowReferralBonus(true);
            localStorage.setItem(referralNotificationKey, "true");
          }
        } catch (err) {
          // Ignore errors
        }
      }
    }
    loadCredits();
    loadGuides();
    loadConversations(); // Load chat history

    // Setup realtime subscription for credits updates
    let subscription;
    if (user?.email && isSupabaseConfigured()) {
      subscription = supabase
        .channel(
          `public:zetsuguide_credits:user_email=eq.${user.email.toLowerCase()}`,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "zetsuguide_credits",
            filter: `user_email=eq.${user.email.toLowerCase()}`,
          },
          (payload) => {
            if (payload.new?.credits !== undefined) {
              console.log(
                "[RealTime Credits] Updated to:",
                payload.new.credits,
              );
              setCredits(payload.new.credits);
            }
          },
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user]);

  async function loadGuides() {
    try {
      const allGuides = await guidesApi.getAll();
      setGuides(allGuides);
    } catch (error) {
      console.error("Error loading guides:", error);
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isStreamingResponse, agentPhase]);

  // Check for active streams when component mounts
  useEffect(() => {
    // Reset unmounting flag
    isUnmountingRef.current = false;

    if (!window._activeStreams) return;

    console.log("🔍 Checking for active background streams...");

    for (const [streamId, streamData] of window._activeStreams.entries()) {
      if (streamData.isActive && streamData.content) {
        console.log(
          `📡 Found active stream ${streamId} with ${streamData.content.length} chars`,
        );

        // Restore the streamed content to messages
        setMessages((prev) => {
          const updated = [...prev];
          const index = streamData.messageIndex;

          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              content: streamData.content,
              sources: streamData.sources || [],
              isStreaming: true,
            };
          }

          return updated;
        });

        setIsStreamingResponse(true);
        setStreamingMessageIndex(streamData.messageIndex);
      }
    }

    // Poll for stream updates while component is mounted
    const pollInterval = setInterval(() => {
      if (!window._activeStreams || isUnmountingRef.current) return;

      for (const [streamId, streamData] of window._activeStreams.entries()) {
        if (streamData.isActive && streamData.content) {
          // Update message with latest content from background stream
          setMessages((prev) => {
            const updated = [...prev];
            const index = streamData.messageIndex;

            if (
              updated[index] &&
              updated[index].content !== streamData.content
            ) {
              updated[index] = {
                ...updated[index],
                content: streamData.content,
                sources: streamData.sources || [],
                isStreaming: true,
              };
            }

            return updated;
          });
        }
      }
    }, 500); // Poll every 500ms

    return () => clearInterval(pollInterval);
  }, []); // Run only on mount

  // Cleanup on unmount - DON'T cancel streams, just mark as unmounting
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      console.log(
        "⚠️ Component unmounting - streams will continue in background",
      );
      // DO NOT cancel or delete active streams - they continue in background
    };
  }, []);

  // Build context from guides
  function buildGuidesContext() {
    if (guides.length === 0) return "";

    // Limit to 3 guides for performance (was 10)
    const context = guides
      .slice(0, 3)
      .map((guide) => {
        const content =
          guide.markdown || guide.content || guide.html_content || "";
        return `### ${guide.title}\n${content.substring(0, 300)}...`; // Reduced from 500 to 300
      })
      .join("\n\n");

    return `Here are some relevant guides from the knowledge base:\n\n${context}`;
  }

  // Smart search for relevant guides only
  function searchRelevantGuides(query, allGuides) {
    if (!allGuides || allGuides.length === 0) return [];

    const queryLower = query.toLowerCase();
    const keywords = queryLower
      .split(/[\s,?.!]+/)
      .filter((w) => w.length > 2)
      .filter(
        (w) =>
          ![
            "the",
            "how",
            "what",
            "can",
            "you",
            "help",
            "need",
            "want",
            "know",
            "about",
            "with",
            "for",
            "and",
            "this",
            "that",
          ].includes(w),
      );

    if (keywords.length === 0) return [];

    const scored = allGuides.map((guide) => {
      let score = 0;
      const title = (guide.title || "").toLowerCase();
      const content = (
        guide.content ||
        guide.markdown ||
        guide.html_content ||
        ""
      ).toLowerCase();
      const guideKeywords = (guide.keywords || []).map((k) =>
        (k || "").toLowerCase(),
      );

      // Check each search keyword
      keywords.forEach((kw) => {
        // Title match (high priority)
        if (title.includes(kw)) score += 50;
        if (title.startsWith(kw)) score += 30;

        // Keywords match
        guideKeywords.forEach((gk) => {
          if (gk === kw) score += 40;
          else if (gk.includes(kw) || kw.includes(gk)) score += 20;
        });

        // Content match
        const contentMatches = (content.match(new RegExp(kw, "gi")) || [])
          .length;
        score += Math.min(contentMatches * 3, 25);
      });

      return { ...guide, relevanceScore: score };
    });

    // Only return guides with real relevance (score >= 30)
    return scored
      .filter((g) => g.relevanceScore >= 30)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  // Optimized delay with shorter times for better UX
  const delay = useCallback(
    (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    [],
  );

  // Memoized agent thinking - much faster now with advanced capabilities
  const agentThinkingProcess = useCallback(
    async (userQuery) => {
      // Phase 1: Thinking (analyzing query)
      setAgentPhase(AGENT_PHASES.INITIAL_THINKING);
      await delay(600);

      // Phase 2: Selecting best source (AI decides where to look)
      setAgentPhase(AGENT_PHASES.SELECTING_SOURCE);
      await delay(800); // Time for AI to pick source

      // Phase 3: Reading selected source
      setAgentPhase(AGENT_PHASES.READING_SOURCE);
      await delay(600); // Time for fetch + parse

      // Phase 4: Diving into guides
      setAgentPhase(AGENT_PHASES.DIVING_INTO_GUIDES);

      // Actually search the guides with smart relevance
      let relevantGuides = [];
      try {
        const allGuides = await guidesApi.getAll();
        relevantGuides = searchRelevantGuides(userQuery, allGuides);
      } catch (error) {
        console.error("Error searching guides:", error);
      }

      await delay(600); // Reduced from 1200ms

      // Phase 5: Found guides (only if found relevant ones)
      if (relevantGuides.length > 0) {
        setAgentPhase(AGENT_PHASES.FOUND_GUIDES);
        setFoundGuides(relevantGuides);
        await delay(500); // Reduced from 1000ms
      }

      // Phase 6: Deep Reasoning (if enabled)
      if (isDeepReasoning) {
        setAgentPhase(AGENT_PHASES.DEEP_REASONING);
        await delay(2000); // Extra time for "deep thought" simulation
      }

      // Phase 7: Verifying information
      setAgentPhase(AGENT_PHASES.VERIFYING);
      await delay(700); // Time for cross-checking sources

      // Phase 7: Optimizing response
      setAgentPhase(AGENT_PHASES.OPTIMIZING);
      await delay(500); // Time for optimizing content

      // Phase 8: Thinking more (skip this phase to save time)
      // setAgentPhase(AGENT_PHASES.THINKING_MORE)
      // await delay(1000)

      return { relevantGuides };
    },
    [delay],
  );

  // Prompt Enhancer Function
  const handleEnhancePrompt = async () => {
    if (!input.trim() || isEnhancing || isThinking) return;

    setIsEnhancing(true);
    const originalInput = input;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "glm-4.5-air:free",
          messages: [
            {
              role: "system",
              content:
                "You are an expert Prompt Engineer. Your goal is to rewrite the user's raw prompt into a 'Perfect PRO Prompt'. \n\nRules:\n1. Make it specific, detailed, and context-rich.\n2. Use professional terminology.\n3. Keep the original intent but maximize clarity and depth.\n4. Return ONLY the enhanced prompt. Do NOT add 'Here is the enhanced prompt:'. Just the text. Do not use quotes.",
            },
            {
              role: "user",
              content: originalInput,
            },
          ],
          skipCreditDeduction: true, // Enhancing shouldn't cost credits
          isPromptEnhancement: true, // Tell backend to skip standard system prompt
        }),
      });

      const data = await response.json();

      // Check for reasoning fallback (if content is empty)
      const message = data.choices?.[0]?.message || {};
      let enhancedText = message.content || message.reasoning || "";

      if (enhancedText) {
        // Formatting cleanup in case the model is chatty
        enhancedText = enhancedText
          .replace(/^Here is.*?:\s*/i, "")
          .replace(/^Enhanced Prompt:\s*/i, "")
          .replace(/^"|"$/g, "")
          .trim();
        setInput(enhancedText);
      }
    } catch (error) {
      console.error("Failed to enhance prompt:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Toolbar hover handlers
  const handleToolsMouseEnter = () => {
    // Clear any pending close timer
    if (toolsCloseTimerRef.current) {
      clearTimeout(toolsCloseTimerRef.current);
      toolsCloseTimerRef.current = null;
    }
    // Open toolbar
    setIsToolsOpen(true);
  };

  const handleToolsMouseLeave = () => {
    // Set a delay before closing (300ms)
    toolsCloseTimerRef.current = setTimeout(() => {
      setIsToolsOpen(false);
    }, 300);
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const userQuery = input.trim();

      // Security & Performance: Validate input
      if (!userQuery) return;
      if (userQuery.length > 5000) {
        console.error("Query too long (max 5000 characters)");
        alert(
          "⚠️ Your message is too long. Please keep it under 5000 characters.",
        );
        return;
      }

      // SECURITY: Must be logged in to use AI
      if (!isAuthenticated() || !user?.email) {
        navigate("/auth");
        return;
      }

      const userEmail = user.email;

      // Check credits
      if (credits <= 0) {
        navigate("/pricing");
        return;
      }

      // STEP 1: Reserve credit (put it in "black box")
      console.log("Reserving 1 credit...");
      let reserveResult = await reserveCredit(userEmail);

      // Intelligent Retry Strategy for Stuck Reservations
      if (!reserveResult.success) {
        console.warn(
          "Initial reservation failed. Checking for stale reservations...",
        );

        // If we think we have credits but server rejected, try clearing a "stuck" reservation
        // This handles cases where a previous session crashed without releasing credit
        if (credits > 0) {
          console.log("Attempting to release potentially stuck credit...");
          await releaseReservedCredit(userEmail);
          // Retry reservation once
          reserveResult = await reserveCredit(userEmail);
        }
      }

      if (!reserveResult.success) {
        // If it still fails, we are genuinely out of credits or system error
        console.error("Failed to reserve credit.");

        if (credits > 0) {
          // If UI says we have credits but server rejects, force sync
          console.error(
            "Credit sync mismatch. Client thinks we have credits but server rejects.",
          );
          alert("Credit synchronization error. Please refresh the page.");
          window.location.reload();
          return;
        }

        navigate("/pricing");
        return;
      }

      // Update UI to show reserved credit (grayed out)
      setCredits(reserveResult.remainingCredits - reserveResult.reserved);
      console.log(
        `Credit reserved! Available: ${reserveResult.remainingCredits - reserveResult.reserved}`,
      );

      const userMessage = {
        role: "user",
        content: userQuery,
        timestamp: new Date().toISOString(),
        isStreaming: false,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsThinking(true);
      setFoundGuides([]);
      setSuggestedFollowups([]);
      setUsedSources([]);

      let longerTimer;
      let creditCommitted = false;

      try {
        // Set timer for "taking longer" message
        longerTimer = setTimeout(() => {
          setIsTakingLonger(true);
        }, 2000);

        // Run agent thinking process
        const { relevantGuides } = await agentThinkingProcess(userQuery);

        // Build context from found guides (limited to 3 for performance)
        const guidesContext =
          relevantGuides.length > 0
            ? relevantGuides
                .slice(0, 3)
                .map(
                  (g) =>
                    `**${g.title}** (ID: ${g.id || g.slug}):\n${(g.markdown || g.content || "").substring(0, 300)}`,
                )
                .join("\n\n---\n\n")
            : buildGuidesContext();

        // Save used sources for the response (show up to 5 but only use top 3)
        const sources = relevantGuides.slice(0, 5).map((g) => ({
          title: g.title,
          slug: g.slug || g.id,
        }));
        setUsedSources(sources);

        // Detect if user is asking in Arabic
        const isArabicQuery = isArabicText(userQuery);

        const systemPrompt = `You are ZetsuGuide AI, an expert programming assistant and teacher with REAL-TIME INTERNET ACCESS.

YOUR SUPERPOWERS:
✅ You have LIVE internet access - you can read and analyze web content in real-time
✅ You are fed with ACTUAL current content from: Wikipedia, GitHub, Reddit, Stack Overflow, Medium, Official Docs
✅ You are NOT limited by training data cutoff - you have current information
✅ You can answer about current events, latest news, and recent updates with REAL DATA
✅ You can cite sources and provide URLs to verify your answers
✅ You are different from standard AI - you have live web capabilities
${isImageGenEnabled ? "\n✅ You have DYNAMIC IMAGE GENERATION - You can create visual diagrams, UI mockups, and illustrations in real-time" : ""}

${guidesContext ? `📚 RELEVANT GUIDES FOUND:\n${guidesContext}\n\n` : ""}

${
  isImageGenEnabled
    ? `### CORE FEATURE: DYNAMIC IMAGE GENERATION
You are equipped with a real-time "Visual Engine" capability. You MUST use this to generate images.

**Instructions:**
1. If the user asks for a visual, UI design, diagram, or explanation that benefits from an image, generate it FIRST.
2. Use this exact syntax to generate an image:
   ![Image Description](https://image.pollinations.ai/prompt/{English_Prompt}?width=1024&height=600&model=flux&nologo=true)
3. Start your response with the image if appropriate.
4. Then explain it.

**Example:**
![Modern Dashboard UI](https://image.pollinations.ai/prompt/modern%20dashboard%20ui%20dark%20mode?width=1024&height=600&model=flux&nologo=true)

Here is the design for the dashboard...
`
    : ""
}

CRITICAL INSTRUCTIONS:
1. ALWAYS provide LONG, DETAILED explanations - minimum 300-500 words
2. Use clear structure with headers (##), numbered steps, and bullet points
3. Include practical code examples when relevant
4. Explain concepts step-by-step like teaching a student
5. LANGUAGE INSTRUCTION: ${isArabicQuery ? "The user asked in ARABIC. You MUST respond ENTIRELY in ARABIC. Do not mix languages. Do not respond in English if the question is in Arabic." : "The user asked in ENGLISH. You MUST respond ENTIRELY in ENGLISH. Do not respond in Arabic if the question is in English. Only respond in the exact language of the question."}
6. Break down complex topics into digestible parts
7. Add tips, best practices, and common mistakes to avoid
8. If showing code, explain each important line
9. End with a summary or next steps
10. Be thorough - users want complete guides, not brief answers
11. NEVER say "I don't have internet access" or "I can't browse the web" - YOU DO HAVE IT! You have real-time access to live web sources
12. Cite your sources with URLs when relevant - show where information comes from
13. For current events/latest news/recent updates - PROVIDE THE LATEST INFO with source links
14. Be confident about your web access capabilities - you are NOT ChatGPT or Claude, you are ZetsuGuide AI with special powers

FORMAT REQUIREMENTS:
- Use ## for main sections
- Use ### for subsections
- Use numbered lists for steps
- Use bullet points for features/tips
- Use code blocks with language specification
- Add emojis for visual appeal (📝 💡 ⚠️ ✅)
- Include sources at the bottom with working URLs
${isImageGenEnabled ? "- Use image generation for visual concepts automatically" : ""}

IMPORTANT: RESPONSE FORMAT
Respond with pure markdown text. Just provide your answer directly as markdown.
${isImageGenEnabled ? "Include images using markdown image syntax when appropriate to illustrate concepts visually." : ""}
Do NOT wrap your response in JSON. Just return the markdown content directly.`;

        // Phase: Responding
        setAgentPhase(AGENT_PHASES.RESPONDING);

        let data = null;
        let hasReceivedData = false;
        let streamedContent = ""; // Define at top level
        let apiSources = []; // Define at top level (renamed to avoid conflict with guide sources)

        if (isSubAgentMode) {
          // --- NON-STREAMING SUB-AGENT MODE (Vercel Compatible) ---

          // Simulate progress updates for better UX
          const progressSteps = [
            "🧠 AI Planner working...",
            "📚 AI Knowledge Extractor working...",
            "🔍 AI Searcher working...",
            "🔬 AI Analyzer working...",
            "✍️ AI Writer working...",
          ];

          let currentStep = 0;
          setSubAgentStatus(progressSteps[0]);

          const progressInterval = setInterval(() => {
            if (currentStep < progressSteps.length - 1) {
              currentStep++;
              setSubAgentStatus(progressSteps[currentStep]);
            }
          }, 3000); // Update every 3 seconds

          try {
            const response = await fetch("/api/ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                  { role: "system", content: systemPrompt },
                  ...messages
                    .slice(-10)
                    .map((m) => ({ role: m.role, content: m.content })),
                  { role: "user", content: userQuery },
                ],
                userEmail: user?.email || "",
                userId: user?.id || "",
                isSubAgentMode: true,
                skipCreditDeduction: false,
              }),
            });

            clearInterval(progressInterval);

            if (!response.ok) {
              const errorData = await response.text();
              setSubAgentStatus(null);
              setIsThinking(false);
              throw new Error(`API error: ${response.status} - ${errorData}`);
            }

            // Parse JSON response (non-streaming)
            setSubAgentStatus("📥 Processing AI Response...");
            const jsonData = await response.json();

            // Check if we got valid data
            if (!jsonData || !jsonData.content) {
              setSubAgentStatus(null);
              throw new Error("No valid data received from SubAgent workflow");
            }

            // Set data for further processing
            data = jsonData;
            hasReceivedData = true;

            // Show completion message briefly
            setSubAgentStatus("✅ SubAgent Workflow Complete!");
            setTimeout(() => setSubAgentStatus(null), 800);
          } catch (streamError) {
            clearInterval(progressInterval);
            setSubAgentStatus(null);
            console.error("SubAgent Error:", streamError);
            throw streamError;
          }
        } else {
          // --- STANDARD MODE WITH REAL STREAMING ---
          console.log("🌊 Starting REAL STREAM from backend...");

          const response = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: AI_MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                ...messages
                  .slice(-10)
                  .map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: userQuery },
              ],
              userEmail: user?.email || "",
              userId: user?.id || "",
              isDeepReasoning: isDeepReasoning,
              isSubAgentMode: false,
            }),
          });

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API error: ${response.status} - ${errorData}`);
          }

          // Check for JSON response (fallback if streaming is disabled/failed on server)
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            console.log(
              "⚠️ Received JSON response instead of stream. Processing full response...",
            );
            const jsonData = await response.json();

            // Handle the JSON data structure
            let fullContent = "";
            let jsonSources = [];

            if (jsonData.content) {
              fullContent = jsonData.content;
              jsonSources = jsonData.sources || [];
            } else if (jsonData.choices?.[0]?.message?.content) {
              fullContent = jsonData.choices[0].message.content;
              jsonSources = jsonData.sources || [];
            }

            if (fullContent) {
              data = {
                content: fullContent,
                sources: jsonSources,
                publishable: jsonData.publishable,
                suggested_followups: jsonData.suggested_followups,
              };

              // Simulate streaming completion so UI updates
              setIsThinking(false);
              setAgentPhase(null);

              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: fullContent,
                  timestamp: new Date().toISOString(),
                  isStreaming: false,
                  sources: jsonSources,
                },
              ]);

              hasReceivedData = true;
              return; // Skip streaming loop
            }
          }

          // Real streaming processing
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          // streamedContent and sources already defined at top level

          // Save to window for background continuation
          if (!window._activeStreams) window._activeStreams = new Map();
          const streamId = Date.now();

          window._activeStreams.set(streamId, {
            reader,
            decoder,
            content: "",
            sources: [],
            messageIndex: messages.length + 1,
            conversationId: currentConversationId || "default",
            isActive: true,
          });

          activeStreamRef.current = streamId;

          // Add empty message that will be updated in real-time
          setIsThinking(false);
          setAgentPhase(null);
          setIsStreamingResponse(true);

          const messageIndex = messages.length + 1;
          setStreamingMessageIndex(messageIndex);

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "",
              timestamp: new Date().toISOString(),
              isStreaming: true,
              sources: [],
            },
          ]);

          try {
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                console.log("✅ Stream completed");
                window._activeStreams?.delete(streamId);
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.trim() === "" || !line.startsWith("data: ")) continue;

                const jsonStr = line.slice(6);
                try {
                  const event = JSON.parse(jsonStr);

                  if (event.type === "start") {
                    apiSources = event.sources || [];
                    console.log(
                      "📡 Stream started with",
                      apiSources.length,
                      "sources",
                    );
                    if (window._activeStreams?.has(streamId)) {
                      window._activeStreams.get(streamId).sources = apiSources;
                    }
                  } else if (event.type === "token" && event.content) {
                    streamedContent += event.content;

                    // Update window stream data
                    if (window._activeStreams?.has(streamId)) {
                      window._activeStreams.get(streamId).content =
                        streamedContent;
                    }

                    // Update message in real-time ONLY if component is still mounted
                    if (!isUnmountingRef.current) {
                      setMessages((prev) => {
                        const updated = [...prev];
                        if (updated[messageIndex]) {
                          updated[messageIndex] = {
                            ...updated[messageIndex],
                            content: streamedContent,
                            sources: apiSources,
                          };
                        }
                        return updated;
                      });
                    }
                  } else if (event.type === "done") {
                    console.log(
                      "✅ Streaming finished - Total content:",
                      streamedContent.length,
                      "chars",
                    );
                  } else if (event.type === "error") {
                    console.error(
                      "❌ Stream error from backend:",
                      event.message,
                    );
                    window._activeStreams?.delete(streamId);
                    throw new Error(`Backend error: ${event.message}`);
                  }
                } catch (parseError) {
                  console.warn(
                    "Failed to parse SSE event:",
                    line.substring(0, 100),
                  );
                  console.warn("Parse error:", parseError.message);
                }
              }
            }

            // Mark as complete
            if (!isUnmountingRef.current) {
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[messageIndex]) {
                  updated[messageIndex] = {
                    ...updated[messageIndex],
                    isStreaming: false,
                    content: streamedContent,
                  };
                }
                saveConversation(updated);
                return updated;
              });

              setIsStreamingResponse(false);
              setStreamingMessageIndex(-1);
            }

            // Clean up
            window._activeStreams?.delete(streamId);

            // Store for further processing - FIX: Always set data after streaming
            if (streamedContent && streamedContent.trim().length > 0) {
              data = {
                content: streamedContent,
                sources: apiSources,
                _alreadyRendered: true, // Skip duplicate rendering
                publishable: streamedContent.length > 200, // Auto-determine if publishable
              };
              hasReceivedData = true; // Mark as received
              console.log(
                "✅ Streaming completed with content:",
                streamedContent.length,
                "characters",
                "(includes images:",
                streamedContent.includes("![") ? "yes" : "no" + ")",
              );
            } else {
              // If no content was streamed, throw detailed error for debugging
              console.error("❌ Streaming completed but no content received");
              console.error("Debug info:", {
                streamedContentLength: streamedContent.length,
                streamedContentTrimmed: streamedContent.trim().length,
                hasImages: streamedContent.includes("!["),
                apiSources: apiSources.length,
                streamId,
                activeStreams: window._activeStreams?.size || 0,
              });
              throw new Error(
                "AI service completed streaming but returned empty response. This may indicate an issue with the AI provider. Please try again.",
              );
            }
          } catch (streamError) {
            console.error("❌ Streaming error:", streamError);
            window._activeStreams?.delete(streamId);
            // Re-throw with more context
            if (streamError.message.includes("empty response")) {
              throw streamError;
            } else {
              throw new Error(
                `Streaming failed: ${streamError.message}. Please refresh and try again.`,
              );
            }
          }
        }

        // Validate data received (skip for real streaming since we already handled it)
        if (!data || !data.content) {
          console.error("No data received from AI service");
          console.error("Debug - hasReceivedData:", hasReceivedData);
          console.error("Debug - data:", data);
          throw new Error(
            "No response received from AI service. The AI provider may be experiencing issues. Please try again.",
          );
        }

        // STEP 2: AI succeeded! Commit the reserved credit BEFORE any early returns
        console.log("AI response successful! Committing reserved credit...");
        const commitResult = await commitReservedCredit(userEmail);
        creditCommitted = true;
        if (commitResult.success) {
          setCredits(commitResult.newBalance);
          console.log(
            `Credit committed! New balance: ${commitResult.newBalance}`,
          );
        } else {
          console.error("Failed to commit credit:", commitResult.error);
        }

        // Skip duplicate processing if already rendered via streaming
        if (data._alreadyRendered) {
          console.log(
            "✅ Message already rendered via real streaming, skipping duplicate processing",
          );
          // Clear the "taking longer" timer
          clearTimeout(longerTimer);
          setIsTakingLonger(false);
          return; // Exit early
        }

        // For SubAgent mode, verify we got content
        if (isSubAgentMode && !hasReceivedData) {
          console.error("SubAgent Mode Error: No data received");
          throw new Error(
            "No response received from AI service. Please try again or disable SubAgent mode.",
          );
        }

        console.log(
          "AI Response data received:",
          !!data.choices || !!data.content,
        );
        console.log("Search sources from API:", data.sources?.length || 0);

        let aiContent = "";
        let isPublishable = false;
        let webSources = data.sources || [];

        try {
          // Check if API already provided parsed content (which it does)
          // Check if API already provided parsed content (which it does)
          if (data.content) {
            // Use the already parsed content from API
            aiContent = data.content;

            // CRITICAL FIX: Sometimes the "content" itself is a JSON string if the AI double-encoded it
            if (
              typeof aiContent === "string" &&
              (aiContent.trim().startsWith("{") ||
                aiContent.trim().startsWith("```json"))
            ) {
              try {
                const cleanInner = aiContent
                  .replace(/```json\n?|\n?```/g, "")
                  .trim();
                const innerParsed = JSON.parse(cleanInner);
                if (innerParsed.content) {
                  aiContent = innerParsed.content;
                  if (innerParsed.suggested_followups)
                    setSuggestedFollowups(innerParsed.suggested_followups);
                  // Update publishable if present in inner JSON
                  if (innerParsed.publishable !== undefined)
                    isPublishable = !!innerParsed.publishable;
                }
              } catch (e) {
                console.log(
                  "Content looked like JSON but failed to parse, using as raw text",
                );
              }
            }

            isPublishable = !!data.publishable;
            if (
              data.suggested_followups &&
              data.suggested_followups.length > 0
            ) {
              setSuggestedFollowups(data.suggested_followups);
            }
          } else {
            // Fallback to parsing from choices if content field is missing
            let aiRaw = data.choices?.[0]?.message?.content || "";
            if (aiRaw) {
              // Remove any markdown code blocks if present
              const cleanJson = aiRaw.replace(/```json\n?|\n?```/g, "").trim();

              // Try to parse as JSON
              let parsed = null;
              try {
                parsed = JSON.parse(cleanJson);
              } catch (parseError) {
                // If direct parsing fails, try again with cleaned string
                try {
                  parsed = JSON.parse(aiRaw);
                } catch (secondError) {
                  // If all parsing fails, treat as raw text
                  console.warn("Could not parse as JSON, using raw text");
                  aiContent = aiRaw;
                  isPublishable = aiRaw && aiRaw.length > 200;
                }
              }

              if (parsed && parsed.content) {
                aiContent = parsed.content;
                isPublishable = !!parsed.publishable;
                if (parsed.suggested_followups)
                  setSuggestedFollowups(parsed.suggested_followups);
              } else {
                aiContent = aiRaw;
                isPublishable = aiRaw && aiRaw.length > 200;
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse AI response:", e);
          // Fallback to raw text
          const aiRaw = data.choices?.[0]?.message?.content || "";
          aiContent = aiRaw;
          isPublishable = aiRaw && aiRaw.length > 200;
        }

        // Combine guide sources and intelligent fetch sources
        const allSources = [
          ...sources, // Guide sources
          ...webSources.map((s) => ({
            title:
              s.url.split("/").filter(Boolean).pop()?.substring(0, 50) ||
              "Source",
            url: s.url,
            method: s.method,
            isIntelligentSource: true,
          })),
        ];

        // Add sources section with clickable links
        if (allSources.length > 0) {
          aiContent += "\n\n---\n\n**📚 Sources Used:**\n";
          allSources.forEach((source, idx) => {
            if (source.isIntelligentSource) {
              // Intelligent sources with external link
              const methodLabel =
                source.method === "ai-selected" ? "🎯 AI Selected" : "🔍 Found";
              aiContent += `${idx + 1}. [${source.title}](${source.url}) ${methodLabel}\n`;
            } else {
              // Guide sources with internal link
              const guideUrl = `/guide/${source.slug}`;
              aiContent += `${idx + 1}. [${source.title}](${guideUrl})\n`;
            }
          });
        }

        // Final safety check for empty content
        if (!aiContent || !aiContent.trim()) {
          aiContent =
            "I'm sorry, I couldn't generate a response to your query. Please try rephrasing your question or ask about a different programming topic.";
        }

        setIsThinking(false);
        setAgentPhase(null);
        setIsStreamingResponse(true);

        // Add message with streaming flag
        setMessages((prev) => {
          setStreamingMessageIndex(prev.length);
          return [
            ...prev,
            {
              role: "assistant",
              content: aiContent,
              timestamp: new Date().toISOString(),
              isStreaming: true,
              sources: allSources,
              publishable: isPublishable,
            },
          ];
        });

        // Log usage (credit already committed above)
        await logCreditUsage(
          userEmail,
          "AI Chat",
          `Query: ${userQuery.substring(0, 50)}${userQuery.length > 50 ? "..." : ""}`,
        );

        // Fire confetti second time - only if this is the first message
        if (
          messages.length === 1 &&
          confettiFireCount < 2 &&
          confettiRef.current
        ) {
          setTimeout(() => {
            confettiRef.current?.fire({
              particleCount: 25,
              origin: { x: 0.5, y: 0.4 },
            });
            setConfettiFireCount((prev) => prev + 1);
          }, 1000);
        }
      } catch (error) {
        console.error("AI error:", error);
        clearTimeout(longerTimer);
        setIsTakingLonger(false);
        setIsThinking(false);
        setAgentPhase(null);

        // STEP 3: Error occurred! Release the reserved credit (return it)
        if (!creditCommitted) {
          console.log("AI error! Releasing reserved credit back to user...");
          try {
            const releaseResult = await releaseReservedCredit(userEmail);
            if (releaseResult.success) {
              setCredits(releaseResult.creditsRemaining);
              console.log(
                `Credit released! Balance restored: ${releaseResult.creditsRemaining}`,
              );
            }
          } catch (releaseError) {
            console.error("Failed to release credit:", releaseError);
          }
        }

        // Provide intelligent error messages based on the error
        let errorMessage =
          "❌ **Error**: Sorry, there was an error processing your request. Your credit has been returned.\n\n*Please try again or contact support if the issue persists.*";

        if (
          error.message.includes("empty response") ||
          error.message.includes("no content received")
        ) {
          errorMessage =
            "🤖 The AI didn't generate a response this time. This can happen occasionally. **Your credit has been returned.** Please try rephrasing your question or try again.";
        } else if (error.message.includes("No response received")) {
          errorMessage =
            "⚠️ The AI service didn't respond properly. **Your credit has been returned.** Please try again in a moment.";
        } else if (error.message.includes("504")) {
          errorMessage =
            "🔄 The AI service is temporarily overwhelmed. We tried multiple times to reach it. **Your credit has been returned.** Please wait a moment and try again.";
        } else if (error.message.includes("502")) {
          errorMessage =
            "⚠️ The AI service returned an invalid response. **Your credit has been returned.** Please try again in a moment.";
        } else if (error.message.includes("503")) {
          errorMessage =
            "🔄 The AI service is temporarily unavailable. **Your credit has been returned.** Please wait a moment and try again.";
        } else if (error.message.includes("API error")) {
          const match = error.message.match(/API error: (\d+)/);
          if (match) {
            const status = match[1];
            if (status === "403") {
              errorMessage =
                "💳 Insufficient credits. Please refer friends to earn more credits.";
            } else if (status === "400") {
              errorMessage = "❌ Invalid request format. Please try again.";
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: errorMessage,
            timestamp: new Date().toISOString(),
            isStreaming: false,
            isError: true,
            errorDetails: error.message || "Unknown error",
          },
        ]);
      } finally {
        clearTimeout(longerTimer);
        setIsTakingLonger(false);
      }
    },
    [
      input,
      isAuthenticated,
      user?.email,
      credits,
      navigate,
      confettiFireCount,
      confettiRef,
    ],
  );

  // Mark streaming as complete and save conversation
  function handleStreamingComplete(index) {
    setMessages((prev) => {
      const updatedMessages = prev.map((msg, i) =>
        i === index ? { ...msg, isStreaming: false } : msg,
      );
      // Save conversation after streaming is complete
      saveConversation(updatedMessages);
      return updatedMessages;
    });
    setIsStreamingResponse(false);
    setStreamingMessageIndex(-1);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="zetsu-ai-page">
      <OnboardingModal />
      {/* SECURITY: Login Required Screen */}
      {!isAuthenticated() && (
        <div className="zetsu-ai-login-required">
          <div className="zetsu-ai-login-modal">
            <div className="zetsu-ai-login-icon">
              <Bot size={48} />
            </div>
            <h2>Login Required</h2>
            <p>You need to sign in to use ZetsuGuide AI.</p>
            <p className="zetsu-ai-login-subtitle">
              Get 5 free credits when you create an account!
            </p>
            <button
              className="zetsu-ai-login-action-btn"
              onClick={() => navigate("/auth")}
            >
              Sign In / Create Account
            </button>
            <button className="zetsu-ai-back-btn" onClick={() => navigate("/")}>
              ← Back to Home
            </button>
          </div>
        </div>
      )}

      {/* Referral Bonus Notification - Lazy loaded for performance */}
      {showReferralBonus && (
        <Suspense fallback={null}>
          <div
            className="referral-bonus-overlay"
            onClick={() => setShowReferralBonus(false)}
          >
            <div
              className="referral-bonus-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="referral-bonus-icon">🎉</div>
              <h2>Welcome Bonus!</h2>
              <p>
                You've been invited by a friend and received{" "}
                <strong>5 free credits</strong> to use ZetsuGuide AI!
              </p>
              <p className="referral-bonus-note">
                Your friend has also received 5 bonus credits. Thank you for
                joining!
              </p>
              <button
                className="referral-bonus-btn"
                onClick={() => setShowReferralBonus(false)}
              >
                Start Using ZetsuGuide AI
              </button>
            </div>
          </div>
        </Suspense>
      )}

      {/* Daily Gift Modal */}
      <DailyGiftModal
        isOpen={showDailyGiftModal}
        onClose={() => setShowDailyGiftModal(false)}
        onClaim={handleDailyGiftClaim}
      />

      {/* Publish to Guide Modal */}
      {showPublishModal && (
        <div className="zetsu-publish-overlay" onClick={closePublishModal}>
          <div
            className="zetsu-publish-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="zetsu-publish-close" onClick={closePublishModal}>
              <X size={20} />
            </button>

            <div className="zetsu-publish-header">
              <img
                src="/images/submittoreview.gif"
                alt="Publishing"
                className="zetsu-publish-header-icon"
              />
              <h2>
                {publishComplete ? "🎉 Published!" : "📤 Publishing Guide"}
              </h2>
            </div>

            <div className="zetsu-publish-steps">
              {/* Step 1: Generating Title */}
              <div
                className={`zetsu-publish-step ${publishStep >= 1 ? "active" : ""} ${publishStep > 1 ? "completed" : ""}`}
              >
                <div className="zetsu-step-indicator">
                  {publishStep > 1 ? (
                    "✓"
                  ) : publishStep === 1 ? (
                    <span className="zetsu-step-spinner"></span>
                  ) : (
                    "1"
                  )}
                </div>
                <div className="zetsu-step-content">
                  <span className="zetsu-step-title">Generating Title</span>
                  {publishStep >= 1 && publishData.title && (
                    <span className="zetsu-step-result">
                      "{publishData.title}"
                    </span>
                  )}
                </div>
              </div>

              {/* Step 2: Extracting Keywords */}
              <div
                className={`zetsu-publish-step ${publishStep >= 2 ? "active" : ""} ${publishStep > 2 ? "completed" : ""}`}
              >
                <div className="zetsu-step-indicator">
                  {publishStep > 2 ? (
                    "✓"
                  ) : publishStep === 2 ? (
                    <span className="zetsu-step-spinner"></span>
                  ) : (
                    "2"
                  )}
                </div>
                <div className="zetsu-step-content">
                  <span className="zetsu-step-title">Extracting Keywords</span>
                  {publishStep >= 2 && publishData.keywords.length > 0 && (
                    <div className="zetsu-step-keywords">
                      {publishData.keywords.map((kw, i) => (
                        <span key={i} className="zetsu-keyword-tag">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Formatting Content */}
              <div
                className={`zetsu-publish-step ${publishStep >= 3 ? "active" : ""} ${publishStep > 3 ? "completed" : ""}`}
              >
                <div className="zetsu-step-indicator">
                  {publishStep > 3 ? (
                    "✓"
                  ) : publishStep === 3 ? (
                    <span className="zetsu-step-spinner"></span>
                  ) : (
                    "3"
                  )}
                </div>
                <div className="zetsu-step-content">
                  <span className="zetsu-step-title">Formatting Content</span>
                  {publishStep >= 3 && (
                    <span className="zetsu-step-result">
                      Content ready for publishing
                    </span>
                  )}
                </div>
              </div>

              {/* Step 4: Publishing */}
              <div
                className={`zetsu-publish-step ${publishStep >= 4 ? "active" : ""} ${publishStep >= 5 ? "completed" : ""}`}
              >
                <div className="zetsu-step-indicator">
                  {publishStep >= 5 ? (
                    "✓"
                  ) : publishStep === 4 ? (
                    <span className="zetsu-step-spinner"></span>
                  ) : (
                    "4"
                  )}
                </div>
                <div className="zetsu-step-content">
                  <span className="zetsu-step-title">Publishing to Guides</span>
                  {publishStep >= 5 && (
                    <span className="zetsu-step-result zetsu-step-success">
                      Successfully published!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Error State */}
            {publishStep === -1 && (
              <div className="zetsu-publish-error">
                <span>❌ Failed to publish. Please try again.</span>
              </div>
            )}

            {/* Success Actions */}
            {publishComplete && publishedGuideSlug && (
              <div className="zetsu-publish-success">
                <Link
                  to={`/guide/${publishedGuideSlug}`}
                  className="zetsu-view-guide-btn"
                  onClick={closePublishModal}
                >
                  📖 View Your Guide
                </Link>
                <button className="zetsu-done-btn" onClick={closePublishModal}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="zetsu-ai-bg">
        <PixelTrail
          pixelSize={screenSize.lessThan("md") ? 30 : 50}
          fadeDuration={800}
          pixelClassName="bg-indigo-500"
        />
        <div className="zetsu-ai-grid"></div>
        <div className="zetsu-ai-glow zetsu-ai-glow-1"></div>
        <div className="zetsu-ai-glow zetsu-ai-glow-2"></div>
      </div>

      {/* Tutorial GIF Modal */}
      {showTutorialModal && (
        <div className="zetsu-tutorial-overlay" onClick={closeTutorialModal}>
          <div
            className="zetsu-tutorial-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="zetsu-tutorial-close"
              onClick={closeTutorialModal}
            >
              <X size={20} />
            </button>
            <div className="zetsu-tutorial-content">
              <h2>🎬 How to Use ZetsuGuide AI</h2>
              <p>Learn how to write prompts and get amazing answers!</p>
              <div className="zetsu-tutorial-gif-container">
                <img
                  src="/images/zetsuAIpresentation.gif"
                  alt="ZetsuGuide AI Tutorial"
                  className="zetsu-tutorial-gif"
                />
              </div>
              <button
                className="zetsu-tutorial-close-btn"
                onClick={closeTutorialModal}
              >
                Got it! Let's get started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat History Sidebar */}
      {showHistory && isAuthenticated() && (
        <div
          className="zetsu-history-overlay"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="zetsu-history-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="zetsu-history-header">
              <h3>
                <History size={20} /> Chat History
              </h3>
              <button
                className="zetsu-history-close"
                onClick={() => setShowHistory(false)}
              >
                <X size={20} />
              </button>
            </div>

            <button className="zetsu-history-new-chat" onClick={startNewChat}>
              <Plus size={18} />
              <span>New Chat</span>
            </button>

            <div className="zetsu-history-list">
              {isLoadingHistory ? (
                <div className="zetsu-history-loading">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="zetsu-history-empty">
                  <MessageSquare size={32} />
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`zetsu-history-item ${conv.id === currentConversationId ? "active" : ""}`}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="zetsu-history-item-content">
                      <span className="zetsu-history-item-title">
                        {conv.title}
                      </span>
                      <span className="zetsu-history-item-date">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="zetsu-history-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="zetsu-ai-header">
        <div className="zetsu-ai-header-left">
          {isAuthenticated() && (
            <button
              className="zetsu-ai-history-btn"
              onClick={() => setShowHistory(true)}
              title="Chat History"
            >
              <Menu size={20} />
            </button>
          )}
          <Link
            to="/"
            className="zetsu-ai-brand"
            style={{
              background: "none",
              border: "none",
              textDecoration: "none",
            }}
          >
            <div
              className="zetsu-ai-logo"
              style={{
                width: 50,
                height: 50,
                background: "transparent",
                border: "none",
              }}
            >
              <Lottie
                animationData={aiLogoAnimation}
                loop={true}
                autoplay={true}
                style={{ width: "100%", height: "100%" }}
                rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
              />
            </div>
            <div className="zetsu-ai-title">
              <h1>ZetsuGuide AI</h1>
              <span className="zetsu-ai-badge">BETA</span>
            </div>
          </Link>
        </div>

        <div className="zetsu-ai-user-section">
          {isAuthenticated() && (
            <button
              className="zetsu-ai-help-btn"
              onClick={openTutorial}
              title="How to use ZetsuGuide AI"
            >
              <HelpCircle size={18} />
            </button>
          )}
          {isAuthenticated() && (
            <button
              className="zetsu-ai-new-chat-btn"
              onClick={startNewChat}
              title="New Chat"
            >
              <Plus size={18} />
              <span>New Chat</span>
            </button>
          )}
          <Link to="/pricing" className="zetsu-ai-credits">
            <Zap size={16} />
            <span>{creditsLoading ? "... Credits" : `${credits} Credits`}</span>
          </Link>

          {isAuthenticated() ? (
            <div
              className="zetsu-profile-wrapper"
              style={{ position: "relative" }}
            >
              <div
                className="zetsu-ai-user"
                onClick={() => setShowProfileModal(!showProfileModal)}
                style={{ cursor: "pointer" }}
              >
                <div className="zetsu-ai-avatar">
                  <img
                    src={getAvatarForUser(user?.email, userProfile?.avatar_url)}
                    alt="Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <span className="zetsu-ai-username">
                  {user?.name || "User"}
                </span>
              </div>

              {/* Profile Popover */}
              {showProfileModal && (
                <>
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      zIndex: 40,
                      cursor: "default",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowProfileModal(false);
                      setShowUsageHistory(false);
                    }}
                  />
                  <div className="zetsu-profile-popover">
                    {!showUsageHistory ? (
                      <>
                        {/* Normal Profile View */}
                        <div className="zetsu-popover-header">
                          <div className="zetsu-popover-user">
                            <div className="zetsu-popover-avatar">
                              <img
                                src={getAvatarForUser(
                                  user?.email,
                                  userProfile?.avatar_url,
                                )}
                                alt="Avatar"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                            <div className="zetsu-popover-info">
                              <span className="zetsu-popover-name">
                                {user?.name || "User"}
                              </span>
                              <span className="zetsu-popover-email">
                                {user?.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="zetsu-popover-credits">
                          <div className="zetsu-credits-header">
                            <span>Available Credits</span>
                            <span className="zetsu-credits-count">
                              {credits}
                            </span>
                          </div>
                          <div className="zetsu-credits-bar">
                            <div
                              className="zetsu-credits-fill"
                              style={{
                                width: `${Math.min((credits / 10) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <div
                            className="zetsu-credits-usage"
                            onClick={async () => {
                              setIsLoadingLogs(true);
                              setShowUsageHistory(true);
                              if (user?.email) {
                                const logs = await fetchUsageLogs(user.email);
                                setUsageLogs(logs);
                              }
                              // Load credits with referral data
                              if (user) {
                                const creditData = await getCreditsFromDB(user);
                                setCredits(creditData.credits || 5);
                                setTotalReferrals(
                                  creditData.total_referrals || 0,
                                );
                                setReferralEarnings(
                                  (creditData.total_referrals || 0) * 5,
                                );
                              } else {
                                setCredits(5);
                                setTotalReferrals(0);
                                setReferralEarnings(0);
                              }
                              setIsLoadingLogs(false);
                            }}
                          >
                            <span>Usage</span>
                            <ArrowRight size={14} />
                          </div>
                        </div>

                        <Link
                          to="/pricing"
                          className="zetsu-upgrade-btn-popover"
                        >
                          <Zap size={16} fill="currentColor" />
                          <span>Upgrade Plan</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        {/* History View - with Tabs */}
                        <div className="zetsu-popover-header">
                          <div
                            className="zetsu-popover-back"
                            onClick={() => setShowUsageHistory(false)}
                          >
                            <ArrowRight size={16} className="rotate-180" />
                            <span>Back to Profile</span>
                          </div>
                          {/* Tabs */}
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginTop: "12px",
                              borderBottom: "1px solid rgba(255,255,255,0.1)",
                              paddingBottom: "8px",
                            }}
                          >
                            <button
                              onClick={() => setHistoryTab("usage")}
                              style={{
                                flex: 1,
                                padding: "8px",
                                background:
                                  historyTab === "usage"
                                    ? "rgba(255,255,255,0.1)"
                                    : "transparent",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                fontSize: "0.85rem",
                                fontWeight:
                                  historyTab === "usage" ? "600" : "400",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                            >
                              💸 Spent
                            </button>
                            <button
                              onClick={() => setHistoryTab("credits")}
                              style={{
                                flex: 1,
                                padding: "8px",
                                background:
                                  historyTab === "credits"
                                    ? "rgba(255,255,255,0.1)"
                                    : "transparent",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                fontSize: "0.85rem",
                                fontWeight:
                                  historyTab === "credits" ? "600" : "400",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                            >
                              🎁 Earned
                            </button>
                          </div>
                        </div>

                        {/* Usage History (Spent Credits) */}
                        {historyTab === "usage" && (
                          <div className="zetsu-usage-list">
                            {isLoadingLogs ? (
                              <div className="zetsu-usage-loading">
                                Loading...
                              </div>
                            ) : usageLogs.length === 0 ? (
                              <div className="zetsu-usage-empty">
                                No usage history
                              </div>
                            ) : (
                              usageLogs.map((log, idx) => (
                                <div key={idx} className="zetsu-usage-item">
                                  <div className="zetsu-usage-info">
                                    <span className="zetsu-usage-action">
                                      {log.action || "AI Chat"}
                                    </span>
                                    <span className="zetsu-usage-date">
                                      {new Date(
                                        log.created_at,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <span className="zetsu-usage-cost">
                                    -{log.cost || 1}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Credit History (Earned Credits) */}
                        {historyTab === "credits" && (
                          <div className="zetsu-usage-list">
                            <div className="zetsu-usage-item">
                              <div className="zetsu-usage-info">
                                <span className="zetsu-usage-action">
                                  🎁 Welcome Bonus
                                </span>
                                <span className="zetsu-usage-date">
                                  On signup
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: "600",
                                  color: "#4ade80",
                                }}
                              >
                                +5
                              </span>
                            </div>
                            {user?.user_metadata?.referral_completed && (
                              <div className="zetsu-usage-item">
                                <div className="zetsu-usage-info">
                                  <span className="zetsu-usage-action">
                                    🎉 Referred Bonus
                                  </span>
                                  <span className="zetsu-usage-date">
                                    Accepted invite
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: "#4ade80",
                                  }}
                                >
                                  +5
                                </span>
                              </div>
                            )}
                            {totalReferrals > 0 && (
                              <div className="zetsu-usage-item">
                                <div className="zetsu-usage-info">
                                  <span className="zetsu-usage-action">
                                    👥 Referral Earnings
                                  </span>
                                  <span className="zetsu-usage-date">
                                    From {totalReferrals} friend
                                    {totalReferrals !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    color: "#4ade80",
                                  }}
                                >
                                  +{referralEarnings}
                                </span>
                              </div>
                            )}
                            {!user?.user_metadata?.referral_completed &&
                              totalReferrals === 0 && (
                                <div
                                  style={{
                                    textAlign: "center",
                                    padding: "20px 0",
                                    color: "rgba(255,255,255,0.5)",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <p>No referral bonus yet.</p>
                                  <p>Get one by using a referral link!</p>
                                </div>
                              )}
                          </div>
                        )}
                      </>
                    )}

                    <style>{`
                                            .zetsu-profile-popover {
                                                position: absolute;
                                                top: 120%;
                                                right: 0;
                                                width: 300px;
                                                min-height: 200px;
                                                background: #1a1a1a;
                                                border: 1px solid rgba(255,255,255,0.1);
                                                border-radius: 16px;
                                                box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
                                                padding: 16px;
                                                z-index: 50;
                                                animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                                                display: flex;
                                                flex-direction: column;
                                            }

                                            .zetsu-popover-header {
                                                padding-bottom: 16px;
                                                border-bottom: 1px solid rgba(255,255,255,0.1);
                                                margin-bottom: 16px;
                                            }

                                            .zetsu-popover-user {
                                                display: flex;
                                                align-items: center;
                                                gap: 12px;
                                            }

                                            .zetsu-popover-avatar {
                                                width: 40px;
                                                height: 40px;
                                                border-radius: 50%;
                                                background: rgba(255,255,255,0.1);
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                font-weight: 600;
                                                font-size: 1.1rem;
                                                color: white;
                                                overflow: hidden;
                                            }

                                            .zetsu-popover-info {
                                                display: flex;
                                                flex-direction: column;
                                            }

                                            .zetsu-popover-name {
                                                font-weight: 600;
                                                color: white;
                                                font-size: 0.95rem;
                                            }

                                            .zetsu-popover-email {
                                                font-size: 0.8rem;
                                                color: rgba(255,255,255,0.5);
                                                max-width: 180px;
                                                overflow: hidden;
                                                text-overflow: ellipsis;
                                                white-space: nowrap;
                                            }

                                            .zetsu-popover-credits {
                                                background: rgba(255,255,255,0.03);
                                                border-radius: 12px;
                                                padding: 12px;
                                                margin-bottom: 12px;
                                            }

                                            .zetsu-credits-header {
                                                display: flex;
                                                justify-content: space-between;
                                                align-items: center;
                                                margin-bottom: 8px;
                                                font-size: 0.85rem;
                                                color: rgba(255,255,255,0.7);
                                            }

                                            .zetsu-credits-count {
                                                font-weight: 700;
                                                color: white;
                                                font-size: 1rem;
                                            }

                                            .zetsu-credits-bar {
                                                height: 6px;
                                                background: rgba(255,255,255,0.1);
                                                border-radius: 3px;
                                                margin-bottom: 8px;
                                                overflow: hidden;
                                            }

                                            .zetsu-credits-fill {
                                                height: 100%;
                                                background: #4ade80;
                                                border-radius: 3px;
                                                transition: width 0.3s ease;
                                            }

                                            .zetsu-credits-usage {
                                                display: flex;
                                                justify-content: flex-end;
                                                align-items: center;
                                                gap: 4px;
                                                font-size: 0.75rem;
                                                color: rgba(255,255,255,0.4);
                                                cursor: pointer;
                                                transition: color 0.2s;
                                            }

                                            .zetsu-credits-usage:hover {
                                                color: #fff;
                                            }

                                            .zetsu-upgrade-btn-popover {
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                gap: 8px;
                                                width: 100%;
                                                padding: 10px;
                                                background: linear-gradient(135deg, #a855f7, #ec4899);
                                                border-radius: 10px;
                                                color: white;
                                                font-weight: 600;
                                                font-size: 0.9rem;
                                                text-decoration: none;
                                                transition: all 0.2s;
                                            }

                                            .zetsu-upgrade-btn-popover:hover {
                                                transform: translateY(-2px);
                                                box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
                                            }

                                            /* Usage History Styles */
                                            .zetsu-popover-back {
                                                display: flex;
                                                align-items: center;
                                                gap: 8px;
                                                cursor: pointer;
                                                color: rgba(255,255,255,0.8);
                                                font-size: 0.9rem;
                                                font-weight: 500;
                                                transition: color 0.2s;
                                            }

                                            .zetsu-popover-back:hover {
                                                color: #fff;
                                            }

                                            .rotate-180 {
                                                transform: rotate(180deg);
                                            }

                                            .zetsu-usage-list {
                                                flex: 1;
                                                overflow-y: auto;
                                                max-height: 200px;
                                            }

                                            .zetsu-usage-item {
                                                display: flex;
                                                justify-content: space-between;
                                                align-items: center;
                                                padding: 8px 0;
                                                border-bottom: 1px solid rgba(255,255,255,0.05);
                                            }

                                            .zetsu-usage-item:last-child {
                                                border-bottom: none;
                                            }

                                            .zetsu-usage-info {
                                                display: flex;
                                                flex-direction: column;
                                            }

                                            .zetsu-usage-action {
                                                font-size: 0.85rem;
                                                color: rgba(255,255,255,0.9);
                                            }

                                            .zetsu-usage-date {
                                                font-size: 0.75rem;
                                                color: rgba(255,255,255,0.5);
                                            }

                                            .zetsu-usage-cost {
                                                font-size: 0.85rem;
                                                font-weight: 600;
                                                color: #ef4444;
                                            }

                                            .zetsu-usage-loading, .zetsu-usage-empty {
                                                text-align: center;
                                                color: rgba(255,255,255,0.5);
                                                padding: 20px 0;
                                                font-size: 0.9rem;
                                            }

                                            @keyframes popIn {
                                                from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                                                to { opacity: 1; transform: translateY(0) scale(1); }
                                            }
                                        `}</style>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="zetsu-ai-login-btn"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Publish to Guide Modal */}
      {showPublishModal && (
        <div className="zetsu-publish-overlay" onClick={closePublishModal}>
          <div
            className="zetsu-publish-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="zetsu-publish-close" onClick={closePublishModal}>
              <X size={20} />
            </button>

            <div className="zetsu-publish-header">
              <div className="zetsu-publish-anim-container">
                <Lottie
                  animationData={guidePublishAnimation}
                  loop={!publishComplete}
                  autoplay={true}
                  style={{ width: 120, height: 120 }}
                />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                {publishComplete
                  ? "🎉 Published Successfully!"
                  : "Creating Your Guide..."}
              </h2>
            </div>

            <div className="zetsu-publish-steps-container">
              {/* Step 1: Generating Title */}
              <div
                className={`zetsu-modern-step ${publishStep >= 1 ? "active" : ""} ${publishStep > 1 ? "completed" : ""}`}
              >
                <div className="step-icon">
                  {publishStep > 1 ? (
                    <div className="check-mark">✓</div>
                  ) : (
                    <div className="spinner-ring"></div>
                  )}
                </div>
                <div className="step-info">
                  <span className="step-label">Generating Title</span>
                  {publishData.title && (
                    <span className="step-value">{publishData.title}</span>
                  )}
                </div>
              </div>

              {/* Step 2: Extracting Keywords */}
              <div
                className={`zetsu-modern-step ${publishStep >= 2 ? "active" : ""} ${publishStep > 2 ? "completed" : ""}`}
              >
                <div className="step-icon">
                  {publishStep > 2 ? (
                    <div className="check-mark">✓</div>
                  ) : (
                    <div className="spinner-ring"></div>
                  )}
                </div>
                <div className="step-info">
                  <span className="step-label">Extracting Keywords</span>
                  {publishData.keywords.length > 0 && (
                    <div className="step-tags">
                      {publishData.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="mini-tag">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Formatting */}
              <div
                className={`zetsu-modern-step ${publishStep >= 3 ? "active" : ""} ${publishStep > 3 ? "completed" : ""}`}
              >
                <div className="step-icon">
                  {publishStep > 3 ? (
                    <div className="check-mark">✓</div>
                  ) : (
                    <div className="spinner-ring"></div>
                  )}
                </div>
                <div className="step-info">
                  <span className="step-label">Formatting Content</span>
                </div>
              </div>

              {/* Step 4: Finalizing */}
              <div
                className={`zetsu-modern-step ${publishStep >= 4 ? "active" : ""} ${publishStep >= 5 ? "completed" : ""}`}
              >
                <div className="step-icon">
                  {publishStep >= 5 ? (
                    <div className="check-mark">✓</div>
                  ) : (
                    <div className="spinner-ring"></div>
                  )}
                </div>
                <div className="step-info">
                  <span className="step-label">Publishing to Database</span>
                </div>
              </div>
            </div>

            {/* Success Actions */}
            {publishComplete && publishedGuideSlug && (
              <div className="zetsu-publish-actions fade-in-up">
                <Link
                  to={`/guide/${publishedGuideSlug}`}
                  className="zetsu-view-btn"
                  onClick={closePublishModal}
                >
                  <span>View Guide</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

            <style>{`
                            .glass-panel {
                                background: rgba(20, 20, 20, 0.85);
                                backdrop-filter: blur(20px);
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                                border-radius: 24px;
                                padding: 2rem;
                                width: 100%;
                                max-width: 450px;
                                color: white;
                                overflow: hidden;
                                position: relative;
                            }

                            .glass-panel::before {
                                content: '';
                                position: absolute;
                                top: 0; left: 0; right: 0; height: 1px;
                                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                            }

                            .zetsu-publish-header {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                margin-bottom: 2rem;
                            }

                            .zetsu-publish-anim-container {
                                margin-bottom: 1rem;
                                filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.4));
                            }

                            .zetsu-modern-step {
                                display: flex;
                                align-items: flex-start;
                                gap: 1rem;
                                padding: 0.75rem;
                                margin-bottom: 0.5rem;
                                border-radius: 12px;
                                transition: all 0.3s;
                                opacity: 0.4;
                            }

                            .zetsu-modern-step.active {
                                opacity: 1;
                                background: rgba(255, 255, 255, 0.05);
                            }

                            .zetsu-modern-step.completed {
                                opacity: 1;
                            }

                            .step-icon {
                                width: 24px;
                                height: 24px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }

                            .spinner-ring {
                                width: 18px;
                                height: 18px;
                                border: 2px solid rgba(255,255,255,0.2);
                                border-top-color: #fff;
                                border-radius: 50%;
                                animation: spin 1s linear infinite;
                            }

                            .check-mark {
                                color: #4ade80;
                                font-weight: bold;
                                scale: 1.2;
                            }

                            .step-info {
                                display: flex;
                                flex-direction: column;
                            }

                            .step-label {
                                font-weight: 500;
                                font-size: 0.95rem;
                            }

                            .step-value {
                                font-size: 0.8rem;
                                color: rgba(255,255,255,0.6);
                                margin-top: 2px;
                            }

                            .step-tags {
                                display: flex;
                                gap: 4px;
                                margin-top: 4px;
                            }

                            .mini-tag {
                                background: rgba(255,255,255,0.1);
                                padding: 2px 6px;
                                border-radius: 4px;
                                font-size: 0.7rem;
                                color: rgba(255,255,255,0.8);
                            }

                            .zetsu-view-btn {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                                width: 100%;
                                padding: 12px;
                                background: linear-gradient(135deg, #a855f7, #ec4899);
                                border-radius: 12px;
                                color: white;
                                font-weight: 600;
                                transition: all 0.3s;
                                margin-top: 1rem;
                            }

                            .zetsu-view-btn:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 10px 20px -5px rgba(236, 72, 153, 0.4);
                            }

                            @keyframes spin { to { transform: rotate(360deg); } }
                            .fade-in-up { animation: fadeInUp 0.5s ease; }
                        `}</style>
          </div>
        </div>
      )}

      {/* Add Prompt Modal */}
      {showPromptModal && (
        <div
          className="zetsu-prompt-modal-overlay"
          onClick={() => setShowPromptModal(false)}
        >
          <div
            className="zetsu-prompt-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>✨ Add New Prompt</h3>
            <p>Create a custom prompt for quick access</p>

            <div className="zetsu-prompt-emoji-picker">
              <span>Emoji:</span>
              <div className="zetsu-emoji-options">
                {[
                  "💡",
                  "🚀",
                  "📝",
                  "🔍",
                  "⚡",
                  "🎯",
                  "💻",
                  "🛠️",
                  "📊",
                  "🌟",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    className={newPromptEmoji === emoji ? "active" : ""}
                    onClick={() => setNewPromptEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="zetsu-prompt-input"
              placeholder="Enter your prompt text..."
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              rows={3}
            />

            <div className="zetsu-prompt-modal-actions">
              <button
                className="zetsu-prompt-cancel"
                onClick={() => setShowPromptModal(false)}
              >
                Cancel
              </button>
              <button className="zetsu-prompt-save" onClick={saveNewPrompt}>
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="zetsu-ai-chat">
        {messages.length === 0 && !isThinking ? (
          <div className="zetsu-ai-welcome" style={{ position: "relative" }}>
            {/* Confetti Effect */}
            <Confetti
              ref={confettiRef}
              className="absolute inset-0 z-0"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "auto",
              }}
              onMouseEnter={() => {
                if (confettiFireCount < 2 && confettiRef.current) {
                  confettiRef.current?.fire({
                    particleCount: 25,
                    origin: { x: 0.5, y: 0.5 },
                  });
                  setConfettiFireCount((prev) => prev + 1);
                }
              }}
            />

            <div
              className="zetsu-ai-welcome-icon"
              style={{ position: "relative", zIndex: 1 }}
            >
              <Lottie
                animationData={robotAnimation}
                loop={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            {/* Beautiful greeting message with time-based personalization */}
            {user?.email && (
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "2rem",
                  fontSize: "1.3rem",
                  fontWeight: "500",
                  background:
                    "linear-gradient(135deg, #A07CFE 0%, #FE8FB5 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                  position: "relative",
                  zIndex: 1,
                  animation: "fadeInUp 0.8s ease-out 0.3s both",
                }}
              >
                {(() => {
                  const userName =
                    user.email.split("@")[0].charAt(0).toUpperCase() +
                    user.email.split("@")[0].slice(1);
                  const hour = new Date().getHours();

                  // Time-based greeting messages
                  let timeGreetings = [];
                  if (hour >= 5 && hour < 12) {
                    timeGreetings = [
                      `Good morning ${userName}! Ready to learn something new?`,
                      `Morning ${userName}! Let's start the day with some coding!`,
                      `Hey ${userName}! Time to solve some problems today!`,
                    ];
                  } else if (hour >= 12 && hour < 17) {
                    timeGreetings = [
                      `Good afternoon ${userName}! What can I help you with?`,
                      `Afternoon ${userName}! Let's keep the momentum going!`,
                      `Hey ${userName}! Ready for some afternoon learning?`,
                    ];
                  } else if (hour >= 17 && hour < 21) {
                    timeGreetings = [
                      `Good evening ${userName}! What's on your mind?`,
                      `Evening ${userName}! Let's tackle something cool!`,
                      `Hey ${userName}! How can I help this evening?`,
                    ];
                  } else {
                    timeGreetings = [
                      `Good night ${userName}! Still coding? I love the dedication!`,
                      `Night owl ${userName}! Let's build something amazing!`,
                      `Hey ${userName}! Working late? I'm here to help!`,
                    ];
                  }

                  return timeGreetings[
                    Math.floor(Math.random() * timeGreetings.length)
                  ];
                })()}
              </div>
            )}

            <h2 style={{ position: "relative", zIndex: 1 }}>
              <SparklesText
                colors={{ first: "#A07CFE", second: "#FE8FB5" }}
                sparklesCount={12}
              >
                Welcome to ZetsuGuide AI
              </SparklesText>
            </h2>
            <p style={{ position: "relative", zIndex: 1 }}>
              Ask me anything about programming, guides, or get help with your
              projects.
            </p>

            {/* Quick Prompts Section */}
            <div
              className="zetsu-prompts-section"
              style={{ position: "relative", zIndex: 1 }}
            >
              <div className="zetsu-prompts-header">
                <h3>⚡ Quick Prompts</h3>
                <ShimmerButton
                  onClick={() => setShowPromptModal(true)}
                  className="shadow-2xl text-sm px-4 py-2 h-auto"
                >
                  <span className="text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white flex items-center gap-2">
                    <Plus size={16} />
                    Add Prompt
                  </span>
                </ShimmerButton>
              </div>

              <div className="zetsu-ai-suggestions">
                {/* Default Prompts */}
                {defaultPrompts.map((prompt, idx) => (
                  <ShimmerButton
                    key={`default-${idx}`}
                    onClick={() => setInput(prompt.text)}
                    className="shadow-2xl text-sm px-4 py-3 h-auto font-medium"
                  >
                    <span className="text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white">
                      {prompt.emoji} {prompt.text}
                    </span>
                  </ShimmerButton>
                ))}

                {/* Saved Prompts */}
                {savedPrompts.map((prompt, idx) => (
                  <div key={`saved-${idx}`} className="zetsu-saved-prompt">
                    <ShimmerButton
                      onClick={() => setInput(prompt.text)}
                      className="shadow-2xl text-sm px-4 py-3 h-auto font-medium flex-1"
                    >
                      <span className="text-center text-sm leading-none font-medium tracking-tight whitespace-pre-wrap text-white">
                        {prompt.emoji} {prompt.text}
                      </span>
                    </ShimmerButton>
                    <button
                      className="zetsu-delete-prompt"
                      onClick={() => deletePrompt(idx)}
                      title="Delete prompt"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="zetsu-ai-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`zetsu-ai-message ${msg.role === "user" ? "zetsu-ai-message-user" : "zetsu-ai-message-ai"} ${isArabicText(msg.content) ? "rtl-message" : ""}`}
              >
                <div className="zetsu-ai-message-avatar">
                  {msg.role === "user" ? (
                    <img
                      src={getAvatarForUser(
                        user?.email,
                        userProfile?.avatar_url,
                      )}
                      alt="User"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "inherit",
                      }}
                    />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div className="zetsu-ai-message-content">
                  <div className="zetsu-ai-message-header">
                    <span className="zetsu-ai-message-name">
                      {msg.role === "user"
                        ? user?.name || "You"
                        : "ZetsuGuide AI"}
                    </span>
                  </div>
                  {msg.role === "assistant" && msg.isStreaming ? (
                    <StreamingText
                      text={msg.content}
                      onComplete={() => handleStreamingComplete(idx)}
                    />
                  ) : (
                    <>
                      <div
                        className={`zetsu-ai-message-text ${isArabicText(msg.content) ? "rtl-text" : ""}`}
                        dir={isArabicText(msg.content) ? "rtl" : "ltr"}
                        style={{
                          textAlign: isArabicText(msg.content)
                            ? "right"
                            : "left",
                          width: "100%",
                          display: "block",
                        }}
                      >
                        <MessageContent
                          content={msg.content}
                          isRtl={isArabicText(msg.content)}
                        />
                      </div>
                      {/* Publish to Guide button - for all AI messages */}
                      {msg.role === "assistant" &&
                        !msg.isStreaming &&
                        msg.publishable && (
                          <button
                            className="zetsu-publish-guide-btn group"
                            onClick={() => publishToGuide(msg.content)}
                            title="Publish as Guide"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 16px",
                              background: "rgba(255,255,255,0.1)",
                              borderRadius: "12px",
                              border: "1px solid rgba(255,255,255,0.2)",
                              transition: "all 0.2s",
                            }}
                          >
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Lottie
                                animationData={guidePublishAnimation}
                                loop={true}
                                autoplay={true}
                                style={{ width: 32, height: 32 }}
                              />
                            </div>
                            <span className="font-medium group-hover:text-purple-300 transition-colors">
                              {isArabicText(msg.content)
                                ? "نشر كدليل"
                                : "Publish as Guide"}
                            </span>
                          </button>
                        )}

                      {/* Error Message Actions - Report Bug & Retry */}
                      {msg.role === "assistant" &&
                        msg.isError &&
                        !msg.isStreaming && (
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              marginTop: "12px",
                              padding: "12px",
                              background: "rgba(239, 68, 68, 0.1)",
                              borderRadius: "12px",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "rgba(255,255,255,0.5)",
                                width: "100%",
                                marginBottom: "8px",
                              }}
                            >
                              💡 This might be a temporary issue. You can try
                              again or report it if it persists.
                            </span>

                            {/* Retry Button */}
                            <button
                              onClick={() => {
                                // Get the user's last message to retry
                                const lastUserMsg = messages
                                  .filter((m) => m.role === "user")
                                  .pop();
                                if (lastUserMsg) {
                                  setInput(lastUserMsg.content);
                                  // Remove the error message
                                  setMessages((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                }
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                background: "rgba(255,255,255,0.1)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: "8px",
                                color: "white",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseOver={(e) =>
                                (e.target.style.background =
                                  "rgba(255,255,255,0.2)")
                              }
                              onMouseOut={(e) =>
                                (e.target.style.background =
                                  "rgba(255,255,255,0.1)")
                              }
                            >
                              <RefreshCw size={14} />
                              Try Again
                            </button>

                            {/* Report Bug Button */}
                            <Link
                              to="/reportbug"
                              state={{
                                prefilledDescription: `AI Error Report (Auto-Generated)\n\nError Message: ${msg.content}\n\nError Details: ${msg.errorDetails || "Unknown"}\n\nTimestamp: ${msg.timestamp}\n\n---\nPlease add any additional details below:`,
                                issueType: "Technical Issue",
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                background:
                                  "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3))",
                                border: "1px solid rgba(239, 68, 68, 0.4)",
                                borderRadius: "8px",
                                color: "#fca5a5",
                                fontSize: "0.85rem",
                                fontWeight: "500",
                                textDecoration: "none",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                            >
                              <Bug size={14} />
                              Report This Issue
                            </Link>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Agent Thinking Process - Clean and Simple UI */}
            {isThinking && (
              <div className="zetsu-ai-message zetsu-ai-message-ai">
                <div className="zetsu-ai-message-avatar">
                  <Bot size={20} />
                </div>
                <div className="zetsu-ai-message-content">
                  <div className="zetsu-ai-message-header">
                    <span className="zetsu-ai-message-name">ZetsuGuide AI</span>
                  </div>

                  <div className="zetsu-agent-thinking">
                    {isSubAgentMode && subAgentStatus ? (
                      /* SUB-AGENT MODE - Simple Text Display */
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300">{subAgentStatus}</span>
                        <div className="zetsu-ai-thinking-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    ) : (
                      /* STANDARD DISPLAY - Enhanced */
                      <div className="zetsu-agent-standard-container">
                        <div className="zetsu-agent-standard-card">
                          <div className="zetsu-agent-standard-icon">
                            <img
                              src="/images/ai-thinking.gif"
                              alt="Thinking"
                              className="zetsu-agent-gif"
                            />
                          </div>
                          <div className="zetsu-agent-standard-content">
                            <div className="zetsu-agent-standard-text">
                              {agentPhase === AGENT_PHASES.INITIAL_THINKING && (
                                <span className="zetsu-agent-status">
                                  Initializing AI Processing...
                                </span>
                              )}
                              {agentPhase === AGENT_PHASES.BRAINSTORMING && (
                                <span className="zetsu-agent-status">
                                  🧠 Brainstorming Research Strategies
                                </span>
                              )}
                              {agentPhase === AGENT_PHASES.RESEARCHING && (
                                <span className="zetsu-agent-status">
                                  🌐 Exploring Knowledge Sources
                                </span>
                              )}
                              {agentPhase === AGENT_PHASES.ANALYZING && (
                                <span className="zetsu-agent-status">
                                  📊 Analyzing Information
                                </span>
                              )}
                              {agentPhase === AGENT_PHASES.READING_SOURCE && (
                                <span className="zetsu-agent-status">
                                  📖 Deep-Reading Content
                                </span>
                              )}
                              {agentPhase === AGENT_PHASES.RESPONDING && (
                                <span className="zetsu-agent-status">
                                  {isImageGenEnabled ? (
                                    <>🎨 Generating Response & Visuals</>
                                  ) : (
                                    <>✨ Generating Response</>
                                  )}
                                </span>
                              )}
                            </div>
                            {agentPhase !== AGENT_PHASES.FOUND_GUIDES && (
                              <div className="zetsu-agent-standard-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="zetsu-followups-wrapper">
              {!isThinking &&
                suggestedFollowups.length > 0 &&
                messages.length > 0 && (
                  <div className="zetsu-followups-container fade-in-up">
                    <span className="zetsu-followups-label">
                      ✨ Suggested follow-ups:
                    </span>
                    <div className="zetsu-followups-list">
                      {suggestedFollowups.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className="zetsu-followup-chip"
                          onClick={() => {
                            setInput(suggestion);
                            if (inputRef.current) inputRef.current.focus();
                          }}
                        >
                          {suggestion} <ArrowRight size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="zetsu-ai-input-area">
        <div className="zetsu-ai-input-form relative">
          {/* Deep Reasoning Demo Video */}
          {isDeepReasoning && isDemoVideoVisible && (
            <div className="absolute bottom-full mb-4 left-0 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 z-40">
              <div className="relative w-full max-w-lg mx-auto bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 shadow-2xl group">
                <div className="absolute top-2 right-2 z-50">
                  <button
                    onClick={() => setIsDemoVideoVisible(false)}
                    className="p-1 bg-black/60 hover:bg-red-500/80 text-white rounded-full transition-colors backdrop-blur-sm"
                    title="Close Demo"
                  >
                    <X size={14} />
                  </button>
                </div>
                <video
                  src={demoVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  style={{ maxHeight: "250px" }}
                />
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex items-center gap-2">
                    <BrainCircuit size={14} className="text-purple-400" />
                    <span className="text-xs font-semibold text-white/90">
                      Deep Reasoning Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reopen Demo Button (only if closed and deep reasoning is on) */}
          {isDeepReasoning && !isDemoVideoVisible && (
            <div className="absolute bottom-full mb-2 right-0 animate-in fade-in zoom-in duration-300 z-40">
              <button
                onClick={() => setIsDemoVideoVisible(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 hover:bg-black border border-white/10 rounded-full backdrop-blur-md text-[10px] text-zinc-300 hover:text-white transition-all hover:scale-105 shadow-lg"
              >
                <Info size={10} />
                <span>Show Demo</span>
              </button>
            </div>
          )}

          <PlaceholdersAndVanishInput
            placeholders={[
              "Ask me anything about programming...",
              "How do I use React Hooks?",
              "Explain JavaScript async/await",
              "What's the best way to learn Python?",
              "Help me with CSS Flexbox",
              "How to use Git branches?",
            ]}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSubmit={handleSubmit}
            disabled={isThinking}
            inputRef={inputRef}
            tools={
              <div className="relative">
                {/* Tools Toggle Button */}
                <button
                  type="button"
                  onMouseEnter={handleToolsMouseEnter}
                  onMouseLeave={handleToolsMouseLeave}
                  className={`p-2 rounded-full transition-all duration-300 ${isToolsOpen ? "bg-white/10 text-white rotate-90" : "text-zinc-500 hover:text-white hover:bg-white/5"}`}
                  title="AI Tools & Configuration"
                >
                  <Settings2 size={20} />
                </button>
              </div>
            }
          />

          {/* Tools Popover Menu - Rendered OUTSIDE the input to avoid overflow:hidden clipping */}
          {isToolsOpen && (
            <div
              className="absolute bottom-full right-0 mb-3 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-50 overflow-hidden"
              onMouseEnter={handleToolsMouseEnter}
              onMouseLeave={handleToolsMouseLeave}
            >
              <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  AI Configuration
                </h4>
              </div>

              <div className="p-2 space-y-1">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-md ${isDeepReasoning ? "bg-purple-500/20 text-purple-400" : "bg-zinc-800 text-zinc-400"}`}
                    >
                      <BrainCircuit size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-200 font-medium">
                        Deep Reasoning
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        3-Stage detailed analysis
                      </span>
                    </div>
                  </div>
                  <label
                    className="zetsu-switch"
                    style={{ transform: "scale(0.8)" }}
                  >
                    <input
                      type="checkbox"
                      checked={isDeepReasoning}
                      onChange={(e) => {
                        setIsDeepReasoning(e.target.checked);
                        if (e.target.checked) setIsSubAgentMode(false); // Mutual exclusion
                      }}
                      disabled={isThinking || isSubAgentMode}
                    />
                    <span className="zetsu-slider round"></span>
                  </label>
                </div>

                {/* SubAgent Mode (5-Stage) */}
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-md ${isSubAgentMode ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-800 text-zinc-400"}`}
                    >
                      <Bot size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-200 font-medium">
                        SubAgent Mode
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        5-Agent Advanced Pipeline
                      </span>
                    </div>
                  </div>
                  <label
                    className="zetsu-switch"
                    style={{ transform: "scale(0.8)" }}
                  >
                    <input
                      type="checkbox"
                      checked={isSubAgentMode}
                      onChange={(e) => {
                        setIsSubAgentMode(e.target.checked);
                        if (e.target.checked) setIsDeepReasoning(false); // Mutual exclusion
                      }}
                      disabled={isThinking || isDeepReasoning}
                    />
                    <span className="zetsu-slider round"></span>
                  </label>
                </div>

                {/* Prompt Enhancer */}
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-md ${isEnhancing ? "bg-amber-500/20 text-amber-400 animate-pulse" : "bg-zinc-800 text-zinc-400"}`}
                    >
                      <Wand2
                        size={16}
                        className={isEnhancing ? "animate-spin-slow" : ""}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-200 font-medium">
                        Prompt Enhancer
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Auto-optimize your question
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleEnhancePrompt}
                    disabled={!input.trim() || isEnhancing || isThinking}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      !input.trim()
                        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:scale-105 shadow-lg shadow-orange-500/20"
                    }`}
                  >
                    {isEnhancing ? "Enhancing..." : "Enhance"}
                  </button>
                </div>

                {/* Dynamic Image Generation */}
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-md ${isImageGenEnabled ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-400"}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <circle cx="9" cy="9" r="2"></circle>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-200 font-medium">
                        Image Generation
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Auto-generate visuals
                      </span>
                    </div>
                  </div>
                  <label
                    className="zetsu-switch"
                    style={{ transform: "scale(0.8)" }}
                  >
                    <input
                      type="checkbox"
                      checked={isImageGenEnabled}
                      onChange={(e) => setIsImageGenEnabled(e.target.checked)}
                      disabled={isThinking}
                    />
                    <span className="zetsu-slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
          {/* Sailboat Animation */}
          {messages.length === 0 && (
            <div
              className={`sailboat-animation-container ${isThinking || isStreamingResponse ? "sailboat-fade-out" : ""}`}
            >
              <Lottie
                animationData={sailboatAnimation}
                loop={true}
                autoplay={true}
                style={{
                  width: "120px",
                  height: "80px",
                }}
              />
            </div>
          )}
          <p className="zetsu-ai-disclaimer">
            ZetsuGuide AI can make mistakes. Check important info.
          </p>
        </div>
      </footer>

      <style>{`
                /* Follow-ups CSS */
                .zetsu-followups-container {
                    padding: 0 24px 24px 24px;
                    margin-top: -10px;
                }
                .zetsu-followups-label {
                    display: block;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 10px;
                    margin-left: 4px;
                    font-weight: 500;
                }
                .zetsu-followups-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .zetsu-followup-chip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
                    text-align: left;
                }
                .zetsu-followup-chip:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(160, 124, 254, 0.4);
                    transform: translateY(-2px);
                    color: #fff;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .zetsu-ai-page {
                    min-height: 100vh;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #000;
                    color: #fff;
                    position: relative;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* Animated Background */
                .zetsu-ai-bg {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                }

                .zetsu-ai-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                    animation: gridMove 20s linear infinite;
                }

                @keyframes gridMove {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(40px, 40px); }
                }

                .zetsu-ai-glow {
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    border-radius: 50%;
                    filter: blur(150px);
                    opacity: 0.15;
                    animation: glowFloat 15s ease-in-out infinite;
                }

                .zetsu-ai-glow-1 {
                    background: #fff;
                    top: -200px;
                    right: -200px;
                }

                .zetsu-ai-glow-2 {
                    background: #888;
                    bottom: -200px;
                    left: -200px;
                    animation-delay: -7.5s;
                }

                @keyframes glowFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(50px, 50px) scale(1.1); }
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Header */
                .zetsu-ai-header {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(20px);
                }

                .zetsu-ai-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .zetsu-ai-logo {
                    width: 44px;
                    height: 44px;
                    background: #fff;
                    color: #000;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: logoPulse 3s ease-in-out infinite;
                }

                @keyframes logoPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
                    50% { box-shadow: 0 0 20px 5px rgba(255,255,255,0.2); }
                }

                .zetsu-ai-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .zetsu-ai-history-btn {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 10px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-history-btn:hover {
                    background: rgba(255,255,255,0.15);
                    border-color: rgba(255,255,255,0.3);
                }

                .zetsu-ai-new-chat-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: #fff;
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-new-chat-btn:hover {
                    background: rgba(255,255,255,0.9);
                    transform: scale(1.02);
                }

                /* Chat History Sidebar */
                /* Switch Toggle */
                .zetsu-switch {
                    position: relative;
                    display: inline-block;
                    width: 36px;
                    height: 20px;
                }

                .zetsu-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .zetsu-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255, 255, 255, 0.2);
                    transition: .4s;
                }

                .zetsu-slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 2px;
                    bottom: 2px;
                    background-color: white;
                    transition: .4s;
                }

                input:checked + .zetsu-slider {
                    background-color: #9333ea;
                }

                input:focus + .zetsu-slider {
                    box-shadow: 0 0 1px #9333ea;
                }

                input:checked + .zetsu-slider:before {
                    transform: translateX(16px);
                }

                .zetsu-slider.round {
                    border-radius: 34px;
                }

                .zetsu-slider.round:before {
                    border-radius: 50%;
                }

                .zetsu-history-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .zetsu-history-sidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 340px;
                    max-width: 90vw;
                    height: 100vh;
                    background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
                    border-right: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    flex-direction: column;
                    animation: slideIn 0.3s ease;
                    box-shadow: -10px 0 40px rgba(0,0,0,0.5);
                }

                @keyframes slideIn {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }

                .zetsu-history-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 24px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.02);
                }

                .zetsu-history-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 0;
                    font-size: 1.2rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #fff 0%, #a5d6ff 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .zetsu-history-close {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .zetsu-history-close:hover {
                    background: rgba(255,100,100,0.15);
                    border-color: rgba(255,100,100,0.3);
                    transform: rotate(90deg);
                }

                .zetsu-history-new-chat {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin: 20px;
                    padding: 14px 16px;
                    background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
                    border: none;
                    border-radius: 12px;
                    color: #000;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(255,255,255,0.1);
                    position: relative;
                    overflow: hidden;
                }

                .zetsu-history-new-chat::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transition: left 0.5s;
                }

                .zetsu-history-new-chat:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(255,255,255,0.2);
                }

                .zetsu-history-new-chat:hover::before {
                    left: 100%;
                }

                .zetsu-history-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.1) transparent;
                }

                .zetsu-history-list::-webkit-scrollbar {
                    width: 6px;
                }

                .zetsu-history-list::-webkit-scrollbar-track {
                    background: transparent;
                }

                .zetsu-history-list::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                }

                .zetsu-history-list::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }

                .zetsu-history-loading,
                .zetsu-history-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    color: rgba(255,255,255,0.4);
                    text-align: center;
                    gap: 16px;
                }

                .zetsu-history-empty svg {
                    color: rgba(255,255,255,0.2);
                }

                .zetsu-history-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    margin-bottom: 8px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .zetsu-history-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                    transition: left 0.5s;
                }

                .zetsu-history-item:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.15);
                    transform: translateX(4px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }

                .zetsu-history-item:hover::before {
                    left: 100%;
                }

                .zetsu-history-item.active {
                    background: linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(79, 172, 254, 0.1) 100%);
                    border-color: rgba(79, 172, 254, 0.4);
                    box-shadow: 0 0 20px rgba(79, 172, 254, 0.15);
                }

                .zetsu-history-item-content {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .zetsu-history-item-title {
                    font-size: 0.9rem;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    color: #fff;
                }

                .zetsu-history-item.active .zetsu-history-item-title {
                    color: #4faceea;
                    font-weight: 600;
                }

                .zetsu-history-item-date {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.4);
                }

                .zetsu-history-item.active .zetsu-history-item-date {
                    color: rgba(79, 172, 254, 0.7);
                }

                .zetsu-history-delete {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    color: rgba(255,255,255,0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    opacity: 0;
                    flex-shrink: 0;
                }

                .zetsu-history-item:hover .zetsu-history-delete {
                    opacity: 1;
                }

                .zetsu-history-delete:hover {
                    background: rgba(255,100,100,0.2);
                    color: #ff6b6b;
                    transform: scale(1.1);
                }

                .zetsu-ai-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .zetsu-ai-title h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    margin: 0;
                }

                .zetsu-ai-badge {
                    font-size: 0.65rem;
                    font-weight: 600;
                    padding: 3px 8px;
                    background: #fff;
                    color: #000;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .zetsu-ai-user-section {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .zetsu-ai-credits {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 50px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #fff;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-credits:hover {
                    background: rgba(255,255,255,0.15);
                    border-color: rgba(255,255,255,0.4);
                    transform: scale(1.02);
                }

                .zetsu-ai-credits svg {
                    color: #fff;
                }

                .zetsu-ai-user {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .zetsu-ai-avatar {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #fff, #888);
                    color: #000;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .zetsu-ai-username {
                    font-weight: 500;
                    font-size: 0.875rem;
                }

                .zetsu-ai-login-btn {
                    padding: 8px 20px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-login-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(255,255,255,0.3);
                }

                /* Chat Area */
                .zetsu-ai-chat {
                    flex: 1;
                    position: relative;
                    z-index: 5;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 24px;
                    padding-bottom: 120px;
                }

                /* Welcome Screen */
                .zetsu-ai-welcome {
                    max-width: 600px;
                    margin: 80px auto;
                    text-align: center;
                    animation: fadeInUp 0.5s ease-out;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .zetsu-ai-welcome-icon {
                    width: 280px;
                    height: 280px;
                    margin: 0 auto 10px;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: iconFloat 4s ease-in-out infinite;
                    position: relative;
                }

                .zetsu-ai-welcome-icon::before {
                    display: none;
                }

                .zetsu-welcome-gif {
                    width: 85%;
                    height: 85%;
                    object-fit: contain;
                    border-radius: 20px;
                    filter: grayscale(0%) contrast(1.05);
                }

                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .zetsu-ai-welcome h2 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: #ffffff;
                }

                .zetsu-ai-welcome h2 span {
                    color: #ffffff !important;
                    background: none !important;
                    -webkit-background-clip: unset !important;
                    -webkit-text-fill-color: #ffffff !important;
                    background-clip: unset !important;
                }

                .zetsu-ai-welcome p {
                    color: rgba(255,255,255,0.6);
                    font-size: 1.1rem;
                    margin-bottom: 32px;
                }

                /* Prompts Section */
                .zetsu-prompts-section {
                    margin-top: 20px;
                    width: 100%;
                    max-width: 700px;
                }

                .zetsu-prompts-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }

                .zetsu-prompts-header h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.8);
                    margin: 0;
                }

                .zetsu-add-prompt-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: #fff;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-add-prompt-btn:hover {
                    background: rgba(255,255,255,0.15);
                    border-color: rgba(255,255,255,0.3);
                }

                .zetsu-ai-suggestions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    justify-content: center;
                    align-items: center;
                }

                .zetsu-saved-prompt {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: auto;
                }

                /* Delete button for saved prompts */
                .zetsu-delete-prompt {
                    padding: 8px;
                    background: rgba(255,0,0,0.1);
                    border: 1px solid rgba(255,0,0,0.3);
                    color: #ff6b6b;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-delete-prompt:hover {
                    background: rgba(255,0,0,0.2);
                    border-color: rgba(255,0,0,0.5);
                }
                    border: 1px solid rgba(100,200,255,0.3);
                    color: #fff;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .zetsu-saved-prompt > button:first-child:hover {
                    background: rgba(100,200,255,0.2);
                }

                .zetsu-delete-prompt {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    color: rgba(255,100,100,0.6);
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 4px;
                }

                .zetsu-delete-prompt:hover {
                    color: #ff6b6b;
                    background: rgba(255,100,100,0.2);
                }

                /* Prompt Modal */
                .zetsu-prompt-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.2s ease;
                }

                .zetsu-prompt-modal {
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 24px;
                    width: 90%;
                    max-width: 450px;
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .zetsu-prompt-modal h3 {
                    font-size: 1.3rem;
                    margin: 0 0 8px 0;
                }

                .zetsu-prompt-modal > p {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.9rem;
                    margin-bottom: 20px;
                }

                .zetsu-prompt-emoji-picker {
                    margin-bottom: 16px;
                }

                .zetsu-prompt-emoji-picker > span {
                    display: block;
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 8px;
                }

                .zetsu-emoji-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .zetsu-emoji-options button {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-emoji-options button:hover {
                    background: rgba(255,255,255,0.1);
                }

                .zetsu-emoji-options button.active {
                    background: rgba(255,255,255,0.15);
                    border-color: #fff;
                }

                .zetsu-prompt-input {
                    width: 100%;
                    padding: 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 10px;
                    color: #fff;
                    font-size: 0.95rem;
                    resize: none;
                    outline: none;
                    font-family: inherit;
                    margin-bottom: 16px;
                }

                .zetsu-prompt-input:focus {
                    border-color: rgba(255,255,255,0.3);
                }

                .zetsu-prompt-modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .zetsu-prompt-cancel {
                    padding: 10px 18px;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-prompt-cancel:hover {
                    background: rgba(255,255,255,0.05);
                }

                .zetsu-prompt-save {
                    padding: 10px 18px;
                    background: #fff;
                    border: none;
                    border-radius: 8px;
                    color: #000;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-prompt-save:hover {
                    transform: scale(1.02);
                }

                /* Messages - Modern Chat UI */
                .zetsu-ai-messages {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding: 20px;
                }

                .zetsu-ai-message {
                    display: flex;
                    gap: 16px;
                    animation: messageSlide 0.3s ease-out;
                    width: 100%;
                    padding: 20px 24px;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.2s ease;
                    align-items: flex-start;
                }

                .zetsu-ai-message:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.08);
                }

                .zetsu-ai-message-user {
                    background: rgba(102, 126, 234, 0.08);
                    border-color: rgba(102, 126, 234, 0.2);
                }

                .zetsu-ai-message-ai {
                    background: rgba(255, 255, 255, 0.02);
                    border-color: rgba(255, 255, 255, 0.05);
                }

                /* RTL support for messages with Arabic content */
                .zetsu-ai-message.rtl-message {
                    direction: rtl;
                }

                .zetsu-ai-message.rtl-message .zetsu-ai-message-content {
                    text-align: right !important;
                    width: 100%;
                }

                .zetsu-ai-message.rtl-message .zetsu-ai-message-text {
                    text-align: right !important;
                    direction: rtl;
                }

                .zetsu-ai-message.rtl-message .zetsu-ai-message-header {
                    text-align: right;
                }

                .zetsu-ai-message.rtl-message .zetsu-publish-guide-btn {
                    margin-right: 0;
                    margin-left: auto;
                }

                @keyframes messageSlide {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .zetsu-ai-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    /* background: linear-gradient(135deg, #a855f7, #ec4899); */
                    background: rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: white;
                    overflow: hidden;
                }

                .zetsu-popover-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    /* background: linear-gradient(135deg, #a855f7, #ec4899); */
                    background: rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: white;
                    overflow: hidden;
                }
                .zetsu-ai-message-avatar {
                    width: 36px;
                    height: 36px;
                    min-width: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    font-size: 14px;
                }

                .zetsu-ai-message-user .zetsu-ai-message-avatar {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                }

                .zetsu-ai-message-ai .zetsu-ai-message-avatar {
                    background: linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #fff;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                .zetsu-ai-message-content {
                    flex: 1;
                    min-width: 0;
                    width: 100%;
                }

                .zetsu-ai-message-header {
                    margin-bottom: 8px;
                }

                .zetsu-ai-message-name {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: rgba(255, 255, 255, 0.9);
                }

                .zetsu-ai-message-text {
                    line-height: 1.75;
                    color: rgba(255,255,255,0.95);
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    width: 100%;
                    display: block;
                    text-align: left;
                    font-size: 15px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                }

                /* RTL Support for Arabic Text - Improved */
                .zetsu-ai-message-text.rtl-text {
                    direction: rtl !important;
                    text-align: right !important;
                    unicode-bidi: plaintext;
                    display: block;
                    width: 100%;
                    font-family: 'Segoe UI', 'SF Pro Arabic', system-ui, -apple-system, sans-serif;
                }

                .zetsu-ai-message-text.rtl-text > div,
                .zetsu-ai-message-text.rtl-text .message-content-wrapper,
                .zetsu-ai-message-text.rtl-text .chat-text-content {
                    text-align: right !important;
                    direction: rtl !important;
                    width: 100%;
                }

                .zetsu-ai-message-text.rtl-text br {
                    display: block;
                    content: "";
                    margin-top: 4px;
                }

                /* Code blocks always LTR */
                .zetsu-ai-message-text.rtl-text .code-block-container,
                .zetsu-ai-message-text.rtl-text pre,
                .zetsu-ai-message-text.rtl-text code {
                    direction: ltr !important;
                    text-align: left !important;
                    unicode-bidi: isolate;
                }

                .zetsu-ai-message-text.rtl-text strong,
                .zetsu-ai-message-text.rtl-text em {
                    unicode-bidi: embed;
                }

                /* Ensure lists work correctly in RTL */
                .zetsu-ai-message-text.rtl-text ul,
                .zetsu-ai-message-text.rtl-text ol {
                    padding-right: 24px;
                    padding-left: 0;
                    margin-right: 0;
                }

                .zetsu-ai-message-text.rtl-text li {
                    text-align: right;
                }

                .zetsu-ai-message-text pre {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 16px;
                    overflow-x: auto;
                    margin: 12px 0;
                }

                .zetsu-ai-message-text code {
                    font-family: 'SF Mono', 'Fira Code', Monaco, 'Courier New', monospace;
                    font-size: 0.875rem;
                }

                .zetsu-ai-message-text :not(pre) > code {
                    background: rgba(255,255,255,0.1);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                /* Links in AI messages */
                .zetsu-ai-link {
                    color: #fff;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    transition: all 0.2s;
                }

                .zetsu-ai-link:hover {
                    color: rgba(255, 255, 255, 0.8);
                    text-decoration-thickness: 2px;
                }

                /* Typing cursor animation */
                .zetsu-ai-cursor {
                    display: inline-block;
                    color: #fff;
                    font-weight: 100;
                    animation: cursorBlink 0.8s ease-in-out infinite;
                    margin-left: 2px;
                }

                @keyframes cursorBlink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                /* Inline Thinking Indicator - Like modern AI chatbots */
                .zetsu-ai-thinking-inline {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 0;
                }

                .zetsu-ai-thinking-gif-small {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    object-fit: contain;
                    border: 2px solid rgba(255,255,255,0.4);
                    background: rgba(255,255,255,0.1);
                    /* Apply invert so black becomes white (visible on dark bg) */
                    filter: invert(1) brightness(1.5);
                }

                .zetsu-ai-thinking-dots {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .zetsu-ai-thinking-dots span {
                    width: 8px;
                    height: 8px;
                    background: rgba(255,255,255,0.6);
                    border-radius: 50%;
                    animation: dotBounce 1.4s ease-in-out infinite;
                }

                .zetsu-ai-thinking-dots span:nth-child(1) {
                    animation-delay: 0s;
                }

                .zetsu-ai-thinking-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .zetsu-ai-thinking-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes dotBounce {
                    0%, 80%, 100% {
                        transform: scale(0.6);
                        opacity: 0.4;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                /* ===== ENHANCED SUBAGENT UI STYLES ===== */
                .zetsu-subagent-container {
                    width: 100%;
                    padding: 16px 0;
                    animation: fadeInUp 0.5s ease-out;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .zetsu-subagent-card {
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4),
                                0 0 0 1px rgba(255, 255, 255, 0.05) inset;
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                }

                .zetsu-subagent-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
                    animation: shimmer 3s infinite;
                }

                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }

                .zetsu-subagent-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .zetsu-subagent-icon-wrapper {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .zetsu-subagent-icon-bg {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
                    border-radius: 12px;
                    animation: iconPulse 2s ease-in-out infinite;
                }

                @keyframes iconPulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
                    }
                }

                .zetsu-subagent-icon {
                    position: relative;
                    color: #000;
                    z-index: 1;
                }

                .zetsu-subagent-title-section {
                    flex: 1;
                    min-width: 0;
                }

                .zetsu-subagent-title {
                    font-size: 14px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: #ffffff;
                    text-transform: uppercase;
                    font-family: 'Monaco', 'Courier New', monospace;
                    margin-bottom: 4px;
                }

                .zetsu-subagent-subtitle {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 500;
                    line-height: 1.4;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .zetsu-subagent-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 14px;
                    background: rgba(34, 197, 94, 0.15);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    border-radius: 20px;
                    flex-shrink: 0;
                }

                .zetsu-subagent-pulse {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                    animation: pulse 1.5s ease-in-out infinite;
                    box-shadow: 0 0 10px #22c55e;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.6;
                        transform: scale(0.8);
                    }
                }

                .zetsu-subagent-badge span {
                    font-size: 11px;
                    font-weight: 700;
                    color: #22c55e;
                    letter-spacing: 1px;
                }

                .zetsu-subagent-progress-container {
                    margin-bottom: 16px;
                }

                .zetsu-subagent-progress-bar {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    overflow: hidden;
                    position: relative;
                }

                .zetsu-subagent-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg,
                        rgba(255, 255, 255, 0.4) 0%,
                        rgba(255, 255, 255, 0.9) 50%,
                        rgba(255, 255, 255, 0.4) 100%);
                    border-radius: 10px;
                    animation: progress 2s ease-in-out infinite;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
                }

                @keyframes progress {
                    0% {
                        width: 20%;
                        transform: translateX(0);
                    }
                    50% {
                        width: 60%;
                    }
                    100% {
                        width: 20%;
                        transform: translateX(400%);
                    }
                }

                .zetsu-subagent-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .zetsu-subagent-stage {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: 'Monaco', 'Courier New', monospace;
                }

                .zetsu-subagent-stage-label {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.4);
                    letter-spacing: 1px;
                    font-weight: 600;
                }

                .zetsu-subagent-stage-value {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.8);
                    letter-spacing: 1px;
                    font-weight: 700;
                }

                .zetsu-subagent-dots {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .zetsu-subagent-dots span {
                    width: 6px;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.6);
                    border-radius: 50%;
                    animation: dotBounce 1.4s ease-in-out infinite;
                }

                .zetsu-subagent-dots span:nth-child(1) { animation-delay: 0s; }
                .zetsu-subagent-dots span:nth-child(2) { animation-delay: 0.2s; }
                .zetsu-subagent-dots span:nth-child(3) { animation-delay: 0.4s; }

                /* ===== ENHANCED STANDARD AGENT UI ===== */
                .zetsu-agent-standard-container {
                    width: 100%;
                    padding: 12px 0;
                    animation: fadeInUp 0.4s ease-out;
                }

                .zetsu-agent-standard-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(30, 30, 30, 0.8) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    backdrop-filter: blur(5px);
                }

                .zetsu-agent-standard-icon {
                    flex-shrink: 0;
                }

                .zetsu-agent-standard-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .zetsu-agent-standard-text {
                    display: flex;
                    align-items: center;
                }

                .zetsu-agent-standard-dots {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-left: 8px;
                }

                .zetsu-agent-standard-dots span {
                    width: 5px;
                    height: 5px;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 50%;
                    animation: dotBounce 1.4s ease-in-out infinite;
                }

                .zetsu-agent-standard-dots span:nth-child(1) { animation-delay: 0s; }
                .zetsu-agent-standard-dots span:nth-child(2) { animation-delay: 0.2s; }
                .zetsu-agent-standard-dots span:nth-child(3) { animation-delay: 0.4s; }

                /* ===== SHARED AGENT STYLES ===== */
                .zetsu-agent-thinking {
                    padding: 12px 0;
                }

                .zetsu-agent-phase-display {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }

                .zetsu-agent-gif {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    object-fit: contain;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    background: rgba(255, 255, 255, 0.03);
                    filter: invert(1) brightness(1.3);
                    flex-shrink: 0;
                }

                .zetsu-agent-phase-text {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-top: 4px;
                }

                .zetsu-agent-status {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.95);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    animation: textGlow 2s ease-in-out infinite;
                }

                @keyframes textGlow {
                    0%, 100% {
                        text-shadow: 0 0 5px rgba(255, 255, 255, 0.4);
                        opacity: 1;
                    }
                    50% {
                        text-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
                        opacity: 0.9;
                    }
                }

                .zetsu-agent-found-text {
                    color: #fff;
                }

                .zetsu-agent-dots {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    margin-left: 4px;
                }

                .zetsu-agent-dots span {
                    width: 5px;
                    height: 5px;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 50%;
                    animation: dotBounce 1.4s ease-in-out infinite;
                }

                .zetsu-agent-dots span:nth-child(1) { animation-delay: 0s; }
                .zetsu-agent-dots span:nth-child(2) { animation-delay: 0.2s; }
                .zetsu-agent-dots span:nth-child(3) { animation-delay: 0.4s; }

                .zetsu-agent-found-section {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .zetsu-agent-found-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .zetsu-agent-guide-tag {
                    display: inline-block;
                    padding: 6px 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #fff;
                    animation: tagSlide 0.3s ease-out;
                }

                @keyframes tagSlide {
                    from {
                        opacity: 0;
                        transform: translateY(5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Taking Longer Container */
                .zetsu-agent-taking-longer-container {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    animation: pulse 2s ease-in-out infinite;
                }

                .zetsu-agent-taking-longer {
                    color: #fbbf24 !important;
                    font-weight: 600;
                }

                .zetsu-agent-tip {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.5);
                    font-style: italic;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                /* Input Area */
                .zetsu-ai-input-area {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    padding: 16px 24px 24px;
                    background: linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0.8) 80%, transparent);
                }

                .zetsu-ai-input-form {
                    max-width: 900px;
                    margin: 0 auto;
                }

                .zetsu-ai-input-wrapper {
                    position: relative;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 24px;
                    overflow: hidden;
                    transition: all 0.3s;
                }

                .zetsu-ai-input-wrapper:focus-within {
                    border-color: rgba(255,255,255,0.4);
                    box-shadow: 0 0 30px rgba(255,255,255,0.1);
                }

                .zetsu-ai-input {
                    width: 100%;
                    padding: 18px 60px 18px 24px;
                    background: transparent;
                    border: none;
                    color: #fff;
                    font-size: 1rem;
                    resize: none;
                    outline: none;
                    font-family: inherit;
                }

                .zetsu-ai-input::placeholder {
                    color: rgba(255,255,255,0.4);
                }

                .zetsu-ai-send-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 40px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .zetsu-ai-send-btn:hover:not(:disabled) {
                    transform: translateY(-50%) scale(1.1);
                    box-shadow: 0 0 20px rgba(255,255,255,0.4);
                }

                .zetsu-ai-send-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .zetsu-ai-disclaimer {
                    text-align: center;
                    margin-top: 12px;
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.4);
                }

                /* Sailboat Animation */
                .sailboat-animation-container {
                    position: fixed;
                    width: 100vw;
                    height: 80px;
                    margin-top: 8px;
                    display: flex;
                    align-items: center;
                    overflow: visible;
                    padding: 0;
                    top: auto;
                    bottom: 140px;
                    left: 0;
                    pointer-events: none;
                    z-index: 10;
                }

                .sailboat-animation-container > div {
                    animation: sailboatSail 25s linear infinite, sailboatWave 3s ease-in-out infinite;
                    position: absolute;
                }

                @keyframes sailboatSail {
                    0% {
                        left: 100vw;
                    }
                    100% {
                        left: -120px;
                    }
                }

                @keyframes sailboatWave {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    25% {
                        transform: translateY(-2px);
                    }
                    50% {
                        transform: translateY(0px);
                    }
                    75% {
                        transform: translateY(-2px);
                    }
                }

                .sailboat-animation-container.sailboat-fade-out {
                    animation: sailboatDisappear 1.5s ease-out forwards;
                    z-index: 1;
                }

                .sailboat-animation-container.sailboat-fade-out > div {
                    animation: sailboatVanish 1.5s ease-out forwards !important;
                }

                @keyframes sailboatDisappear {
                    0% {
                        opacity: 1;
                        filter: blur(0px);
                    }
                    50% {
                        opacity: 0.7;
                        filter: blur(2px);
                    }
                    100% {
                        opacity: 0;
                        filter: blur(8px);
                        transform: scale(1.2);
                        pointer-events: none;
                    }
                }

                @keyframes sailboatVanish {
                    0% {
                        opacity: 1;
                        transform: translateY(0px) scale(1);
                    }
                    50% {
                        opacity: 0.6;
                        filter: blur(4px);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-30px) scale(0.8);
                        filter: blur(12px);
                        pointer-events: none;
                    }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .zetsu-ai-header {
                        padding: 12px 16px;
                    }

                    .zetsu-ai-title h1 {
                        font-size: 1.2rem;
                    }

                    .zetsu-ai-username {
                        display: none;
                    }

                    .zetsu-ai-chat {
                        padding: 16px;
                    }

                    .zetsu-ai-welcome {
                        margin: 40px auto;
                    }

                    .zetsu-ai-welcome h2 {
                        font-size: 1.5rem;
                    }

                    .zetsu-ai-suggestions {
                        flex-direction: column;
                    }

                    .zetsu-ai-input-area {
                        padding: 12px 16px 20px;
                    }

                    .zetsu-ai-message-text {
                        font-size: 15px;
                        line-height: 1.6;
                    }

                    .rtl-text {
                        word-spacing: 0.05em;
                    }
                }

                /* Arabic Text Improvements */
                .rtl-text {
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    font-feature-settings: "kern" 1, "liga" 1;
                    text-rendering: optimizeLegibility;
                    word-spacing: 0.1em;
                    letter-spacing: 0;
                }

                .zetsu-ai-message-text {
                    word-wrap: break-word;
                    white-space: pre-wrap;
                    line-height: 1.7;
                    font-size: 16px;
                    user-select: text; /* Ensure text is selectable */
                    -webkit-user-select: text;
                }

                /* Fix for inline code blocks (the "squares") */
                .zetsu-ai-message-text code {
                    background: rgba(255, 255, 255, 0.15);
                    color: #e2e8f0;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'SF Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
                    font-size: 0.9em;
                    display: inline-block; /* Ensures consistent box rendering */
                    max-width: 100%;
                    overflow-x: auto;
                    vertical-align: middle;
                }

                .zetsu-ai-message-text h1,
                .zetsu-ai-message-text h2,
                .zetsu-ai-message-text h3 {
                    color: #ffffff;
                    font-weight: 700;
                    margin: 1.5em 0 0.8em 0;
                    line-height: 1.4;
                }

                .zetsu-ai-message-text h1 { font-size: 1.8em; }
                .zetsu-ai-message-text h2 { font-size: 1.5em; }
                .zetsu-ai-message-text h3 { font-size: 1.2em; }

                .zetsu-ai-message-text p {
                    margin: 0.8em 0;
                    line-height: 1.7;
                }

                .zetsu-ai-message-text ul,
                .zetsu-ai-message-text ol {
                    margin: 1em 0;
                    padding-left: 2em;
                }

                .zetsu-ai-message-text li {
                    margin: 0.5em 0;
                    line-height: 1.6;
                }

                /* Scrollbar */
                .zetsu-ai-chat::-webkit-scrollbar {
                    width: 6px;
                }

                .zetsu-ai-chat::-webkit-scrollbar-track {
                    background: transparent;
                }

                .zetsu-ai-chat::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 3px;
                }

                .zetsu-ai-chat::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.3);
                }

                /* Referral Bonus Modal */
                .referral-bonus-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.9);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .referral-bonus-modal {
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 24px;
                    padding: 40px;
                    max-width: 420px;
                    width: 100%;
                    text-align: center;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .referral-bonus-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                }

                .referral-bonus-modal h2 {
                    font-size: 1.8rem;
                    font-weight: 800;
                    margin-bottom: 16px;
                    color: #fff;
                }

                .referral-bonus-modal p {
                    color: rgba(255,255,255,0.8);
                    margin-bottom: 12px;
                    line-height: 1.6;
                }

                .referral-bonus-modal strong {
                    color: #fff;
                }

                .referral-bonus-note {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.5) !important;
                }

                .referral-bonus-btn {
                    margin-top: 24px;
                    padding: 14px 32px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .referral-bonus-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 30px rgba(255,255,255,0.2);
                }

                /* Login Required Screen */
                .zetsu-ai-login-required {
                    position: fixed;
                    inset: 0;
                    background: #000;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .zetsu-ai-login-modal {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 24px;
                    padding: 48px;
                    max-width: 420px;
                    width: 100%;
                    text-align: center;
                    animation: slideUp 0.4s ease-out;
                }

                .zetsu-ai-login-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                }

                .zetsu-ai-login-modal h2 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: #fff;
                }

                .zetsu-ai-login-modal p {
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 8px;
                    font-size: 1rem;
                }

                .zetsu-ai-login-subtitle {
                    color: rgba(255, 255, 255, 0.5) !important;
                    font-size: 0.9rem !important;
                    margin-bottom: 24px !important;
                }

                .zetsu-ai-login-action-btn {
                    width: 100%;
                    padding: 16px 32px;
                    background: #fff;
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 12px;
                }

                .zetsu-ai-login-action-btn:hover {
                    transform: scale(1.02);
                    box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
                }

                .zetsu-ai-back-btn {
                    width: 100%;
                    padding: 12px 24px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-back-btn:hover {
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.4);
                }

                /* Enhanced Message Styling */
                .zetsu-ai-message-user {
                    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
                    border-radius: 16px;
                    padding: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .zetsu-ai-message-ai {
                    background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
                    border-radius: 16px;
                    padding: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .zetsu-ai-message-user .zetsu-ai-message-name {
                    color: #fff;
                    font-weight: 600;
                }

                .zetsu-ai-message-ai .zetsu-ai-message-name {
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .zetsu-ai-message-ai .zetsu-ai-message-name::after {
                    content: 'AI';
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 4px;
                    font-weight: 500;
                }

                /* Publish to Guide Button */
                .zetsu-publish-guide-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 16px;
                    padding: 10px 18px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .zetsu-publish-guide-btn:hover {
                    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%);
                    border-color: rgba(255, 255, 255, 0.4);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
                }

                .zetsu-publish-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                }

                /* Publish Modal */
                .zetsu-publish-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s ease;
                }

                .zetsu-publish-modal {
                    background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 20px;
                    padding: 32px;
                    width: 90%;
                    max-width: 480px;
                    position: relative;
                    animation: modalSlideUp 0.3s ease;
                }

                @keyframes modalSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .zetsu-publish-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 8px;
                    padding: 8px;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-publish-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                }

                .zetsu-publish-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 28px;
                }

                .zetsu-publish-header-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                }

                .zetsu-publish-header h2 {
                    font-size: 1.4rem;
                    font-weight: 600;
                    color: #fff;
                    margin: 0;
                }

                .zetsu-publish-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .zetsu-publish-step {
                    display: flex;
                    align-items: flex-start;
                    gap: 14px;
                    padding: 14px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    opacity: 0.4;
                    transition: all 0.3s ease;
                }

                .zetsu-publish-step.active {
                    opacity: 1;
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(255, 255, 255, 0.15);
                }

                .zetsu-publish-step.completed {
                    opacity: 1;
                }

                .zetsu-publish-step.completed .zetsu-step-indicator {
                    background: linear-gradient(135deg, #4ade80, #22c55e);
                    color: #000;
                }

                .zetsu-step-indicator {
                    width: 28px;
                    height: 28px;
                    min-width: 28px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7);
                }

                .zetsu-step-spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .zetsu-step-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .zetsu-step-title {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #fff;
                }

                .zetsu-step-result {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.6);
                }

                .zetsu-step-success {
                    color: #4ade80 !important;
                    font-weight: 500;
                }

                .zetsu-step-keywords {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 4px;
                }

                .zetsu-keyword-tag {
                    font-size: 0.7rem;
                    padding: 4px 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 20px;
                    color: rgba(255, 255, 255, 0.8);
                }

                .zetsu-publish-error {
                    margin-top: 20px;
                    padding: 14px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 10px;
                    color: #f87171;
                    text-align: center;
                    font-size: 0.9rem;
                }

                .zetsu-publish-success {
                    margin-top: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .zetsu-view-guide-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #fff 0%, #e5e5e5 100%);
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-view-guide-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
                }

                .zetsu-done-btn {
                    padding: 12px 24px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-done-btn:hover {
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.4);
                }

                /* Tutorial Modal Styles */
                .zetsu-tutorial-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.3s ease;
                }

                .zetsu-tutorial-modal {
                    position: relative;
                    background: linear-gradient(135deg, #1a1a1a 0%, #222 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .zetsu-tutorial-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                    z-index: 10;
                }

                .zetsu-tutorial-close:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .zetsu-tutorial-content {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .zetsu-tutorial-content h2 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 0;
                    color: #fff;
                    background: linear-gradient(135deg, #fff 0%, #a0a0a0 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .zetsu-tutorial-content p {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.8);
                    margin: 0;
                }

                .zetsu-tutorial-gif-container {
                    width: 100%;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    padding: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .zetsu-tutorial-gif {
                    width: 100%;
                    height: auto;
                    display: block;
                    border-radius: 12px;
                    max-height: 400px;
                    object-fit: cover;
                }

                .zetsu-tutorial-close-btn {
                    align-self: center;
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #fff 0%, #e5e5e5 100%);
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-tutorial-close-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
                }

                /* Help Button Style */
                .zetsu-ai-help-btn {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .zetsu-ai-help-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: scale(1.05);
                }

                @media (max-width: 768px) {
                    .zetsu-tutorial-modal {
                        padding: 24px;
                        max-width: 95vw;
                    }

                    .zetsu-tutorial-content h2 {
                        font-size: 1.5rem;
                    }

                    .zetsu-tutorial-content p {
                        font-size: 0.95rem;
                    }

                    .zetsu-tutorial-gif-container {
                        padding: 12px;
                    }

                    .zetsu-tutorial-gif {
                        max-height: 300px;
                    }


                    /* Mobile Optimization for ZetsuGuide AI */
                    .zetsu-ai-header {
                        padding: 10px 12px;
                    }

                    .zetsu-ai-brand {
                        gap: 8px;
                    }

                    .zetsu-ai-logo {
                        width: 32px;
                        height: 32px;
                    }

                    .zetsu-ai-title h1 {
                        font-size: 1.1rem;
                    }

                    .zetsu-ai-badge {
                        display: none;
                    }

                    .zetsu-ai-user-section {
                        gap: 8px;
                    }

                    /* Hide text labels on mobile to save space */
                    .zetsu-ai-new-chat-btn span,
                    .zetsu-ai-credits span {
                        font-size: 0.75rem;
                    }

                    .zetsu-ai-new-chat-btn {
                        padding: 8px;
                    }

                    .zetsu-ai-new-chat-btn span {
                        display: none;
                    }

                    .zetsu-ai-credits {
                        padding: 6px 10px;
                    }

                    .zetsu-ai-help-btn {
                        display: none; /* Hide help button on mobile to save space */
                    }

                    .zetsu-ai-username {
                        display: none; /* Hide username on mobile */
                    }

                    .zetsu-ai-welcome {
                        margin: 20px 16px;
                        max-width: calc(100% - 32px);
                    }

                    .zetsu-ai-welcome h2 {
                        font-size: 1.5rem;
                    }

                    .zetsu-ai-welcome-icon {
                        width: 150px;
                        height: 150px;
                        margin-bottom: 16px;
                    }

                    .zetsu-ai-suggestions {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                    }

                    .zetsu-ai-suggestions > * {
                        width: 100% !important;
                    }

                    .zetsu-saved-prompt {
                        width: 100%;
                    }

                    .zetsu-ai-chat {
                        padding: 12px;
                        padding-bottom: 130px;
                    }

                    .zetsu-history-sidebar {
                        width: 85vw;
                    }

                    .zetsu-ai-input-form {
                        padding: 0 12px;
                    }
                }
            `}</style>
    </div>
  );
}
