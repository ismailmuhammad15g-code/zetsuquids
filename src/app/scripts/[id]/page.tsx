'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Star, ShoppingCart, Check, Shield, Monitor, 
  FileCode, Clock, ChevronRight, LayoutTemplate,
  MessageSquare, Heart
} from 'lucide-react';

// Reusing same mock data for simplicity, in a real app this would be fetched from DB
const mockScripts = {
  '1': {
    id: '1',
    title: 'Ultimate React Admin Dashboard',
    description: 'A fully responsive, modern admin dashboard built with React, Tailwind CSS, and Recharts. Includes 50+ pages.',
    longDescription: `This is the most comprehensive React admin dashboard template available. Built entirely with React functional components and hooks, utilizing the power of Tailwind CSS for styling. \n\nFeatures include:\n- 50+ pre-built pages\n- Dark/Light mode support\n- Fully responsive layout\n- Recharts integration\n- Redux state management\n- Formik & Yup validation`,
    price: 24.00,
    author: 'ZetsuStudios',
    sales: 1240,
    rating: 4.8,
    reviews: 320,
    category: 'React',
    updatedAt: 'May 10, 2026',
    version: '2.1.0',
    tags: ['React', 'Dashboard', 'Admin', 'Tailwind', 'UI Kit'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    features: ['Responsive', 'Well Documented', 'High Resolution', 'Retina Ready'],
  }
};

export default function ScriptDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const script = mockScripts[id as keyof typeof mockScripts] || mockScripts['1'];

  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-sm text-gray-500">
          <Link href="/scripts" className="hover:text-indigo-600 transition-colors">Home</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href={`/scripts?category=${script.category.toLowerCase()}`} className="hover:text-indigo-600 transition-colors">{script.category}</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-gray-900 font-medium truncate">{script.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Info */}
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{script.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  By <Link href="#" className="font-bold text-indigo-600 hover:underline">{script.author}</Link>
                </span>
                <span className="flex items-center gap-1">
                  <Star size={16} className="fill-amber-500 text-amber-500" /> 
                  <span className="font-bold text-gray-900">{script.rating}</span> 
                  ({script.reviews} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingCart size={16} /> 
                  {script.sales} Sales
                </span>
              </div>
            </div>

            {/* Preview Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
              <img src={script.image} alt={script.title} className="w-full h-auto object-cover max-h-[500px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-8 opacity-0 hover:opacity-100 transition-opacity">
                <button className="bg-white text-gray-900 font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-gray-50 flex items-center gap-2 transform transition-transform hover:scale-105">
                  <Monitor size={18} />
                  Live Preview
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {['details', 'reviews', 'comments', 'support'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 font-semibold text-sm capitalize whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              <div className="p-6 md:p-8">
                {activeTab === 'details' && (
                  <div className="prose max-w-none text-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">About this Script</h3>
                    <p className="whitespace-pre-line">{script.longDescription}</p>
                    
                    <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Key Features</h3>
                    <ul className="space-y-2">
                      {script.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check size={18} className="text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeTab !== 'details' && (
                  <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                    <MessageSquare size={48} className="text-gray-300 mb-4" />
                    <p>Content for {activeTab} will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Checkout */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Purchase Box */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
              <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">${script.price.toFixed(2)}</span>
                <span className="text-gray-500 mb-1">/ Regular License</span>
              </div>
              
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <span>Quality checked by ZetsuMarket</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <span>Future updates included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <span>6 months support from {script.author}</span>
                </li>
              </ul>

              <button className="w-full bg-indigo-600 text-white font-bold text-lg py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mb-3">
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              
              <button className="w-full bg-white text-gray-700 border border-gray-300 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Heart size={20} className="text-gray-400" />
                Add to Favorites
              </button>
              
              <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Shield size={14} /> Secure transaction via Stripe
              </p>
            </div>

            {/* Script Info Box */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Item Information</h4>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2"><Clock size={16}/> Last Update</span>
                  <span className="font-medium text-gray-900">{script.updatedAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2"><FileCode size={16}/> Version</span>
                  <span className="font-medium text-gray-900">{script.version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2"><LayoutTemplate size={16}/> Category</span>
                  <span className="font-medium text-indigo-600">{script.category}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-gray-500 block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {script.tags.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
}
