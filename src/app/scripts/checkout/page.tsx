'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CreditCard, Building2, Loader2, Check, Shield, Lock, ShoppingCart
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ScriptDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string | null;
  author_name: string;
  category: string;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
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

  // Card form state
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
        // Cart checkout - no single script to fetch
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
    return script?.price || 0;
  };

  const getItemCount = () => {
    if (isCartCheckout) {
      return cartItems.length;
    }
    return 1;
  };

  const handlePayment = async () => {
    if (!user) return;

    // Basic card validation
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardName || !expiry || !cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    }

    setProcessing(true);
    try {
      if (isCartCheckout) {
        // Save count and total before clearing cart
        const count = cartItems.length;
        const total = cartItems.reduce((sum, item) => sum + item.price, 0);

        // Process cart items
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
              status: 'completed'
            });
          }
        }

        setPurchasedCount(count);
        setPurchasedTotal(total);
        clearCart();
      } else {
        // Process single script
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

        const { error } = await supabase.from('marketplace_purchases').insert({
          script_id: script.id,
          buyer_id: user.id,
          amount: script.price,
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

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-500 mb-6">
            {isCartCheckout
              ? `You have successfully purchased ${purchasedCount} item${purchasedCount !== 1 ? 's' : ''} for $${purchasedTotal.toFixed(2)}.`
              : `You now own "${script?.title}".`
            }
          </p>
          <div className="space-y-3">
            <Link
              href="/scripts/dashboard"
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              View My Purchases
            </Link>
            <Link
              href="/scripts"
              className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/scripts" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Marketplace</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'card', label: 'Credit Card', icon: CreditCard },
                  { id: 'bank', label: 'Bank Transfer', icon: Building2 },
                  { id: 'paypal', label: 'PayPal', icon: Shield },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-colors ${
                      paymentMethod === method.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <method.icon size={24} className={paymentMethod === method.id ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Details Form */}
            {paymentMethod === 'card' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Card Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        maxLength={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Bank Transfer</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-600"><span className="font-medium">Bank:</span> Example Bank</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Account Name:</span> ZetsuMarket Ltd</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Account Number:</span> 1234567890</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Routing Number:</span> 021000021</p>
                </div>
                <p className="text-xs text-gray-500 mt-3">Please include your order reference in the transfer description.</p>
              </div>
            )}

            {/* PayPal Details */}
            {paymentMethod === 'paypal' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">PayPal</h2>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Shield size={48} className="mx-auto text-blue-500 mb-3" />
                  <p className="text-gray-600">You will be redirected to PayPal to complete your payment.</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              {isCartCheckout ? (
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ShoppingCart size={16} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500">by {item.author_name}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">${item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : script ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ShoppingCart size={20} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{script.title}</p>
                    <p className="text-sm text-gray-500">by {script.author_name}</p>
                    <p className="text-xs text-gray-400">{script.category}</p>
                  </div>
                </div>
              ) : null}

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({getItemCount()} item{getItemCount() > 1 ? 's' : ''})</span>
                  <span className="font-medium">${getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Processing Fee</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold text-indigo-600">${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {processing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Pay ${getTotal().toFixed(2)}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
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
