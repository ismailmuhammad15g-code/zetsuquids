import { PricingSection } from "@/components/blocks/pricing-section";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/api";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const PAYMENT_FREQUENCIES = ["monthly", "yearly"];

export const TIERS = [
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
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch Credits
  useEffect(() => {
    async function fetchCredits() {
      if (user?.email) {
        setLoadingCredits(true);
        try {
          const { data, error } = await supabase
            .from("zetsuguide_credits")
            .select("credits")
            .eq("user_email", user.email.toLowerCase())
            .maybeSingle();

          if (data) {
            setCredits(data.credits);
          }
        } catch (err) {
          console.error("Error fetching credits:", err);
        } finally {
          setLoadingCredits(false);
        }
      }
    }
    fetchCredits();
  }, [user]);

  const handleAction = async (tier) => {
    // 1. Handle Free Plan
    if (tier.planType === "free") {
      if (!isAuthenticated()) {
        navigate("/auth");
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
        navigate("/auth");
        return;
      }

      setProcessingPayment(true);
      const toastId = toast.loading("Processing payment request...");

      try {
        const response = await fetch("/api/payments?type=create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: user.email,
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

  return (
    <div className="w-full flex flex-col items-center bg-transparent text-foreground pb-20 relative">
      {/* Back Button */}
      <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <Link
          to="/"
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
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Your Balance:</span>
            </div>

            <div className="flex items-center gap-3">
              {loadingCredits ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
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

      {/* Pricing Table - Slightly scaled up to fix visibility issues */}
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
    </div>
  );
}
