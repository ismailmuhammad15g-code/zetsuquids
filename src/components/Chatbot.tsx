"use client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import "highlight.js/styles/github-dark.css";
import {
  ChevronDown,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  Send,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import { useAuth } from "../contexts/AuthContext";
import { streamAIResponse, isAIConfigured } from "../lib/ai";
import { Guide, guidesApi } from "../lib/api";
import { supabase } from "../lib/supabase";
import { supportApi } from "../lib/supportApi";
import { getAvatarForUser } from "../lib/avatar";
import BotIcon from "./BotIcon";
import DirectSupportChat from "./DirectSupportChat";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useModal } from "../contexts/ModalContext";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "./ui/reasoning";

type ChatRole = "user" | "bot" | "assistant" | "system";
type ChatMessageType = "text" | "error" | "limit_reached";

interface ChatMessage {
  id: string | number;
  role: ChatRole;
  content: string;
  type: ChatMessageType;
  guideId?: string | number;
  relatedGuides?: unknown[];
}

interface SupportFormData {
  email: string;
  phone: string;
  category: string;
  message: string;
}

type WindowWithWebkitAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};


// Detect if text contains Arabic characters
function isArabicText(text: string) {
  if (!text) return false;
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

const MermaidDiagram = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const id = useRef(`mermaid-${Date.now()}-${Math.floor(Math.random() * 10000)}`);

  useEffect(() => {
    if (typeof window !== "undefined" && chart) {
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      mermaid.render(id.current, chart)
        .then(result => {
          setSvg(result.svg);
          setError(false);
        })
        .catch(err => {
          console.error("Mermaid render error:", err);
          setError(true);
        });
    }
  }, [chart]);

  if (error) {
    return <div className="text-red-500 text-xs">Error rendering diagram. It might be incomplete.</div>;
  }

  return svg ? (
    <div dangerouslySetInnerHTML={{ __html: svg }} className="mermaid-diagram flex justify-center bg-white p-4 rounded-lg" />
  ) : (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <Loader2 className="animate-spin" size={12} /> Rendering diagram...
    </div>
  );
};

function MarkdownMessage({ content, isTyping = false }: { content: string; isTyping?: boolean }) {
  let thinkContent: string | null = null;
  let mainContent = content;

  if (content.includes("<think>")) {
    const thinkStart = content.indexOf("<think>") + 7;
    const thinkEnd = content.indexOf("</think>");
    
    if (thinkEnd !== -1) {
      thinkContent = content.substring(thinkStart, thinkEnd).trim();
      mainContent = content.substring(thinkEnd + 8).trim();
    } else {
      thinkContent = content.substring(thinkStart).trim();
      mainContent = ""; // Still thinking
    }
  }

  // Pre-process unclosed mermaid blocks while typing so they show as skeletons instead of raw text
  let displayedContent = mainContent;
  
  // Hide agentic action tags entirely from the user's view
  displayedContent = displayedContent.replace(/\[ACTION:REDIRECT:[^\]]*\]?/g, "");
  
  if (isTyping) {
    // If the string ends with an unclosed mermaid block, convert it to a loading block
    displayedContent = displayedContent.replace(/```mermaid\n([^`]*)$/g, "```mermaid-loading\n$1\n```");
  }

  return (
    <div className="markdown-content">
      {thinkContent && (
        <Reasoning defaultOpen={false}>
          <ReasoningTrigger />
          <ReasoningContent>{thinkContent}</ReasoningContent>
        </Reasoning>
      )}
      {displayedContent && (
        <div className="prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-a:text-indigo-600 prose-code:text-indigo-700 prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-blockquote:border-indigo-400 prose-strong:text-slate-800 prose-li:marker:text-slate-400">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              code: ({ node, className, children, ...props }) => {
                const isBlock = Boolean(className);
                const isMermaid = className?.includes("mermaid") && !className?.includes("mermaid-loading");
                const isMermaidLoading = className?.includes("mermaid-loading");

                if (isMermaidLoading) {
                  return (
                    <div className="not-prose bg-white border border-slate-200 rounded-lg p-6 my-4 shadow-sm w-full">
                      <div className="flex items-center gap-3 mb-4 opacity-50">
                        <Loader2 className="animate-spin text-slate-400" size={16} />
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wide">Generating Diagram...</span>
                      </div>
                      <div className="space-y-3">
                        <div className="h-2 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                        <div className="h-2 bg-slate-200 rounded w-3/4 animate-pulse" style={{ animationDelay: '100ms' }}></div>
                        <div className="h-2 bg-slate-200 rounded w-1/2 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        <div className="h-2 bg-slate-200 rounded w-5/6 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  );
                }

                if (isMermaid) {
                  return (
                    <div className="not-prose bg-slate-50 border border-slate-200 rounded-lg p-4 my-4 overflow-x-auto shadow-sm">
                      <span className="text-slate-400 text-xs font-bold mb-2 block uppercase tracking-wide flex items-center gap-2">
                        📊 Diagram Preview
                      </span>
                      <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                    </div>
                  );
                }

                return isBlock ? (
                  <pre className="not-prose bg-slate-900 rounded-lg p-3 my-2 overflow-x-auto border border-slate-700">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code
                    className="not-prose bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 text-xs font-mono border border-slate-200"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              a: ({ node, ...props }) => (
                <a
                  className="text-indigo-600 hover:text-indigo-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
            }}
          >
            {displayedContent}
          </ReactMarkdown>
        </div>
      )}
      {isTyping && (
        <span className="inline-block w-1 h-4 bg-indigo-400 ml-0.5 animate-pulse" />
      )}
    </div>
  );
}

