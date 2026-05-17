'use client';
import { X, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
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
  const { items, isOpen, setIsOpen, removeFromCart, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login to purchase scripts');
      window.location.href = '/auth';
      return;
    }

    if (items.length === 0) return;

    // Redirect to checkout page
    setIsOpen(false);
    window.location.href = '/scripts/checkout?cart=true';
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart size={24} className="text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
            <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Browse the marketplace to add scripts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {isValidImageUrl(item.thumbnail_url) ? (
                      <img
                        src={item.thumbnail_url!}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingCart size={24} className="text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
                    <p className="text-sm text-gray-500">by {item.author_name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded">
                      {item.license_type || 'regular'} License
                    </span>
                    <p className="text-lg font-bold text-indigo-600 mt-1">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-2xl font-extrabold text-gray-900">${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Checkout <ArrowRight size={18} />
            </button>
            <button
              onClick={clearCart}
              className="w-full mt-2 text-gray-500 font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
