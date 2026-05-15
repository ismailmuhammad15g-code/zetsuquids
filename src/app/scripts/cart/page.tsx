'use client';
import Link from 'next/link';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export default function CartPage() {
  return (
    <div className="min-h-[70vh] bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center max-w-lg w-full">
        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={48} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven't added any scripts or templates to your cart yet.</p>
        
        <Link 
          href="/scripts" 
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 hover:-translate-y-1 w-full sm:w-auto"
        >
          Browse Marketplace <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
