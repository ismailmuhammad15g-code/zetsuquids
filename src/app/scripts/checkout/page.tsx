'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CreditCard, Building2, Check, Shield, Lock, ShoppingCart, Package
} from 'lucide-react';
import Loading from '@/components/scripts/Loading';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ScriptDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  extended_price?: number;
  thumbnail_url: string | null;
  author_name: string;
  category: string;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center">
        <Loading size={64} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items: cartItems, clearCart } = useCart();

  const scriptId = searchParams.get('script');
  const isCartCheckout = searchParams.get('cart') === 'true';

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [script, setScript] = useState<ScriptDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'paypal'>('card');
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [purchasedTotal, setPurchasedTotal] = useState(0);
  const [selectedLicense, setSelectedLicense] = useState<'regular' | 'extended'>('regular');

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchScriptDetails();
  }, [user, scriptId]);

  useEffect(() => {
    if (success && user) {
      sendPurchaseEmail();
    }
  }, [success, user]);

  const sendPurchaseEmail = async () => {
    try {
      await fetch('/api/send-purchase-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
          scriptTitle: isCartCheckout ? `${purchasedCount} scripts` : script?.title,
          amount: purchasedTotal,
          isCart: isCartCheckout,
          itemCount: purchasedCount
        })
      });
    } catch (err) {
      console.error('Email sending failed:', err);
    }
  };

  const fetchScriptDetails = async () => {
    setLoading(true);
    try {
      if (isCartCheckout) {
        setLoading(false);
        return;
      }
      if (!scriptId) {
        toast.error('No script selected');
        router.push('/scripts');
        return;
      }
      const { data, error } = await supabase
        .from('marketplace_scripts')
        .select('id, title, description, price, thumbnail_url, author_name, category')
        .eq('id', scriptId)
        .single();
      if (error) throw error;
      setScript(data);
    } catch (err) {
      console.error('Error fetching script:', err);
      toast.error('Failed to load script details');
      router.push('/scripts');
    } finally {
      setLoading(false);
    }
  };

  const getTotal = () => {
    if (isCartCheckout) {
      return cartItems.reduce((sum, item) => sum + item.price, 0);
    }
    if (!script) return 0;
    if (selectedLicense === 'extended') {
      return Number(script.extended_price || script.price * 5);
    }
    return Number(script.price);
  };

  const getItemCount = () => {
    if (isCartCheckout) {
      return cartItems.length;
    }
    return 1;
  };

  const handlePayment = async () => {
    if (!user) return;
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardName || !expiry || !cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    }
    setProcessing(true);
    try {
      if (isCartCheckout) {
        const count = cartItems.length;
        const total = cartItems.reduce((sum, item) => sum + item.price, 0);
        for (const item of cartItems) {
          const { data: existing } = await supabase
            .from('marketplace_purchases')
            .select('id')
            .eq('script_id', item.id)
            .eq('buyer_id', user.id)
            .maybeSingle();
          if (!existing) {
            await supabase.from('marketplace_purchases').insert({
              script_id: item.id,
              buyer_id: user.id,
              amount: item.price,
              license_type: item.license_type || 'regular',
              status: 'completed'
            });
          }
        }
        setPurchasedCount(count);
        setPurchasedTotal(total);
        clearCart();
      } else {
        if (!script) return;
        const { data: existing } = await supabase
          .from('marketplace_purchases')
          .select('id')
          .eq('script_id', script.id)
          .eq('buyer_id', user.id)
          .maybeSingle();
        if (existing) {
          toast.info('You already own this script!');
          setProcessing(false);
          return;
        }
        const purchaseAmount = selectedLicense === 'extended'
          ? Number(script.extended_price || script.price * 5)
          : Number(script.price);
        setPurchasedCount(1);
        setPurchasedTotal(purchaseAmount);
        const { error } = await supabase.from('marketplace_purchases').insert({
          script_id: script.id,
          buyer_id: user.id,
          amount: purchaseAmount,
          license_type: selectedLicense,
          status: 'completed'
        });
        if (error) throw error;
      }
      setSuccess(true);
      toast.success('Purchase successful!');
    } catch (err: any) {
      toast.error(`Payment failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center">
        <Loading size={64} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-[#fefefe] rounded-[2px] shadow-[0px_8px_0px_0px_rgba(0,0,0,0.06)] border border-[#c8b6a6]/20 overflow-hidden">
          {/* Header */}
          <div className="bg-[#f8f6f4] border-b border-[#c8b6a6]/15 px-8 py-6 text-center">
            <div className="w-16 h-16 bg-[#fefefe] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c8b6a6]/20">
              <Check size={32} className="text-[#c8b6a6]" />
            </div>
            <h1 className="font-heading text-xl font-semibold text-[#2d3436] mb-1">Purchase Confirmed!</h1>
            <p className="text-[#636e72] text-sm">Your order has been processed successfully.</p>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            {/* Script Details */}
            <div className="bg-[#f8f6f4] rounded-[2px] p-4 mb-5 border border-[#c8b6a6]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#fefefe] rounded-[2px] flex items-center justify-center border border-[#c8b6a6]/15 shrink-0">
                  <Package size={18} className="text-[#c8b6a6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-[#2d3436] text-sm truncate">
                    {isCartCheckout ? `${purchasedCount} script${purchasedCount !== 1 ? 's' : ''}` : script?.title}
                  </p>
                  <p className="text-xs text-[#636e72]">${purchasedTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Email notification */}
            <div className="flex items-start gap-3 p-4 bg-[#f8f6f4] rounded-[2px] mb-5 border border-[#c8b6a6]/10">
              <div className="w-8 h-8 bg-[#fefefe] rounded-full flex items-center justify-center border border-[#c8b6a6]/15 shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#c8b6a6]"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#2d3436]">Confirmation email sent</p>
                <p className="text-xs text-[#636e72] mt-0.5">A detailed receipt with download instructions has been sent to <span className="font-medium text-[#2d3436]">{user?.email}</span></p>
              </div>
            </div>

            {/* What's included */}
            <div className="mb-6">
              <p className="text-xs font-medium text-[#636e72] uppercase tracking-wider mb-3">What&apos;s included</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-sm text-[#636e72]">
                  <Check size={14} className="text-[#c8b6a6] shrink-0" />
                  <span>Immediate access to script files</span>
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

            {/* Actions */}
            <div className="space-y-3">
              <Link href="/scripts/dashboard" className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-3.5 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Go to My Purchases
              </Link>
              <Link href="/scripts" className="w-full bg-[#f8f6f4] text-[#636e72] font-medium py-3 rounded-[2px] hover:bg-[#fefefe] transition-colors flex items-center justify-center gap-2 text-sm border border-[#c8b6a6]/20">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f4]">
      {/* Header */}
      <div className="bg-[#fefefe] border-b border-[#c8b6a6]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/scripts" className="flex items-center gap-2 text-[#636e72] hover:text-[#2d3436] transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Marketplace</span>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-[#2d3436] mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Payment Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
              <h2 className="text-lg font-bold text-[#2d3436] mb-4 font-heading">Payment Method</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'card', label: 'Credit Card', icon: CreditCard },
                  { id: 'bank', label: 'Bank Transfer', icon: Building2 },
                  { id: 'paypal', label: 'PayPal', icon: Shield },
                ].map((method) => (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id as any)} className={`p-4 border-2 rounded-[2px] flex flex-col items-center gap-2 transition-colors ${paymentMethod === method.id ? 'border-[#c8b6a6] bg-[#f8f6f4]' : 'border-[#c8b6a6]/20 hover:border-[#c8b6a6]/40'}`}>
                    <method.icon size={24} className={paymentMethod === method.id ? 'text-[#c8b6a6]' : 'text-[#636e72]'} />
                    <span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-[#c8b6a6]' : 'text-[#636e72]'}`}>{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Details Form */}
            {paymentMethod === 'card' && (
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                <h2 className="text-lg font-bold text-[#2d3436] mb-4 font-heading">Card Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#636e72] mb-1">Card Number</label>
                    <input type="text" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} className="w-full px-4 py-3 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#636e72] mb-1">Cardholder Name</label>
                    <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full px-4 py-3 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none" placeholder="John Doe" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#636e72] mb-1">Expiry Date</label>
                      <input type="text" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} maxLength={5} className="w-full px-4 py-3 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none" placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#636e72] mb-1">CVV</label>
                      <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))} maxLength={4} className="w-full px-4 py-3 border border-[#c8b6a6]/30 rounded-[2px] focus:ring-1 focus:ring-[#c8b6a6] focus:border-[#c8b6a6] outline-none" placeholder="123" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank' && (
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                <h2 className="text-lg font-bold text-[#2d3436] mb-4 font-heading">Bank Transfer</h2>
                <div className="bg-[#f8f6f4] rounded-[2px] p-4 space-y-2">
                  <p className="text-sm text-[#636e72]"><span className="font-medium">Bank:</span> Example Bank</p>
                  <p className="text-sm text-[#636e72]"><span className="font-medium">Account Name:</span> ZetsuMarket Ltd</p>
                  <p className="text-sm text-[#636e72]"><span className="font-medium">Account Number:</span> 1234567890</p>
                  <p className="text-sm text-[#636e72]"><span className="font-medium">Routing Number:</span> 021000021</p>
                </div>
                <p className="text-xs text-[#636e72] mt-3">Please include your order reference in the transfer description.</p>
              </div>
            )}

            {/* PayPal Details */}
            {paymentMethod === 'paypal' && (
              <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6">
                <h2 className="text-lg font-bold text-[#2d3436] mb-4 font-heading">PayPal</h2>
                <div className="bg-[#f8f6f4] rounded-[2px] p-4 text-center">
                  <Shield size={48} className="mx-auto text-[#c8b6a6] mb-3" />
                  <p className="text-[#636e72]">You will be redirected to PayPal to complete your payment.</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 sticky top-24">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#c8b6a6]/15">
                <h2 className="font-heading text-base font-semibold text-[#2d3436]">Order Summary</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Items */}
                {isCartCheckout ? (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 bg-[#f8f6f4] rounded-[2px]">
                        <div className="w-11 h-11 bg-[#fefefe] rounded-[2px] flex items-center justify-center shrink-0 border border-[#c8b6a6]/15">
                          <ShoppingCart size={18} className="text-[#c8b6a6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#2d3436] text-sm leading-snug">{item.title}</p>
                          <p className="text-xs text-[#636e72] mt-0.5">by {item.author_name}</p>
                          <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#fefefe] text-[#636e72] text-[10px] font-medium rounded-[2px] border border-[#c8b6a6]/15">{item.license_type || 'regular'}</span>
                        </div>
                        <p className="font-heading font-semibold text-[#2d3436] text-sm shrink-0">${item.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : script ? (
                  <>
                    {/* Script Info */}
                    <div className="flex items-start gap-4 p-4 bg-[#f8f6f4] rounded-[2px]">
                      <div className="w-14 h-14 bg-[#fefefe] rounded-[2px] flex items-center justify-center shrink-0 border border-[#c8b6a6]/15">
                        <ShoppingCart size={22} className="text-[#c8b6a6]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-[#2d3436] text-sm leading-snug">{script.title}</p>
                        <p className="text-xs text-[#636e72] mt-1">by {script.author_name}</p>
                        <p className="text-[11px] text-[#636e72]/70 mt-0.5">{script.category}</p>
                      </div>
                    </div>

                    {/* License Selection */}
                    <div>
                      <p className="text-xs font-medium text-[#636e72] mb-3 uppercase tracking-wider">Select License</p>
                      <div className="space-y-3">
                        <label className={`block p-4 rounded-[2px] border-2 cursor-pointer transition-all ${selectedLicense === 'regular' ? 'border-[#c8b6a6] bg-[#f8f6f4]' : 'border-[#c8b6a6]/20 hover:border-[#c8b6a6]/40'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="license" value="regular" checked={selectedLicense === 'regular'} onChange={() => setSelectedLicense('regular')} className="w-4 h-4 text-[#c8b6a6] shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-[#2d3436] text-sm">Regular License</p>
                              <p className="text-[11px] text-[#636e72] mt-0.5">Use in a single end product</p>
                            </div>
                            <p className="font-heading font-semibold text-[#2d3436] text-sm shrink-0">${Number(script.price).toFixed(2)}</p>
                          </div>
                        </label>
                        <label className={`block p-4 rounded-[2px] border-2 cursor-pointer transition-all ${selectedLicense === 'extended' ? 'border-[#c8b6a6] bg-[#f8f6f4]' : 'border-[#c8b6a6]/20 hover:border-[#c8b6a6]/40'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="license" value="extended" checked={selectedLicense === 'extended'} onChange={() => setSelectedLicense('extended')} className="w-4 h-4 text-[#c8b6a6] shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-[#2d3436] text-sm">Extended License</p>
                              <p className="text-[11px] text-[#636e72] mt-0.5">Use in unlimited end products</p>
                            </div>
                            <p className="font-heading font-semibold text-[#2d3436] text-sm shrink-0">${Number(script.extended_price || script.price * 5).toFixed(2)}</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Pricing Breakdown */}
                <div className="border-t border-[#c8b6a6]/15 pt-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#636e72]">Subtotal ({getItemCount()} item{getItemCount() > 1 ? 's' : ''})</span>
                    <span className="font-medium text-[#2d3436] text-sm">${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#636e72]">Processing fee</span>
                    <span className="font-medium text-[#2d3436] text-sm">$0.00</span>
                  </div>
                  <div className="border-t border-[#c8b6a6]/15 pt-4 flex justify-between items-center">
                    <span className="font-heading font-semibold text-[#2d3436]">Total</span>
                    <span className="font-heading text-2xl font-semibold text-[#2d3436]">${getTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Pay Button */}
                <button onClick={handlePayment} disabled={processing} className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-4 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2.5 disabled:opacity-70 text-sm">
                  {processing ? (
                    <>
                      <Loading size={16} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Complete Payment &mdash; ${getTotal().toFixed(2)}
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-2 text-xs text-[#636e72]/70 pt-1">
                  <Shield size={13} />
                  <span>Secure checkout powered by ZetsuMarket</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
