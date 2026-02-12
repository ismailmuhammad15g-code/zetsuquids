import { motion } from "framer-motion";
import { Cpu, FileText, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { MotionCarousel } from "./MotionCarousel";

// --- Generated Visuals (React Components) ---

const VisualContainer = ({ children, step }) => (
  <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8 border-2 border-gray-100 rounded-xl relative overflow-hidden group">
    <div className="absolute top-4 left-4 text-xs font-mono text-gray-400">
      STEP 0{step}
    </div>
    <div className="relative z-10 w-full flex items-center justify-center">
      {children}
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
  </div>
);

const Slide1Visual = () => (
  <VisualContainer step={1}>
    <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">
      <div className="w-full bg-gray-100 rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex gap-2 items-center mb-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <div className="h-2 w-20 bg-gray-300 rounded"></div>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-gray-200 rounded"></div>
          <div className="h-1.5 w-2/3 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="text-center">
        <h4 className="font-bold text-gray-900">Enter Prompt</h4>
        <p className="text-xs text-gray-500 mt-1">
          Describe what you need clearly
        </p>
      </div>
    </div>
  </VisualContainer>
);

const Slide2Visual = () => (
  <VisualContainer step={2}>
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Cpu className="w-20 h-20 text-gray-800" strokeWidth={1} />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-gray-400 fill-gray-100" />
        </div>
      </div>
      <div className="text-center">
        <h4 className="font-bold text-gray-900">AI Processing</h4>
        <p className="text-xs text-gray-500 mt-1">
          Our engine updates your content
        </p>
      </div>
    </div>
  </VisualContainer>
);

const Slide3Visual = () => (
  <VisualContainer step={3}>
    <div className="flex flex-col items-center gap-4">
      <div className="w-24 h-32 bg-gray-50 border-2 border-gray-200 rounded flex flex-col p-2 relative shadow-md transform rotate-3 transition-transform group-hover:rotate-0">
        <FileText className="w-6 h-6 text-gray-800 mb-2" />
        <div className="space-y-1.5 opacity-50">
          <div className="w-full h-1 bg-gray-400 rounded"></div>
          <div className="w-full h-1 bg-gray-400 rounded"></div>
          <div className="w-3/4 h-1 bg-gray-400 rounded"></div>
          <div className="w-full h-1 bg-gray-400 rounded"></div>
        </div>
        <div className="mt-auto self-end">
          <div className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="text-center">
        <h4 className="font-bold text-gray-900">Review & Guide</h4>
        <p className="text-xs text-gray-500 mt-1">
          Get your polished guide instantly
        </p>
      </div>
    </div>
  </VisualContainer>
);

export const OnboardingModal = () => {
  const [isOpen, setIsOpen] = useState(false); // Default false, wait for check
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return; // Public user or not logged in, maybe don't show or show? Assuming auth users.
      }

      // Check profile
      const { data: profile, error } = await supabase
        .from("zetsuguide_user_profiles")
        .select("has_seen_onboarding")
        .eq("user_email", user.email)
        .single();

      if (error) {
        console.error("Error checking profile:", error);
        setLoading(false);
        return;
      }

      if (!profile?.has_seen_onboarding) {
        setIsOpen(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("zetsuguide_user_profiles")
          .update({ has_seen_onboarding: true })
          .eq("user_email", user.email);
      }
      setIsOpen(false);
    } catch (e) {
      console.error("Error updating status:", e);
      setIsOpen(false); // Close anyway
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 z-[99999] bg-white flex items-center justify-center">
        {/* Blocks content while checking */}
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full mb-2"></div>
          <div className="h-2 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );

  if (!isOpen) return null;

  const OPTIONS = { loop: false };
  const SLIDES = [
    <div key="slide-1" className="relative w-full h-[350px]">
      <Slide1Visual />
    </div>,
    <div key="slide-2" className="relative w-full h-[350px]">
      <Slide2Visual />
    </div>,
    <div key="slide-3" className="relative w-full h-[350px]">
      <Slide3Visual />
    </div>,
    <div
      key="slide-final"
      className="relative w-full h-[350px] overflow-hidden rounded-xl bg-gray-900 flex flex-col items-center justify-center text-center p-6 text-white"
    >
      <div className="absolute inset-0 opacity-20">
        {/* Abstract background pattern */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent"></div>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/10 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 50 + 10}px`,
              height: `${Math.random() * 50 + 10}px`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <Sparkles className="w-12 h-12 text-yellow-400" />
        <div>
          <h3 className="text-3xl font-bold mb-2">You're All Set!</h3>
          <p className="text-gray-300 max-w-xs mx-auto text-sm">
            Experience the power of Zetsu Guide AI. Create unlimited guides with
            ease.
          </p>
        </div>
        <button
          className="px-8 py-3 bg-white text-gray-900 font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
          onClick={handleComplete}
        >
          Get Started
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="p-4 md:p-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900">
            Welcome to ZetsuGuide AI
          </h2>
          <p className="text-sm text-gray-500">Quick start guide</p>
        </div>
        <div className="p-4 md:p-6 pt-0">
          <MotionCarousel slides={SLIDES} options={OPTIONS} />
        </div>
      </motion.div>
    </div>
  );
};