export default function Chatbot() {
  const { isChatOpen: isOpen, setIsChatOpen: setIsOpen, chatTab: activeTab, setChatTab: setActiveTab } = useModal();
  const [isMinimized, setIsMinimized] = useState(false);
  // Keep initial render deterministic for SSR; hydrate popup preference after mount.
  const [showPopup, setShowPopup] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [awaitingSupportConfirmation, setAwaitingSupportConfirmation] =
    useState(false);
  const [pendingSupportCategory, setPendingSupportCategory] = useState<string | null>(null);
  const [supportFormData, setSupportFormData] = useState<SupportFormData>({
    email: "",
    phone: "",
    category: "other",
    message: "",
  });
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Hello! I am the ZetsuGuide AI Assistant. How can I help you today?",
      type: "text",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isReadingDocs, setIsReadingDocs] = useState(false);
  // Tracks which message is currently being streamed (used to show live cursor)
  const [streamingMsgId, setStreamingMsgId] = useState<number | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<{ path: string; countdown: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showSoundModal, setShowSoundModal] = useState<boolean>(false);

  // Auth & Usage States
  const { user, profileAvatar, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tokensLeft, setTokensLeft] = useState(30);

  useEffect(() => {
    const dismissed = localStorage.getItem("zetsu_chatbot_popup_dismissed");
    setShowPopup(!dismissed);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
       const pref = localStorage.getItem("zetsu_chatbot_sound_enabled");
       if (pref === "true") {
          setSoundEnabled(true);
       } else if (pref === null && isOpen) {
          setShowSoundModal(true);
       }
    }
  }, [isOpen]);

  const handleSoundPermission = (allow: boolean) => {
     setSoundEnabled(allow);
     localStorage.setItem("zetsu_chatbot_sound_enabled", allow ? "true" : "false");
     setShowSoundModal(false);
     
     if (allow) {
        const audio = new Audio("/sound-effect/ai-finished-notification.mp3");
        audio.volume = 0.5;
        audio.play().catch(console.error);
     }
  };

  const playFinishedSound = () => {
     if (soundEnabled) {
        const audio = new Audio("/sound-effect/ai-finished-notification.mp3");
        audio.volume = 0.5;
        audio.play().catch(console.error);
     }
  };

  // Deep-link: open chatbot on Direct Support tab when ?open_support=1 is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('open_support') === '1') {
      setIsOpen(true);
      setActiveTab('direct-support');
      setUnreadSupportCount(0);
      // Clean up the query param without causing a navigation
      const clean = new URL(window.location.href);
      clean.searchParams.delete('open_support');
      window.history.replaceState({}, '', clean.toString());
    }
  }, []);

  // Pre-fill email when user is authenticated
  useEffect(() => {
    if (user?.email && !supportFormData.email) {
      setSupportFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isLongLoading, setIsLongLoading] = useState(false);

  // Check & Reset Usage from Supabase
  useEffect(() => {
    if (!user) {
      setTokensLeft(3);
      return;
    }

    const currentUser = user;

    async function initUsage() {
      setLoadingUsage(true);
      try {
        let { data, error } = await supabase
          .from("user_chatbot_usage")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (!data && !error) {
          const { data: newData, error: insertError } = await supabase
            .from("user_chatbot_usage")
            .insert([{ user_id: currentUser.id, tokens_left: 30 }])
            .select()
            .single();
          if (!insertError) data = newData;
        }

        if (data) {
          const lastReset = new Date(data.last_reset_at);
          const now = new Date();
          const diffHours =
            (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

          if (diffHours >= 24) {
            await supabase
              .from("user_chatbot_usage")
              .update({
                tokens_left: 30,
                last_reset_at: now.toISOString(),
              })
              .eq("user_id", currentUser.id);
            setTokensLeft(30);
          } else {
            setTokensLeft(data.tokens_left);
          }
        }
      } catch (err) {
        console.error("Error syncing chatbot usage:", err);
      } finally {
        setLoadingUsage(false);
      }
    }
    initUsage();
  }, [user, isOpen]);

  // Load guides for context
  useEffect(() => {
    async function loadContext() {
      try {
        const allGuides = await guidesApi.getAll();
        setGuides(allGuides);
      } catch (err) {
        console.error("Failed to load guides for chatbot:", err);
      }
    }
    loadContext();
  }, []);

  // Scroll to bottom (Smart Sticky Scroll)
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    
    // Check if user is near the bottom (within 150px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    // Check if the last message was from the user (to force scroll down after sending)
    const lastMsgIsUser = messages[messages.length - 1]?.role === "user";
    
    if (isNearBottom || lastMsgIsUser) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping, isLongLoading]);

  // Agentic AI Redirection Parser
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "bot" && !isTyping) {
      const match = lastMsg.content.match(/\[ACTION:REDIRECT:(.+?)\]/);
      if (match) {
        const path = match[1];
        // Strip the tag from the message content in state so it doesn't show up again
        const cleanContent = lastMsg.content.replace(/\[ACTION:REDIRECT:.+?\]/g, "").trim();
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], content: cleanContent };
          return newMessages;
        });
        setPendingRedirect({ path, countdown: 5 });
      }
    }
  }, [messages, isTyping]);

  // Redirection Countdown Timer
  useEffect(() => {
    if (pendingRedirect) {
      if (pendingRedirect.countdown > 0) {
        const timer = setTimeout(() => {
          setPendingRedirect((prev) => (prev ? { ...prev, countdown: prev.countdown - 1 } : null));
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setIsOpen(false);
        router.push(pendingRedirect.path);
        setPendingRedirect(null);
      }
    }
  }, [pendingRedirect, router, setIsOpen]);

  // ZetsuClaw Background Worker (Simulates Vercel Cron/Queue)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
       const rawJobs = localStorage.getItem('zetsuclaw_jobs');
       if (!rawJobs) return;
       
       let jobs = [];
       try { jobs = JSON.parse(rawJobs); } catch(e) {}
       
       const pendingJobs = jobs.filter((j: any) => j.status === 'scheduled' && j.run_at <= Date.now());
       
       if (pendingJobs.length > 0) {
          for (const job of pendingJobs) {
             // Mark as processing
             jobs = JSON.parse(localStorage.getItem('zetsuclaw_jobs') || '[]');
             jobs = jobs.map((j: any) => j.id === job.id ? { ...j, status: 'processing' } : j);
             localStorage.setItem('zetsuclaw_jobs', JSON.stringify(jobs));
             
             try {
                let resultText = "";
                // Use fallback/direct call since we don't have onToken UI updates
                await fetch('/api/ai', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      messages: [{ role: 'user', content: `[ZETSUCLAW BACKGROUND TASK] Execute this instruction and return the result: ${job.prompt}` }],
                      model: 'gemini-1.5-flash',
                      userEmail: user.email,
                      isDeepReasoning: false,
                      isSubAgentMode: false,
                      skipCreditDeduction: true,
                  }),
                }).then(async (res) => {
                   const data = await res.json();
                   resultText = data.content || "Completed with no output.";
                });
                
                // Update job as completed
                jobs = JSON.parse(localStorage.getItem('zetsuclaw_jobs') || '[]');
                jobs = jobs.map((j: any) => j.id === job.id ? { ...j, status: 'completed', result: resultText, completed_at: new Date().toISOString() } : j);
                localStorage.setItem('zetsuclaw_jobs', JSON.stringify(jobs));
                
                // Notify user
                import('../lib/notificationsApi').then(({ notificationsApi }) => {
                    notificationsApi.createNotification({
                        user_id: user.id,
                        actor_name: "ZetsuClaw",
                        type: "system",
                        title: "ZetsuClaw Task Completed",
                        message: `Task: "${job.prompt.substring(0, 30)}..." has finished running in the background.`,
                        link: "/zetsuguide-ai"
                    });
                });
             } catch (e) {
                // Mark as failed
                jobs = JSON.parse(localStorage.getItem('zetsuclaw_jobs') || '[]');
                jobs = jobs.map((j: any) => j.id === job.id ? { ...j, status: 'failed', result: String(e) } : j);
                localStorage.setItem('zetsuclaw_jobs', JSON.stringify(jobs));
             }
          }
       }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Inject Arabic support styles
  useEffect(() => {
    if (typeof document === "undefined") return;

    const styles = `
        /* Arabic Text Support */
        .arabic-text {
            font-family: 'Segoe UI', 'SF Pro Arabic', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            letter-spacing: 0.02em;
            word-spacing: 0.1em;
        }

        [dir="rtl"] {
            unicode-bidi: plaintext;
        }

        /* Better message alignment for Arabic text */
        .arabic-message-container {
            direction: rtl;
        }

        .arabic-message-container .flex {
            flex-direction: row-reverse;
        }

        /* Enhanced bubble styles for Arabic */
        .arabic-bubble {
            text-align: right;
            direction: rtl;
        }
    `;

    if (!document.getElementById("arabic-support-styles-chatbot")) {
      const styleElement = document.createElement("style");
      styleElement.id = "arabic-support-styles-chatbot";
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }
  }, []);

  // Notification sound function
  const playNotificationSound = () => {
    try {
      // Create audio context for notification
      const AudioCtx =
        window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();

      // Create oscillator for notification beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
      oscillator.type = "sine";

      // Volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.5,
        audioContext.currentTime + 0.05,
      );
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      // Play
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.setValueAtTime(1100, audioContext.currentTime); // Higher note
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0, audioContext.currentTime);
        gain2.gain.linearRampToValueAtTime(
          0.5,
          audioContext.currentTime + 0.05,
        );
        gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.3);
      }, 150);
    } catch (error: unknown) {
      console.log("Could not play notification sound:", error);
    }
  };

  // Refs to track current state in subscription callback
  const isOpenRef = useRef(isOpen);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Subscribe to new support messages from admin/staff
  useEffect(() => {
    if (!user?.email) return;

    let subscription: RealtimeChannel | null = null;



    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const channelName = `chatbot_support_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const subscribeToMessages = async () => {
      try {
        const { data: conv } = await supabase
          .from("support_conversations")
          .select("id")
          .eq("user_email", user.email)
          .maybeSingle();

        if (!conv) {
          return;
        }

        subscription = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "support_messages",
              filter: `conversation_id=eq.${conv.id}`,
            },
            (payload: import('@supabase/supabase-js').RealtimePostgresInsertPayload<Record<string, unknown>>) => {
              const newMsg = payload.new as {
                sender_type?: string;
                sender_name?: string;
                message?: string;
              };
              // Notify for admin OR staff messages
              if (
                newMsg.sender_type === "admin" ||
                newMsg.sender_type === "staff"
              ) {
                // Use refs to get current values (avoid stale closure)
                const chatIsOpen = isOpenRef.current;
                const currentTab = activeTabRef.current;

                // If chat is not open OR not on direct-support tab
                if (!chatIsOpen || currentTab !== "direct-support") {
                  setUnreadSupportCount((prev) => prev + 1);
                  playNotificationSound();

                  // Also show browser notification if permitted
                  if (Notification.permission === "granted") {
                    const senderName =
                      newMsg.sender_type === "admin"
                        ? "Admin"
                        : newMsg.sender_name || "Support";
                    new Notification(`New message from ${senderName}! ??`, {
                      body: (newMsg.message || "").substring(0, 100),
                      icon: "/favicon.ico",
                    });
                  }
                }
              }
            },
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              console.log('Chatbot support channel subscribed');
            }
          });
      } catch (error: unknown) {
        console.log("Could not subscribe to support messages:", error);
      }
    };

    subscribeToMessages();


    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user?.email]);

  // Real-time Presence for Direct Support
  useEffect(() => {
    if (!user?.email || !isOpen || activeTab !== 'direct-support') return;

    const channel = supabase.channel('support_presence', {
        config: {
            presence: {
                key: user.email,
            },
        },
    });

    const trackPresence = async () => {
        await channel.subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    online_at: new Date().toISOString(),
                    user_email: user.email,
                    status: 'online'
                });
            }
        });
    };

    trackPresence();

    // Update last_seen in profile when leaving
    const updateLastSeen = async () => {
        await supabase
            .from('zetsuguide_user_profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('user_email', user.email);
    };

    return () => {
        updateLastSeen();
        supabase.removeChannel(channel);
    };
  }, [user?.email, isOpen, activeTab]);

  // Load unread count on mount
  useEffect(() => {
    if (!user?.email) return;

    const loadUnreadCount = async () => {
      const count = await supportApi.getUnreadCount(user.email);
      setUnreadSupportCount(count);
    };

    loadUnreadCount();
  }, [user?.email]);

  // Prevent background scroll when open (mobile/desktop)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Check for unread support messages
  useEffect(() => {
    if (!user?.email) return;

    async function checkUnread() {
      if (!user?.email) return;
      const count = await supportApi.getUnreadCount(user.email);
      setUnreadSupportCount(count);
    }

    checkUnread();

    // Check every 30 seconds
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [user?.email]);

  // Mark as read when entering support tab
  useEffect(() => {
    if (isOpen && activeTab === 'direct-support' && user?.email && unreadSupportCount > 0) {
      const clearUnread = async () => {
        const success = await supportApi.markAllUserMessagesAsRead(user.email);
        if (success) {
          setUnreadSupportCount(0);
        }
      };
      clearUnread();
    }
  }, [isOpen, activeTab, user?.email, unreadSupportCount]);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (!userInput.trim()) return;

    // Check Auth
    if (!isAuthenticated()) {
      return;
    }

    // Check Tokens
    if (tokensLeft <= 0) {
      setShowUpgrade(true);
      return;
    }

    if (!user) {
      return;
    }

    const text = userInput.trim();

    // Check if user is confirming support ticket
    if (awaitingSupportConfirmation && text.toLowerCase() === "yes") {
      setUserInput("");
      setAwaitingSupportConfirmation(false);
      setShowSupportForm(true);
      setSupportFormData((prev) => ({
        ...prev,
        email: user?.email || "",
        category: pendingSupportCategory || "other",
      }));

      // Add confirmation message
      const confirmMsg: ChatMessage = {
        id: Date.now(),
        role: "user",
        content: text,
        type: "text",
      };
      setMessages((prev) => [...prev, confirmMsg] as ChatMessage[]);

      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "bot",
        content:
          "? Great! Please fill out the support form below and our team will get back to you shortly.",
        type: "text",
      };
      setMessages((prev) => [...prev, botMsg] as ChatMessage[]);
      return;
    }

    setUserInput("");

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      type: "text",
    };
    setMessages((prev) => [...prev, userMsg] as ChatMessage[]);
    setIsTyping(true);

    // Optimistic UI update
    const newTokens = Math.max(0, tokensLeft - 1);
    setTokensLeft(newTokens);

    // Update DB
    try {
      await supabase
        .from("user_chatbot_usage")
        .update({ tokens_left: newTokens })
        .eq("user_id", user.id);
    } catch (err) {
      console.error("Failed to update token usage:", err);
    }

    // Set timeout for delay message
    const loadingTimeout = setTimeout(() => {
      setIsLongLoading(true);
    }, 3000);

    try {
      // Check if AI is configured
      if (!isAIConfigured()) {
        clearTimeout(loadingTimeout);
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "bot", content: "AI is not configured. Please add your API key in settings.", type: "error" },
        ]);
        setIsTyping(false);
        return;
      }

      // Phase 1: Show "Reading documentation..." shimmer
      setIsReadingDocs(true);

      // Create a placeholder streaming message
      const botMsgId = Date.now() + 1;
      setStreamingMsgId(botMsgId);
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: "bot", content: "", type: "text" },
      ] as ChatMessage[]);

      // Stream AI response
      const result = await streamAIResponse(
        text,
        guides,
        user?.email || "chatbot-user",
        // onToken: append each chunk to the streaming message
        (token: string) => {
          setIsReadingDocs(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, content: m.content + token } : m
            ) as ChatMessage[]
          );
        },
        // onDone — receives result data directly to avoid closure-before-init bug
        (doneData: { needsSupport: boolean; supportCategory?: string }) => {
          setStreamingMsgId(null);
          setIsTyping(false);
          setIsLongLoading(false);
          clearTimeout(loadingTimeout);
          
          playFinishedSound();

          if (doneData?.needsSupport) {
            setAwaitingSupportConfirmation(true);
            setPendingSupportCategory(doneData.supportCategory || "other");
          }
        },
        // onError
        (errMsg: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, content: errMsg, type: "error" } : m
            ) as ChatMessage[]
          );
          setStreamingMsgId(null);
          setIsTyping(false);
          setIsLongLoading(false);
          clearTimeout(loadingTimeout);
        },
      );
      void result;

    } catch (error: unknown) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          content:
            "I encountered an error while processing your request. Please try again.",
          type: "error",
        },
      ] as ChatMessage[]);
    } finally {
      clearTimeout(loadingTimeout);
      setIsTyping(false);
      setIsLongLoading(false);

      // If we just used the last token, show the limit message
      if (tokensLeft - 1 === 0) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 2,
              role: "system", // Using 'system' role or just 'bot' with special content
              content: "", // Content handled by custom rendering or Text
              type: "limit_reached",
            },
          ]);
        }, 500);
      }
    }
  }

  // Handle support form submission
  async function handleSupportSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supportFormData.email || !supportFormData.message) {
      alert("Please fill in all required fields");
      return;
    }

    setSupportSubmitting(true);

    try {
      const response = await fetch("/api/content?type=submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: 'support',
          email: supportFormData.email,
          phone: supportFormData.phone,
          category: supportFormData.category,
          message: supportFormData.message,
          userName: user?.user_metadata?.name || user?.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add success message
        const successMsg: ChatMessage = {
          id: Date.now(),
          role: "bot",
          content:
            "? **Support ticket sent successfully!**\n\nOur team will review your request and get back to you via email within 24 hours. Thank you for your patience!",
          type: "text",
        };
        setMessages((prev) => [...prev, successMsg] as ChatMessage[]);

        // Reset form and close
        setShowSupportForm(false);
        setSupportFormData({
          email: user?.email || "",
          phone: "",
          category: "other",
          message: "",
        });
      } else {
        throw new Error(data.error || "Failed to send support ticket");
      }
    } catch (error: unknown) {
      console.error("Support ticket error:", error);
      alert(
        "Failed to send support ticket. Please try again or email us directly at zetsuserv@gmail.com",
      );
    } finally {
      setSupportSubmitting(false);
    }
  }

  // Reset tokens debug (optional, can be triggered via console)
  // window.resetTokens = () => setTokensLeft(3)

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 group">
          {/* Popup Message - Shows once per page load - Hidden on mobile */}
          {showPopup && (
            <div className="hidden md:block absolute bottom-full right-0 mb-3 w-64 p-4 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-2xl opacity-100 transition-all duration-300 transform translate-y-0">
              <button
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  setShowPopup(false);
                  localStorage.setItem("zetsu_chatbot_popup_dismissed", "true");
                }}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-800 transition-colors"
              >
                <X size={14} />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-700">
                  <BotIcon size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1 text-slate-900">
                    Hello! Need a specific question?
                  </h4>
                  <p className="text-xs text-slate-500">
                    I'm here to help with any questions you have about
                    ZetsuGuide. Ask me anything!
                  </p>
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute bottom-0 right-6 transform translate-y-1/2">
                <div className="w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
              </div>
            </div>
          )}
          {/* Chatbot Icon Button */}
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setShowPopup(false);
              localStorage.setItem("zetsu_chatbot_popup_dismissed", "true"); // Dismiss forever
              if (unreadSupportCount > 0) {
                setUnreadSupportCount(0);
              }
            }}
            onMouseEnter={() => setShowPopup(false)}
            className="p-0 rounded-full shadow-xl hover:scale-110 transition-transform duration-300 group bg-slate-900 overflow-hidden relative border border-slate-800"
          >
            <div className="relative p-3">
              <BotIcon size={32} className="text-white relative z-10" />
              <div className="absolute inset-0 bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Unread Support Badge */}
              {unreadSupportCount > 0 && !isOpen && (
                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-slate-900 z-20 shadow-lg">
                  {unreadSupportCount}
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden font-sans
                    ${isMinimized
              ? "bottom-6 right-6 w-72 h-16 rounded-2xl cursor-pointer"
              : "bottom-0 right-0 w-full h-[85vh] rounded-t-3xl sm:bottom-6 sm:right-6 sm:w-[500px] sm:h-[700px] sm:max-h-[90vh] sm:rounded-3xl"
            }
                `}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 cursor-pointer relative overflow-hidden"
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div className="absolute inset-0 bg-slate-50 pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shadow-sm overflow-hidden">
                <BotIcon size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-sm tracking-wide">
                  ZetsuGuide AI
                </h3>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-sm"></span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Online
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 relative z-10">
              {!isMinimized && (
                <div
                  onClick={() => {
                    if (!isAuthenticated()) {
                      router.push("/auth");
                      setIsOpen(false);
                    } else {
                      if (tokensLeft <= 0) {
                        setShowUpgrade(true);
                      } else {
                        setShowUpgrade(true);
                      }
                    }
                  }}
                  className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-full mr-2 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Zap
                    size={12}
                    className={
                      tokensLeft > 0 ? "text-slate-700" : "text-slate-400"
                    }
                  />
                  <span
                    className={`text-[10px] font-bold ${tokensLeft > 0 ? "text-slate-700" : "text-red-500"}`}
                  >
                    {loadingUsage ? "..." : `${tokensLeft}/30`}
                  </span>
                </div>
              )}
              {!isMinimized && (
                <button
                  onClick={(e: React.MouseEvent<HTMLElement>) => {
                    e.stopPropagation();
                    setIsMinimized(true);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronDown size={18} />
                </button>
              )}
              <button
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          {!isMinimized && (
            <div className="flex gap-2 border-b border-slate-200 px-4 pb-0 pt-2 bg-slate-50">
              <button
                onClick={() => {
                  setActiveTab("chat");
                  setShowSupportForm(false);
                }}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-all border border-b-0 ${activeTab === "chat"
                  ? "bg-white text-slate-800 border-slate-200"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                  }`}
              >
                AI Chat
              </button>
              <button
                onClick={() => {
                  setActiveTab("direct-support");
                  setShowSupportForm(false);
                }}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-all relative border border-b-0 flex items-center gap-2 ${activeTab === "direct-support"
                  ? "bg-white text-slate-800 border-slate-200"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                  }`}
              >
                Direct Support
                {unreadSupportCount > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse">
                    {unreadSupportCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("support-form");
                  setShowSupportForm(true);
                }}
                className={`px-4 py-2 rounded-t-lg font-semibold transition-all border border-b-0 ${activeTab === "support-form"
                  ? "bg-white text-slate-800 border-slate-200"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                  }`}
              >
                Support Form
              </button>
            </div>
          )}

          {/* Content */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
              {/* Content Area - Conditional based on activeTab */}
              {/* AI Chat Tab Content */}
              <div
                className="flex-1 flex flex-col overflow-hidden relative"
                style={{ display: activeTab === "chat" ? "flex" : "none" }}
              >
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent relative bg-slate-50">
                  
                  {/* Sound Permission Modal Overlay */}
                  {showSoundModal && activeTab === "chat" && (
                    <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                        <Zap size={32} className="text-indigo-500 animate-pulse" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Enable Sound Notifications?
                      </h3>
                      <p className="text-sm text-slate-500 mb-6 max-w-[220px]">
                        We can play a sound when ZetsuGuide AI finishes typing its response.
                      </p>
                      <div className="flex gap-3 w-full max-w-[220px]">
                        <button
                          onClick={() => handleSoundPermission(false)}
                          className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold text-sm rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Later
                        </button>
                        <button
                          onClick={() => handleSoundPermission(true)}
                          className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-500 transition-colors shadow-sm"
                        >
                          Allow
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Login Gate Overlay */}
                  {!isAuthenticated() && activeTab === "chat" && (
                    <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                        <Lock size={32} className="text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Login Required
                      </h3>
                      <p className="text-sm text-slate-500 mb-6 max-w-[200px]">
                        You must be logged in to chat with our AI assistant.
                      </p>
                      <div className="flex flex-col gap-3 w-full max-w-[200px]">
                        <Link
                          href="/auth"
                          className="w-full px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-full hover:bg-slate-800 transition-colors shadow-sm"
                          onClick={() => setIsOpen(false)}
                        >
                          Login / Register
                        </Link>
                        <button
                          onClick={() => setIsOpen(false)}
                          className="text-slate-400 text-xs hover:text-slate-600 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upgrade Overlay */}
                  {showUpgrade && isAuthenticated() && activeTab === "chat" && (
                    <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                      <div className="mb-6 relative">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center animate-pulse shadow-xl">
                          <Zap size={40} className="text-yellow-500" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                          <Lock size={16} className="text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {tokensLeft === 0
                          ? "Out of Queries"
                          : "Energy Status"}
                      </h3>
                      <p className="text-sm text-slate-300 mb-6 max-w-[280px]">
                        {tokensLeft === 0
                          ? "You've used all your free queries. Upgrade to Premium for unlimited AI access!"
                          : `You have ${tokensLeft} free queries remaining. Upgrade to Premium for more!`}
                      </p>
                      <div className="flex flex-col gap-3 w-full max-w-[240px]">
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            router.push("/pricing");
                          }}
                          className="w-full px-6 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl hover:scale-105 transition-transform shadow-lg"
                        >
                          Upgrade Now
                        </button>
                        <button
                          onClick={() => setShowUpgrade(false)}
                          className="w-full px-6 py-3 bg-slate-800 border border-slate-700 text-white font-medium text-sm rounded-xl hover:bg-slate-700 transition-colors"
                        >
                          {tokensLeft > 0 ? "Continue Free" : "Maybe Later"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Support Form Overlay */}
                  {showSupportForm && isAuthenticated() && activeTab === "chat" && (
                    <div className="absolute inset-0 z-40 bg-slate-50 flex flex-col overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
                        <h3 className="text-slate-800 font-bold text-lg">
                          Contact Support
                        </h3>
                        <button
                          onClick={() => setShowSupportForm(false)}
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                        <p className="text-slate-500 text-sm mb-4">
                          Need help? Our support team is here for you!
                        </p>
                        <div className="space-y-3">
                          <div>
                            <label className="text-slate-700 text-sm font-medium mb-1 block">
                              Your Name
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 shadow-sm"
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <label className="text-slate-700 text-sm font-medium mb-1 block">
                              Email
                            </label>
                            <input
                              type="email"
                              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 shadow-sm"
                              placeholder="john@example.com"
                            />
                          </div>
                          <div>
                            <label className="text-slate-700 text-sm font-medium mb-1 block">
                              Message
                            </label>
                            <textarea
                              className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-lg py-2 px-3 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 resize-none shadow-sm"
                              rows={5}
                              placeholder="Describe your issue..."
                            />
                          </div>
                          <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all shadow-md">
                            Send Message
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {messages.map((msg) => {
                    const isArabic = isArabicText(msg.content);
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                      >
                        {(msg.role === "assistant" || msg.role === "bot") && (
                          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-700">
                            <BotIcon size={20} className="text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] ${msg.role === "user" ? "order-1" : ""}`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-sm border ${msg.role === "user"
                              ? `bg-slate-900 text-white border-slate-800 ${isArabic ? "rounded-bl-none" : "rounded-tr-none"}`
                              : `bg-white text-slate-800 border-slate-200 rounded-tl-none`
                              }`}
                          >
                            {msg.role === "assistant" || msg.role === "bot" ? (
                              <MarkdownMessage
                                content={msg.content}
                                isTyping={msg.id === streamingMsgId}
                              />
                            ) : (
                              <p
                                className={`text-sm leading-relaxed ${isArabic ? "arabic-text" : ""}`}
                                dir={isArabic ? "rtl" : "ltr"}
                                style={{
                                  textAlign: isArabic ? "right" : "left",
                                  direction: isArabic ? "rtl" : "ltr",
                                  fontFamily: isArabic
                                    ? "'Segoe UI', 'SF Pro Arabic', system-ui, -apple-system, sans-serif"
                                    : "inherit",
                                }}
                              >
                                {msg.content}
                              </p>
                            )}
                          </div>
                          {msg.guideId && (
                            <Link
                              href={`/guides/${msg.guideId}`}
                              className={`mt-2 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors w-fit ${isArabic ? "flex-row-reverse" : ""}`}
                              onClick={() => setIsOpen(false)}
                            >
                              <FileText size={14} />
                              <span>View Full Guide</span>
                            </Link>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 order-2 border border-slate-300 shadow-sm">
                            <img 
                              src={getAvatarForUser(user?.email, profileAvatar)} 
                              className="w-full h-full object-cover" 
                              alt="Me" 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Premium Skeleton Loading chat bubble (Thinking state) */}
                  {isTyping && isReadingDocs && (
                    <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-700">
                        <BotIcon size={20} className="text-white" />
                      </div>
                      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none px-4 py-4 w-48 relative overflow-hidden">
                        {/* Shimmer Effect Line */}
                        <div className="absolute top-0 left-0 h-[2px] bg-indigo-500/20 w-full overflow-hidden">
                           <div className="h-full w-1/3 bg-indigo-500 rounded-full animate-[shimmer_1.5s_infinite] relative -translate-x-full"></div>
                        </div>
                        {/* Skeleton Lines */}
                        <div className="flex flex-col gap-2.5 w-full mt-1 opacity-70">
                           <div className="h-2 bg-slate-200 rounded-full w-5/12 animate-pulse"></div>
                           <div className="h-2 bg-slate-200 rounded-full w-10/12 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                           <div className="h-2 bg-slate-200 rounded-full w-7/12 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Agentic Redirect Banner */}
                {pendingRedirect && (
                  <div className="absolute bottom-20 left-4 right-4 p-4 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 flex items-center justify-between z-20 animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white leading-tight">Navigating Automatically</span>
                        <span className="text-xs text-slate-400">Redirecting to {pendingRedirect.path} in {pendingRedirect.countdown}s...</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPendingRedirect(null)} 
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <form
                  onSubmit={handleSend}
                  className="p-4 bg-white border-t border-slate-200 relative z-10"
                >
                  <div className="relative flex items-center gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value)}
                      placeholder={
                        isAuthenticated()
                          ? tokensLeft > 0
                            ? "Ask a question..."
                            : "Upgrade to continue..."
                          : "Login to chat..."
                      }
                      disabled={!isAuthenticated() || tokensLeft <= 0}
                      className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={
                        !userInput.trim() ||
                        isTyping ||
                        !isAuthenticated() ||
                        tokensLeft <= 0
                      }
                      className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <div className="mt-2 flex justify-between items-center px-1">
                    <p className="text-[10px] text-slate-500">
                      Powered by ZetsuGuide AI.
                      {tokensLeft > 0 && isAuthenticated() && (
                        <span className="text-slate-400 ml-1">
                          {" "}
                          {tokensLeft}/30 queries remaining.
                        </span>
                      )}
                    </p>
                    {!isAuthenticated() && (
                      <Link
                        href="/auth"
                        className="text-[10px] font-bold text-slate-600 hover:text-slate-900"
                      >
                        Login Required
                      </Link>
                    )}
                  </div>
                </form>
              </div>

              {/* Direct Support Tab Content */}
              {/* Always mounted (CSS hidden) so DirectSupportChat never re-initialises on tab switch */}
              <div
                className="flex-1 flex flex-col overflow-hidden relative"
                style={{ display: activeTab === "direct-support" ? "flex" : "none" }}
              >
                {/* Login Gate Overlay for Direct Support */}
                {!isAuthenticated() && activeTab === "direct-support" && (
                  <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                      <MessageSquare size={24} className="text-slate-400" />
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xl max-w-xs w-full">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Login Required
                      </h3>
                      <p className="text-slate-500 text-sm mb-4">
                        You must be logged in to use Direct Support.
                      </p>
                      <div className="flex flex-col gap-2">
                        <Link
                          href="/auth"
                          className="block w-full bg-slate-900 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors text-sm shadow-md"
                        >
                          Login
                        </Link>
                        <button
                          onClick={() => setActiveTab("chat")}
                          className="w-full text-slate-400 hover:text-slate-600 text-xs transition-colors"
                        >
                          ? Back to Chat
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <DirectSupportChat />
              </div>

              {/* Support Form Tab Content */}
              <div
                className="flex-1 overflow-y-auto p-6 relative bg-slate-50"
                style={{ display: activeTab === "support-form" ? "block" : "none" }}
              >
                {/* Login Gate Overlay for Support Form */}
                {!isAuthenticated() && activeTab === "support-form" && (
                  <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                      <Sparkles size={24} className="text-slate-400" />
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xl max-w-xs w-full">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Login Required
                      </h3>
                      <p className="text-slate-500 text-sm mb-4">
                        You must be logged in to submit support requests.
                      </p>
                      <div className="flex flex-col gap-2">
                        <Link
                          href="/auth"
                          className="block w-full bg-slate-900 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors text-sm shadow-md"
                        >
                          Login
                        </Link>
                        <button
                          onClick={() => setActiveTab("chat")}
                          className="w-full text-slate-400 hover:text-slate-600 text-xs transition-colors"
                        >
                          ? Back to Chat
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-md">
                        <Sparkles size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">
                          Customer Support
                        </h3>
                        <p className="text-sm text-slate-500">
                          We'll get back to you within 24 hours
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={supportFormData.email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSupportFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all shadow-sm"
                          placeholder="your@email.com"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          value={supportFormData.phone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSupportFormData((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all shadow-sm"
                          placeholder="+20 123 456 7890"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                          Issue Category *
                        </label>
                        <select
                          required
                          value={supportFormData.category}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setSupportFormData((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all shadow-sm"
                        >
                          <option value="account">Account Issues</option>
                          <option value="payment">Payment & Billing</option>
                          <option value="technical">
                            Technical Problems
                          </option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                          Describe Your Issue *
                        </label>
                        <textarea
                          required
                          value={supportFormData.message}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setSupportFormData((prev) => ({
                              ...prev,
                              message: e.target.value,
                            }))
                          }
                          rows={5}
                          className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl py-3 px-4 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all resize-none shadow-sm"
                          placeholder="Please provide as much detail as possible..."
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={supportSubmitting}
                        className="w-full px-6 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:scale-[1.02] hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                      >
                        {supportSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Submit Ticket
                          </>
                        )}
                      </button>
                    </form>
                  </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

