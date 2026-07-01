'use client';
import { X, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('data:')) {
    return /^data:image\/[a-z]+;base64,[A-Za-z0-9+/=]{100,}$/.test(url);
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, setIsOpen, removeFromCart, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login to purchase scripts');
      router.push('/auth');
      return;
    }

    if (items.length === 0) return;

    setIsOpen(false);
    router.push('/scripts/checkout?cart=true');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#2d3436]/30 backdrop-blur-sm z-[9998] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#fefefe] shadow-[0px_0px_0px_1px_rgba(200,182,166,0.3)] z-[9999] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#c8b6a6]/20">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-[#2d3436]" />
            <h2 className="font-heading text-lg font-semibold text-[#2d3436]">Your Cart</h2>
            <span className="bg-[#f8f6f4] text-[#636e72] text-xs font-medium px-2 py-0.5 rounded-[2px] border border-[#c8b6a6]/20">
              {itemCount}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[#f8f6f4] rounded-[2px] transition-colors duration-200"
          >
            <X size={18} className="text-[#636e72]" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={40} className="mx-auto text-[#c8b6a6]/30 mb-4" />
              <p className="font-heading font-medium text-[#2d3436] text-sm">Your cart is empty</p>
              <p className="text-xs text-[#636e72] mt-1">Browse the marketplace to add scripts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-[#f8f6f4] rounded-[2px] border border-[#c8b6a6]/15"
                >
                  <div className="w-14 h-14 bg-[#fefefe] rounded-[2px] overflow-hidden shrink-0 flex items-center justify-center border border-[#c8b6a6]/15">
                    {isValidImageUrl(item.thumbnail_url) ? (
                      <img
                        src={item.thumbnail_url!}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCart size={20} className="text-[#c8b6a6]/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-[#2d3436] text-sm truncate">{item.title}</h3>
                    <p className="text-[11px] text-[#636e72]">by {item.author_name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#f8f6f4] text-[#636e72] text-[10px] font-medium rounded-[2px] border border-[#c8b6a6]/20">
                      {item.license_type || 'regular'} License
                    </span>
                    <p className="font-heading font-semibold text-[#2d3436] text-sm mt-1">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-[#636e72]/40 hover:text-[#2d3436] hover:bg-[#fefefe] rounded-[2px] transition-colors duration-200 self-start"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#c8b6a6]/20 p-6 bg-[#fefefe]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#636e72] text-sm font-medium">Total</span>
              <span className="font-heading text-xl font-semibold text-[#2d3436]">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-[#2d3436] text-[#fefefe] font-medium py-3 rounded-[2px] hover:bg-[#636e72] transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
            >
              Checkout <ArrowRight size={16} />
            </button>
            <button
              onClick={clearCart}
              className="w-full mt-2 text-[#636e72] font-medium py-2 rounded-[2px] hover:bg-[#f8f6f4] transition-colors duration-200 text-xs"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
