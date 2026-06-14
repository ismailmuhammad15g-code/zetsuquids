'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MessageCircle, Mail, Globe,
  Send, ExternalLink, Clock, Shield, Copy, Check
} from 'lucide-react';
import Loading from '@/components/scripts/Loading';
import { supabase } from '@/lib/supabase';

interface SellerSupport {
  id: string;
  seller_id: string;
  seller_name: string;
  whatsapp: string;
  email: string;
  discord: string;
  telegram: string;
  twitter: string;
  website: string;
  custom_message: string;
  response_time: string;
}

export default function SellerSupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center">
        <Loading size={64} text="Loading seller info..." />
      </div>
    }>
      <SellerSupportContent />
    </Suspense>
  );
}

function SellerSupportContent() {
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<SellerSupport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (sellerId) {
      fetchSellerInfo();
    }
  }, [sellerId]);

  const fetchSellerInfo = async () => {
    try {
      // First try to get support settings
      const { data: supportData } = await supabase
        .from('seller_support')
        .select('*')
        .eq('seller_id', sellerId)
        .maybeSingle();

      if (supportData) {
        setSeller(supportData);
        setLoading(false);
        return;
      }

      // If no support settings, try to get seller name from their scripts
      const { data: scriptData } = await supabase
        .from('marketplace_scripts')
        .select('author_name, author_email')
        .eq('author_id', sellerId)
        .limit(1)
        .maybeSingle();

      if (scriptData) {
        // Create a basic seller entry from script data
        setSeller({
          id: '',
          seller_id: sellerId,
          seller_name: scriptData.author_name || 'Seller',
          whatsapp: '',
          email: scriptData.author_email || '',
          discord: '',
          telegram: '',
          twitter: '',
          website: '',
          custom_message: 'Hello! How can I help you?',
          response_time: 'Usually responds within 24 hours'
        });
        setLoading(false);
        return;
      }

      // Try to get from user profiles table
      const { data: profileData } = await supabase
        .from('zetsuguide_user_profiles')
        .select('user_name, user_email')
        .eq('user_id', sellerId)
        .maybeSingle();

      if (profileData) {
        setSeller({
          id: '',
          seller_id: sellerId,
          seller_name: profileData.user_name || 'Seller',
          whatsapp: '',
          email: profileData.user_email || '',
          discord: '',
          telegram: '',
          twitter: '',
          website: '',
          custom_message: 'Hello! How can I help you?',
          response_time: 'Usually responds within 24 hours'
        });
        setLoading(false);
        return;
      }

      // Last resort - check if user exists in auth (we can't query auth.users directly)
      // Just show a generic page with the seller ID
      setSeller({
        id: '',
        seller_id: sellerId,
        seller_name: 'Seller',
        whatsapp: '',
        email: '',
        discord: '',
        telegram: '',
        twitter: '',
        website: '',
        custom_message: 'This seller hasn\'t set up their contact information yet. Please try again later.',
        response_time: 'Contact information pending'
      });
    } catch (err) {
      console.error('Error fetching seller info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const getWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    return `https://wa.me/${cleaned.startsWith('+') ? cleaned.substring(1) : cleaned}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center">
        <Loading size={64} text="Loading seller info..." />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#fefefe] rounded-[2px] shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 overflow-hidden">
          <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/15 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-[#fefefe] rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Shield size={32} className="text-red-400" />
            </div>
            <h1 className="font-heading text-xl font-semibold text-[#2d3436] mb-2">Seller Not Found</h1>
            <p className="text-[#636e72] text-sm">This seller doesn&apos;t exist or the link is invalid.</p>
          </div>
          <div className="px-8 py-6 space-y-3">
            <Link href="/scripts" className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-3.5 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2 text-sm">
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyContact = seller.whatsapp || seller.email || seller.discord || seller.telegram || seller.website;

  return (
    <div className="min-h-screen bg-[#f8f6f4]">
      {/* Header */}
      <div className="bg-[#fefefe] border-b border-[#c8b6a6]/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/scripts" className="flex items-center gap-2 text-[#636e72] hover:text-[#2d3436] transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium text-sm">Back to Marketplace</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Seller Profile Card */}
        <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 overflow-hidden mb-6">
          {/* Profile Header */}
          <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/15 px-8 py-8 text-center">
            <div className="w-20 h-20 bg-[#2d3436] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#fefefe] font-heading text-2xl font-semibold">
                {seller.seller_name?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-[#2d3436] mb-1">{seller.seller_name}</h1>
            <p className="text-[#636e72] text-sm flex items-center justify-center gap-1.5">
              <Clock size={14} />
              {seller.response_time}
            </p>
          </div>

          {/* Welcome Message */}
          <div className="px-8 py-6">
            <div className="bg-[#f8f6f4] rounded-[2px] p-5 border border-[#c8b6a6]/10 mb-6">
              <p className="text-[#2d3436] text-sm leading-relaxed italic">&ldquo;{seller.custom_message}&rdquo;</p>
            </div>

            {/* Contact Methods */}
            {hasAnyContact ? (
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-[#636e72] uppercase tracking-wider mb-4">Contact Options</h3>

                {seller.whatsapp && (
                  <a
                    href={getWhatsAppLink(seller.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/10 hover:border-[#c8b6a6]/30 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-[#25D366] rounded-[2px] flex items-center justify-center shrink-0">
                      <MessageCircle size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2d3436] text-sm">WhatsApp</p>
                      <p className="text-xs text-[#636e72] truncate">{seller.whatsapp}</p>
                    </div>
                    <ExternalLink size={16} className="text-[#636e72]/40 group-hover:text-[#2d3436] transition-colors" />
                  </a>
                )}

                {seller.email && (
                  <div className="flex items-center gap-4 p-4 bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/10">
                    <div className="w-10 h-10 bg-[#EA4335] rounded-[2px] flex items-center justify-center shrink-0">
                      <Mail size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2d3436] text-sm">Email</p>
                      <p className="text-xs text-[#636e72] truncate">{seller.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(seller.email, 'email')}
                        className="p-2 text-[#636e72]/40 hover:text-[#2d3436] transition-colors"
                        title="Copy email"
                      >
                        {copied === 'email' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                      <a
                        href={`mailto:${seller.email}`}
                        className="p-2 text-[#636e72]/40 hover:text-[#2d3436] transition-colors"
                        title="Open email"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}

                {seller.discord && (
                  <div className="flex items-center gap-4 p-4 bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/10">
                    <div className="w-10 h-10 bg-[#5865F2] rounded-[2px] flex items-center justify-center shrink-0">
                      <MessageCircle size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2d3436] text-sm">Discord</p>
                      <p className="text-xs text-[#636e72] truncate">{seller.discord}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(seller.discord, 'discord')}
                      className="p-2 text-[#636e72]/40 hover:text-[#2d3436] transition-colors"
                      title="Copy Discord info"
                    >
                      {copied === 'discord' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}

                {seller.telegram && (
                  <a
                    href={seller.telegram.startsWith('http') ? seller.telegram : `https://t.me/${seller.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/10 hover:border-[#c8b6a6]/30 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-[#0088CC] rounded-[2px] flex items-center justify-center shrink-0">
                      <Send size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2d3436] text-sm">Telegram</p>
                      <p className="text-xs text-[#636e72] truncate">{seller.telegram}</p>
                    </div>
                    <ExternalLink size={16} className="text-[#636e72]/40 group-hover:text-[#2d3436] transition-colors" />
                  </a>
                )}

                {seller.website && (
                  <a
                    href={seller.website.startsWith('http') ? seller.website : `https://${seller.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/10 hover:border-[#c8b6a6]/30 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-[#2d3436] rounded-[2px] flex items-center justify-center shrink-0">
                      <Globe size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2d3436] text-sm">Website</p>
                      <p className="text-xs text-[#636e72] truncate">{seller.website}</p>
                    </div>
                    <ExternalLink size={16} className="text-[#636e72]/40 group-hover:text-[#2d3436] transition-colors" />
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle size={40} className="mx-auto text-[#c8b6a6]/30 mb-3" />
                <p className="text-[#636e72] text-sm mb-2">No contact methods available yet.</p>
                <p className="text-[#636e72]/60 text-xs">The seller hasn&apos;t added their contact information.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/scripts" className="flex-1 bg-[#2d3436] text-[#fefefe] font-medium py-3 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2 text-sm">
            Browse Marketplace
          </Link>
          <Link href="/support" className="flex-1 bg-[#fefefe] text-[#636e72] font-medium py-3 rounded-[2px] hover:bg-[#f8f6f4] transition-colors flex items-center justify-center gap-2 text-sm border border-[#c8b6a6]/20">
            General Support
          </Link>
        </div>
      </div>
    </div>
  );
}
