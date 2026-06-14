'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Download, Shield, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import Loading from '@/components/scripts/Loading';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ScriptData {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  author_name: string;
  thumbnail_url: string | null;
  download_url: string | null;
}

export default function DownloadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center">
        <Loading size={64} text="Verifying purchase..." />
      </div>
    }>
      <DownloadContent />
    </Suspense>
  );
}

function DownloadContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const scriptId = searchParams.get('script');
  const tokenUserId = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [script, setScript] = useState<ScriptData | null>(null);
  const [errorReason, setErrorReason] = useState('');

  useEffect(() => {
    if (authLoading) return;
    verifyAccess();
  }, [user, authLoading, scriptId, tokenUserId]);

  const verifyAccess = async () => {
    setLoading(true);

    // Check 1: URL params present
    if (!scriptId || !tokenUserId) {
      setAuthorized(false);
      setErrorReason('Invalid download link');
      setLoading(false);
      return;
    }

    // Check 2: User is logged in
    if (!user) {
      setAuthorized(false);
      setErrorReason('Please log in to access your download');
      setLoading(false);
      return;
    }

    // Check 3: Token matches logged-in user
    if (user.id !== tokenUserId) {
      setAuthorized(false);
      setErrorReason('This download link is not assigned to your account');
      setLoading(false);
      return;
    }

    // Check 4: Purchase exists in database
    try {
      const { data: purchase, error: purchaseError } = await supabase
        .from('marketplace_purchases')
        .select('id')
        .eq('script_id', scriptId)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (purchaseError || !purchase) {
        setAuthorized(false);
        setErrorReason('No purchase found for this script on your account');
        setLoading(false);
        return;
      }

      // Check 5: Fetch script details
      const { data: scriptData, error: scriptError } = await supabase
        .from('marketplace_scripts')
        .select('id, title, description, price, category, author_name, thumbnail_url, download_url')
        .eq('id', scriptId)
        .single();

      if (scriptError || !scriptData) {
        setAuthorized(false);
        setErrorReason('Script not found');
        setLoading(false);
        return;
      }

      // All checks passed
      setScript(scriptData);
      setAuthorized(true);
      setLoading(false);

      // Fire confetti!
      fireConfetti();
    } catch (err) {
      setAuthorized(false);
      setErrorReason('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  const fireConfetti = () => {
    const duration = 4000;
    const end = Date.now() + duration;

    const colors = ['#c8b6a6', '#2d3436', '#636e72', '#f8f6f4'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.3 },
      colors,
    });

    frame();
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center">
        <Loading size={64} text="Verifying your purchase..." />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#fefefe] rounded-[2px] shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 overflow-hidden">
          <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/15 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-[#fefefe] rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Shield size={32} className="text-red-400" />
            </div>
            <h1 className="font-heading text-xl font-semibold text-[#2d3436] mb-2">Authentication Required</h1>
            <p className="text-[#636e72] text-sm">Please log in to access your download.</p>
          </div>
          <div className="px-8 py-6 space-y-3">
            <Link href="/auth" className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-3.5 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2 text-sm">
              Log In
            </Link>
            <Link href="/scripts" className="w-full bg-[#f8f6f4] text-[#636e72] font-medium py-3 rounded-[2px] hover:bg-[#fefefe] transition-colors flex items-center justify-center gap-2 text-sm border border-[#c8b6a6]/20">
              <ArrowLeft size={16} />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized (wrong user or invalid link)
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#fefefe] rounded-[2px] shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 overflow-hidden">
          <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/15 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-[#fefefe] rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Shield size={32} className="text-red-400" />
            </div>
            <h1 className="font-heading text-xl font-semibold text-[#2d3436] mb-2">Link Invalid</h1>
            <p className="text-[#636e72] text-sm">{errorReason || 'This download link is invalid or has expired.'}</p>
          </div>
          <div className="px-8 py-6 space-y-3">
            <Link href="/scripts/dashboard" className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-3.5 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2 text-sm">
              Go to My Purchases
            </Link>
            <Link href="/scripts" className="w-full bg-[#f8f6f4] text-[#636e72] font-medium py-3 rounded-[2px] hover:bg-[#fefefe] transition-colors flex items-center justify-center gap-2 text-sm border border-[#c8b6a6]/20">
              <ArrowLeft size={16} />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authorized - show download page with celebration
  return (
    <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#fefefe] rounded-[2px] shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 overflow-hidden">
        {/* Header */}
        <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/15 px-8 py-8 text-center">
          <div className="w-20 h-20 bg-[#fefefe] rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-[#c8b6a6]/30">
            <Check size={40} className="text-[#c8b6a6]" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-[#2d3436] mb-2">Download Ready!</h1>
          <p className="text-[#636e72] text-sm">Your purchase has been verified. Download your script below.</p>
        </div>

        {/* Script Details */}
        <div className="px-8 py-6">
          <div className="bg-[#f8f6f4] rounded-[2px] p-5 mb-6 border border-[#c8b6a6]/10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[#fefefe] rounded-[2px] flex items-center justify-center shrink-0 border border-[#c8b6a6]/15">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#c8b6a6]"><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-[#2d3436] text-base leading-snug">{script?.title}</p>
                <p className="text-sm text-[#636e72] mt-1">by {script?.author_name}</p>
                <p className="text-xs text-[#636e72]/70 mt-0.5">{script?.category}</p>
              </div>
            </div>
          </div>

          {/* What's included */}
          <div className="mb-6">
            <p className="text-xs font-medium text-[#636e72] uppercase tracking-wider mb-3">What&apos;s included</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-[#636e72]">
                <Check size={14} className="text-[#c8b6a6] shrink-0" />
                <span>Full source code access</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[#636e72]">
                <Check size={14} className="text-[#c8b6a6] shrink-0" />
                <span>6 months of author support</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[#636e72]">
                <Check size={14} className="text-[#c8b6a6] shrink-0" />
                <span>Future updates included</span>
              </div>
            </div>
          </div>

          {/* Download Button */}
          {script?.download_url ? (
            <a
              href={script.download_url}
              download
              className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-4 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2.5 text-sm mb-3"
            >
              <Download size={18} />
              Download Script
            </a>
          ) : (
            <div className="w-full bg-[#f8f6f4] text-[#636e72] font-medium py-4 rounded-[2px] flex items-center justify-center gap-2 text-sm border border-[#c8b6a6]/20 mb-3">
              Download not available yet. Contact the author.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/scripts/dashboard" className="flex-1 bg-[#f8f6f4] text-[#636e72] font-medium py-3 rounded-[2px] hover:bg-[#fefefe] transition-colors flex items-center justify-center gap-2 text-sm border border-[#c8b6a6]/20">
              My Purchases
            </Link>
            <Link href="/scripts" className="flex-1 bg-[#f8f6f4] text-[#636e72] font-medium py-3 rounded-[2px] hover:bg-[#fefefe] transition-colors flex items-center justify-center gap-2 text-sm border border-[#c8b6a6]/20">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
