import { Bot, Loader2, MessageCircle, Send, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/api";

export function GuideAIChat({ guide, isOpen, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [credits, setCredits] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user) {
      fetchCredits();
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, user]);

  const fetchCredits = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("zetsuguide_credits")
        .select("credits")
        .eq("user_email", user.email.toLowerCase())
        .maybeSingle(); // use maybeSingle to avoid 406 when row doesn't exist

      if (!error && data) {
        setCredits(data.credits ?? 0);
      } else if (!error && !data) {
        // No row yet — treat as zero credits
        setCredits(0);
      } else if (error) {
        // Log and fallback silently to 0
        console.debug(
          "Credits query returned error (handled):",
          error.message || error,
        );
        setCredits(0);
      }
    } catch (err) {
      console.error("Error fetching credits:", err);
    }
  };

  const deductCredits = async (amount) => {
    if (!user) return false;

    try {
      // Use RPC function to safely deduct credits
      const { data, error } = await supabase.rpc("deduct_credits", {
        user_email_param: user.email.toLowerCase(),
        amount_param: amount,
      });

      if (error) {
        console.error("Deduct credits error:", error);
        toast.error("Error deducting credits");
        return false;
      }

      const result = data?.[0];
      if (!result?.success) {
        toast.error("Insufficient credits! You need 2 credits per question.", {
          description: "Get more credits from the pricing page",
        });
        return false;
      }

      // Log usage
      await supabase.from("usage_logs").insert({
        user_email: user.email.toLowerCase(),
        action: "Guide AI Chat",
        details: `Question about guide: ${guide.title}`,
        credits_used: amount,
      });

      setCredits(result.new_balance);
      toast.success(`${amount} credits used. Remaining: ${result.new_balance}`);
      return true;
    } catch (err) {
      console.error("Error deducting credits:", err);
      toast.error("Error processing credits");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check authentication
    if (!user) {
      toast.error("Please login to use AI Chat", {
        description: "Sign in to ask questions about this guide",
      });
      return;
    }

    // Deduct credits first
    const success = await deductCredits(2);
    if (!success) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Prepare context from guide
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Removed hardcoded model to let backend choose the best available one
          // model: "google/gemini-2.0-flash-exp:free",
          messages: [
            {
              role: "system",
              content: `You are ZetsuGuide AI, a helpful and intelligent assistant for a developer documentation platform.

              CONTEXT:
              ${context}

              INSTRUCTIONS:
              1. Answer the user's question based on the provided guide content.
              2. If the answer is not in the guide, use your general knowledge but mention that it's not in the guide.
              3. Be concise, professional, and helpful.
              4. Format code blocks properly.`,
            },
            ...messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: "user", content: userMessage },
          ],
          skipCreditDeduction: true,
        }),
      });

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      const data = await response.json();
      const aiResponse =
        data.choices[0]?.message?.content ||
        "Sorry, I couldn't generate a response.";

      // Typing animation effect
      setIsTyping(false);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);
    } catch (error) {
      console.error("AI Chat error:", error);
      toast.error("Failed to get AI response");
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[99998]" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed inset-0 z-[99999] flex flex-col bg-white"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
        }}
      >
        {/* Header */}
        <div className="bg-white border-b-4 border-black p-6 pt-20 flex-shrink-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-black">AI Chat</h2>
                <p className="text-sm text-gray-600 font-medium">
                  {guide.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {credits !== null && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-black">
                  <Zap className="w-4 h-4" />
                  <span className="font-bold text-black">
                    {credits} Credits
                  </span>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-12 h-12 bg-black hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-black flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-black mb-3">
                  Start Conversation
                </h3>
                <p className="text-gray-600 text-base font-medium">
                  Ask any question about this guide
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-10 h-10 bg-black flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] px-5 py-3 border-3 border-black ${
                        message.role === "user"
                          ? "bg-black text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed font-medium">
                        {message.content}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-10 h-10 bg-gray-700 border-2 border-black flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {user?.email?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-10 h-10 bg-black flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white px-5 py-3 border-3 border-black">
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Simple, No Animations */}
        <form
          onSubmit={handleSubmit}
          className="p-6 border-t-4 border-black bg-white flex-shrink-0"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                disabled={isLoading}
                className="flex-1 px-5 py-4 text-base font-medium text-black placeholder:text-gray-400 border-3 border-black focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-8 py-4 bg-black text-white border-3 border-black font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <p className="text-gray-600 font-medium">
                💡 <span className="font-bold">2 credits</span> per question
              </p>
              <p className="text-gray-500">
                Press{" "}
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-mono">
                  Enter
                </kbd>{" "}
                to send
              </p>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
