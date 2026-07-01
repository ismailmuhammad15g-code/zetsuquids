"use client";
import { PricingSection } from "@/components/blocks/pricing-section";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const PAYMENT_FREQUENCIES = ["monthly", "yearly"] as const;

type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number];

interface PricingTier {
  id: string;
  name: string;
  price: Record<PaymentFrequency, number | string>;
  credits?: number;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  highlighted?: boolean;
  planType?: "free" | "paid" | "custom";
}

export const TIERS: PricingTier[] = [
  {
    id: "individuals",
    name: "Individuals",
    price: {
      monthly: "Free",
      yearly: "Free",
    },
    description: "Perfect for hobbyists and learners",
    features: [
      "Access to public guides",
      "5 AI credits per day",
      "Community support",
      "Basic bookmarking",
      "Ad-supported experience",
    ],
    cta: "Get started",
    planType: "free",
  },
  {
    id: "teams",
    name: "Teams",
    price: {
      monthly: 15,
      yearly: 144,
    },
    credits: 500, // Example credit amount
    description: "Great for small businesses & pros",
    features: [
      "Unlimited AI credits",
      "Create private guides",
      "Priority email support",
      "Advanced search filters",
      "No advertisements",
    ],
    cta: "Get started",
    popular: true,
    planType: "paid",
  },
  {
    id: "organizations",
    name: "Organizations",
    price: {
      monthly: 49,
      yearly: 470,
    },
    credits: 2000,
    description: "Collab tools for growing teams",
    features: [
      "Everything in Teams",
      "Team workspace sharing",
      "Role-based permissions",
      "Usage analytics",
      "Dedicated slack channel",
    ],
    cta: "Get started",
    planType: "paid",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: {
      monthly: "Custom",
      yearly: "Custom",
    },
    description: "For large scale deployments",
    features: [
      "Everything in Organizations",
      "SSO & Directory Sync",
      "Custom AI model fine-tuning",
      "SLA Guarantees",
      "Dedicated Success Manager",
    ],
    cta: "Contact Us",
    highlighted: true,
    planType: "custom",
  },
];

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [zPoints, setZPoints] = useState(0);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<"plans" | "zp">("plans");
  const [converting, setConverting] = useState(false);

  // Fetch Credits
  useEffect(() => {
    async function fetchCredits() {
      if (user?.email) {
        setLoadingCredits(true);
        try {
          const { data } = await supabase
            .from("zetsuguide_credits")
            .select("credits, z_points")
            .eq("user_email", user.email.toLowerCase())
            .maybeSingle();

          if (data) {
            setCredits(data.credits);
            setZPoints(data.z_points || 0);
          } else {
            // No credits row exists for this user — create a default entry (5 credits)
            try {
              const { error: insertErr } = await supabase
                .from("zetsuguide_credits")
                .insert([
                  {
                    user_email: user.email.toLowerCase(),
                    credits: 5,
                    z_points: 0,
                    total_referrals: 0,
                  },
                ]);

              if (!insertErr) {
                setCredits(5);
                setZPoints(0);
              } else {
                console.warn("Failed to create credits row:", insertErr);
                setCredits(0);
              }
            } catch (insertEx) {
              console.error("Insert credits error:", insertEx);
              setCredits(0);
            }
          }
        } catch (err) {
          console.error("Error fetching credits:", err);
        } finally {
          setLoadingCredits(false);
        }
      }
    }
    fetchCredits();
  }, [user?.id]);

  const handleAction = async (tier: PricingTier) => {
    // 1. Handle Free Plan
    if (tier.planType === "free") {
      if (!isAuthenticated()) {
        router.push("/auth");
      } else {
        // Already on free plan
        toast.info("You are currently on the Free plan.");
      }
      return;
    }

    // 2. Handle Custom/Enterprise
    if (tier.planType === "custom") {
      window.location.href =
        "mailto:support@zetsuguide.com?subject=Enterprise Inquiry";
      return;
    }

    // 3. Handle Paid Plans (Paymob)
    if (tier.planType === "paid") {
      if (!isAuthenticated()) {
        toast.error("Please login to purchase a plan");
        router.push("/auth");
        return;
      }

      const userEmail = user?.email;
      if (!userEmail) {
        toast.error("Please login to purchase a plan");
        router.push("/auth");
        return;
      }

      setProcessingPayment(true);
      const toastId = toast.loading("Processing payment request...");

      try {
        const response = await fetch("/api/payments?type=create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail,
            amount: tier.price.monthly, // Using monthly price for this demo
            credits: tier.credits || 100, // Default credits if not specified
          }),
        });

        const data = await response.json();

        if (data.url) {
          toast.dismiss(toastId);
          toast.success("Redirecting to secure payment...");
          // Open payment iframe/page
          window.location.href = data.url;
        } else {
          toast.dismiss(toastId);
          toast.error("Failed to initiate payment. Please try again.");
          console.error("Payment error:", data);
        }
      } catch (err) {
        toast.dismiss(toastId);
        console.error("Payment exception:", err);
        toast.error("An error occurred. Please try again later.");
      } finally {
        setProcessingPayment(false);
      }
    }
  };

  const handleConvertZp = async () => {
    if (!isAuthenticated() || !user?.email) {
      toast.error("Please login first");
      router.push("/auth");
      return;
    }

    if (zPoints < 100) {
      toast.error("You need at least 100 Zp to convert to Z-Coins.");
      return;
    }

    setConverting(true);
    const toastId = toast.loading("Converting Zp to Z-Coins...");

    try {
      const { data, error } = await supabase.rpc("convert_zpoints", {
        p_user_email: user.email.toLowerCase(),
        p_zpoints_to_convert: 100, // Hardcoded to 100 per conversion for now
      });

      if (error) throw error;

      if (data) {
        toast.dismiss(toastId);
        toast.success("Successfully converted 100 Zp to 10 Z-Coins!");
        setZPoints((prev) => prev - 100);
        setCredits((prev) => prev + 10);
      } else {
        toast.dismiss(toastId);
        toast.error("Failed to convert. Not enough Zp.");
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.error("Conversion error:", err);
      toast.error("An error occurred during conversion.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center bg-transparent text-foreground pb-20 relative">
      {/* Back Button */}
      <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      {/* Credit Balance Display */}
      {isAuthenticated() && (
        <div className="w-full px-4 mb-4 flex justify-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border rounded-xl px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <img src="/images/zcoin.svg" alt="coin" className="h-12 w-12 object-contain drop-shadow-md" />
              <span className="text-lg font-bold text-gray-900">Your Balance:</span>
            </div>

            <div className="flex items-center gap-3">
              {loadingCredits ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-3xl font-black bg-gradient-to-r from-amber-600 via-yellow-700 to-amber-900 bg-clip-text text-transparent">
                  {credits} Credits
                </span>
              )}
              <div className="h-6 w-[1px] bg-border mx-2 hidden sm:block"></div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Free Plan
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Tabs */}
      <div className="w-full max-w-sm mx-auto mb-8 px-4 relative z-10">
        <div className="flex items-center justify-between p-1 bg-gray-100/80 backdrop-blur border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              activeTab === "plans"
                ? "bg-white text-black shadow-sm dark:bg-black dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            Upgrade Plans
          </button>
          <button
            onClick={() => setActiveTab("zp")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === "zp"
                ? "bg-white text-black shadow-sm dark:bg-black dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            <img src="/images/Zpoint.svg" alt="Zp" className="w-5 h-5 object-contain" />
            Replace Zp
          </button>
        </div>
      </div>

      {activeTab === "plans" ? (
        <div className="w-full max-w-[1400px] mx-auto px-4 mt-2">
          <div className="scale-[1.05] origin-top md:scale-[1.05]">
            <PricingSection
              title="Pricing"
              subtitle="Choose the best plan to supercharge your development workflow"
              frequencies={PAYMENT_FREQUENCIES}
              tiers={TIERS}
              user={user}
              onPlanSelect={handleAction}
              processingPayment={processingPayment}
            />
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl mx-auto px-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="text-center mb-10 relative z-10">
              <h2 className="text-3xl font-black mb-4">Convert Zp to Z-Coins</h2>
              <p className="text-gray-500 max-w-md mx-auto font-medium">
                Exchange your earned Z-Points for Z-Coins. Every 100 Zp gives you 10 Z-Coins!
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 relative z-10">
              {/* Zp Balance */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full md:w-48 text-center flex flex-col items-center justify-center relative shadow-sm">
                <img src="/images/Zpoint.svg" alt="Zp" className="w-16 h-16 object-contain drop-shadow-lg mb-4 animate-bounce" style={{ animationDuration: '3s' }} />
                <span className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Your Zp</span>
                <span className="text-4xl font-black text-black dark:text-white">{zPoints}</span>
              </div>

              {/* Conversion Arrow */}
              <div className="bg-gray-100 dark:bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center rotate-90 md:rotate-0 flex-shrink-0 z-20 shadow-sm border border-gray-200 dark:border-gray-700">
                <ArrowLeft className="w-6 h-6 text-gray-400 rotate-180" />
              </div>

              {/* Z-Coins Balance */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full md:w-48 text-center flex flex-col items-center justify-center relative shadow-sm">
                <img src="/images/zcoin.svg" alt="Z-Coin" className="w-16 h-16 object-contain drop-shadow-lg mb-4" />
                <span className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Z-Coins</span>
                <span className="text-4xl font-black bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">{credits}</span>
              </div>
            </div>

            <div className="relative z-10">
              <button
                onClick={handleConvertZp}
                disabled={converting || zPoints < 100}
                className="w-full py-5 px-6 bg-black text-white dark:bg-white dark:text-black rounded-2xl font-black text-lg hover:-translate-y-1 hover:shadow-xl transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-3"
              >
                {converting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Convert 100 Zp <ArrowLeft className="w-5 h-5 rotate-180" /> 10 Z-Coins
                  </>
                )}
              </button>
              
              <div className="mt-4 text-center">
                <span className="text-sm font-semibold text-gray-400">
                  {zPoints < 100 ? `You need ${100 - zPoints} more Zp to convert.` : "Ready to convert!"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
