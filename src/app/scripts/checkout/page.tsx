'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CreditCard, Building2, Check, Shield, Lock, ShoppingCart
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
      <div className="min-h-screen bg-[#f8f6f4] flex items-center justify-center">
        <div className="max-w-md w-full bg-[#fefefe] rounded-[2px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] p-8 text-center">
          <div className="w-20 h-20 bg-[#f8f6f4] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-[#c8b6a6]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#2d3436] mb-2 font-heading">Payment Successful!</h1>
          <p className="text-[#636e72] mb-6">
            {isCartCheckout
              ? `You have successfully purchased ${purchasedCount} item${purchasedCount !== 1 ? 's' : ''} for $${purchasedTotal.toFixed(2)}.`
              : `You now own "${script?.title}" for $${purchasedTotal.toFixed(2)}.`
            }
          </p>
          <div className="space-y-3">
            <Link href="/scripts/dashboard" className="w-full bg-[#2d3436] text-[#fefefe] font-bold py-3 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2">
              View My Purchases
            </Link>
            <Link href="/scripts" className="w-full bg-[#f8f6f4] text-[#636e72] font-bold py-3 rounded-[2px] hover:bg-[#f8f6f4] transition-colors flex items-center justify-center gap-2">
              Continue Shopping
            </Link>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-extrabold text-[#2d3436] mb-8 font-heading">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
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
          <div className="lg:col-span-1">
            <div className="bg-[#fefefe] rounded-[2px] shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] border border-[#c8b6a6]/20 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#2d3436] mb-4 font-heading">Order Summary</h2>
              {isCartCheckout ? (
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-[#f8f6f4] rounded-[2px]">
                      <div className="w-10 h-10 bg-[#c8b6a6]/20 rounded-[2px] flex items-center justify-center">
                        <ShoppingCart size={16} className="text-[#636e72]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2d3436] truncate">{item.title}</p>
                        <p className="text-xs text-[#636e72]">by {item.author_name}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#f8f6f4] text-[#636e72] text-[10px] font-bold uppercase rounded-[2px]">{item.license_type || 'regular'}</span>
                      </div>
                      <p className="text-sm font-bold text-[#2d3436]">${item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : script ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-[#f8f6f4] rounded-[2px] mb-4">
                    <div className="w-12 h-12 bg-[#c8b6a6]/20 rounded-[2px] flex items-center justify-center">
                      <ShoppingCart size={20} className="text-[#636e72]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2d3436] truncate">{script.title}</p>
                      <p className="text-sm text-[#636e72]">by {script.author_name}</p>
                      <p className="text-xs text-[#636e72]">{script.category}</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <label className={`block p-3 rounded-[2px] border-2 cursor-pointer transition-all ${selectedLicense === 'regular' ? 'border-[#c8b6a6] bg-[#f8f6f4]' : 'border-[#c8b6a6]/20 hover:border-[#c8b6a6]/40'}`}>
                      <div className="flex items-center gap-2">
                        <input type="radio" name="license" value="regular" checked={selectedLicense === 'regular'} onChange={() => setSelectedLicense('regular')} className="w-4 h-4 text-[#c8b6a6]" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="font-bold text-[#2d3436] text-sm">Regular License</span>
                          <span className="font-extrabold text-[#2d3436]">${Number(script.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </label>
                    <label className={`block p-3 rounded-[2px] border-2 cursor-pointer transition-all ${selectedLicense === 'extended' ? 'border-[#c8b6a6] bg-[#f8f6f4]' : 'border-[#c8b6a6]/20 hover:border-[#c8b6a6]/40'}`}>
                      <div className="flex items-center gap-2">
                        <input type="radio" name="license" value="extended" checked={selectedLicense === 'extended'} onChange={() => setSelectedLicense('extended')} className="w-4 h-4 text-[#c8b6a6]" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="font-bold text-[#2d3436] text-sm">Extended License</span>
                          <span className="font-extrabold text-[#2d3436]">${Number(script.extended_price || script.price * 5).toFixed(2)}</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </>
              ) : null}

              <div className="border-t border-[#c8b6a6]/20 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#636e72]">Subtotal ({getItemCount()} item{getItemCount() > 1 ? 's' : ''})</span>
                  <span className="font-medium">${getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#636e72]">Processing Fee</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="border-t border-[#c8b6a6]/20 pt-2 flex justify-between">
                  <span className="font-bold text-[#2d3436]">Total</span>
                  <span className="text-xl font-extrabold text-[#c8b6a6]">${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <button onClick={handlePayment} disabled={processing} className="w-full mt-6 bg-[#2d3436] text-[#fefefe] font-bold py-3 rounded-[2px] hover:bg-[#636e72] transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {processing ? (
                  <>
                    <Loading size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Pay ${getTotal().toFixed(2)}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#636e72]">
                <Shield size={14} />
                <span>Secure payment powered by ZetsuMarket</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
