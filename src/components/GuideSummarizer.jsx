import {
  CheckCircle,
  Crown,
  FileText,
  Loader2,
  Lock,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { extractGuideContent, sanitizeContent } from "../lib/utils";
import { supabase } from "../lib/api";

const SUMMARIZER_FREE_TRIAL_KEY = "guide_summarizer_free_trial_used";

export function GuideSummarizer({ guide, isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(false);

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

  useEffect(() => {
    if (isOpen && user) {
      checkFreeTrial();
    }
  }, [isOpen, user]);

  const checkFreeTrial = () => {
    if (!user) return;

    // Check in localStorage
    const trialKey = `${SUMMARIZER_FREE_TRIAL_KEY}_${user.email}`;
    const used = localStorage.getItem(trialKey);
    setHasUsedFreeTrial(used === "true");
  };

  const markFreeTrialUsed = () => {
    if (!user) return;
    const trialKey = `${SUMMARIZER_FREE_TRIAL_KEY}_${user.email}`;
    localStorage.setItem(trialKey, "true");
    setHasUsedFreeTrial(true);
  };

  const handleSummarize = async () => {
    // Check authentication
    if (!user) {
      toast.error("Please login to use Guide Summarizer", {
        description: "Sign in to get AI-powered summaries",
      });
      return;
    }

    // Check if user has used free trial
    if (hasUsedFreeTrial) {
      toast.error("Free trial already used!", {
        description: "Upgrade to Premium to unlock unlimited summaries",
        action: {
          label: "View Plans",
          onClick: () => {
            onClose();
            navigate("/pricing");
          },
        },
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "glm-4.5-air:free",
          messages: [
            {
              role: "user",
              content: `Please provide a comprehensive but concise summary of this guide. Include:
1. Main topic and purpose
2. Key points (3-5 bullet points)
3. Important takeaways
4. Who would benefit from this guide

Guide Title: ${guide.title}

Guide Content:
${extractGuideContent(guide)}

Format the summary in a clear, easy-to-read structure.`,
            },
          ],
          skipCreditDeduction: true,
        }),
      });

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      const data = await response.json();
      const aiSummary =
        data.choices[0]?.message?.content ||
        "Sorry, I couldn't generate a summary.";

      setSummary(aiSummary);
      markFreeTrialUsed();

      toast.success("Summary generated successfully! 🎉", {
        description: "This was your free trial. Upgrade for unlimited access.",
      });

      // Log usage
      await supabase.from("usage_logs").insert({
        user_email: user.email,
        action: "Guide Summarizer (Free Trial)",
        details: `Summarized guide: ${guide.title}`,
        credits_used: 0,
      });
    } catch (error) {
      console.error("Summarizer error:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsLoading(false);
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
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-black">
                  Quick Summary
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  {guide.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!hasUsedFreeTrial ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-500">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-bold text-green-700 text-sm">
                    FREE TRIAL
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border-2 border-gray-400">
                  <Lock className="w-4 h-4 text-gray-600" />
                  <span className="font-bold text-gray-700 text-sm">
                    TRIAL USED
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            {!summary ? (
              <div className="max-w-2xl mx-auto">
                {hasUsedFreeTrial ? (
                  <div className="bg-white border-4 border-black p-8 text-center">
                    <Lock className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-black mb-3">
                      Free Trial Used
                    </h3>
                    <p className="text-gray-600 mb-6 font-medium">
                      Upgrade to Premium for unlimited summaries
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        navigate("/pricing");
                      }}
                      className="px-8 py-4 bg-black text-white border-3 border-black font-bold hover:bg-gray-800 transition-colors mx-auto flex items-center gap-2"
                    >
                      <Crown className="w-5 h-5" />
                      View Pricing
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border-4 border-black p-8 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-black mb-3">
                      Generate Summary
                    </h3>
                    <p className="text-gray-600 mb-6 font-medium">
                      Get key points and takeaways instantly
                    </p>
                    <button
                      onClick={handleSummarize}
                      disabled={isLoading}
                      className="px-8 py-4 bg-black text-white border-3 border-black font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors mx-auto flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate FREE
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border-4 border-black p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-4 border-black">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-black text-black">
                    Summary Complete
                  </h3>
                </div>
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium">
                    {summary}
                  </div>
                </div>
                {hasUsedFreeTrial && (
                  <div className="mt-8 pt-6 border-t-4 border-gray-200">
                    <div className="bg-gray-50 border-3 border-black p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Crown className="w-6 h-6" />
                        <h4 className="font-black text-black">Want More?</h4>
                      </div>
                      <p className="text-gray-700 mb-4 font-medium">
                        Upgrade to Premium for unlimited summaries
                      </p>
                      <button
                        onClick={() => {
                          onClose();
                          navigate("/pricing");
                        }}
                        className="px-6 py-3 bg-black text-white border-3 border-black font-bold hover:bg-gray-800 transition-colors"
                      >
                        Upgrade Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
