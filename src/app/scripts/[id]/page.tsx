'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Star, ShoppingCart, Check, Shield, Monitor, 
  FileCode, Clock, ChevronRight, LayoutTemplate,
  MessageSquare, Heart, Loader2, Github
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export default function ScriptDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (id) {
      fetchScriptDetails();
    }
  }, [id]);

  const fetchScriptDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_scripts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setScript(data);
    } catch (error) {
      console.error('Error fetching script details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <FileCode size={64} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Script Not Found</h1>
        <p className="text-gray-500 mb-6">The script you are looking for does not exist or has been removed.</p>
        <Link href="/scripts" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const updatedAtFormatted = script.updated_at ? format(new Date(script.updated_at), 'MMM dd, yyyy') : 'Unknown';

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-sm text-gray-500">
          <Link href="/scripts" className="hover:text-indigo-600 transition-colors">Home</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href={`/scripts?category=${script.category.toLowerCase()}`} className="hover:text-indigo-600 transition-colors">{script.category}</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-gray-900 font-medium truncate max-w-xs">{script.title}</span>
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
                  By <span className="font-bold text-indigo-600">{script.author_name}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Star size={16} className={script.rating > 0 ? "fill-amber-500 text-amber-500" : "text-gray-300"} /> 
                  <span className="font-bold text-gray-900">{script.rating > 0 ? script.rating.toFixed(1) : 'New'}</span> 
                  ({script.reviews_count || 0} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingCart size={16} /> 
                  {script.sales_count} Sales
                </span>
              </div>
            </div>

            {/* Preview Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative min-h-[300px] flex items-center justify-center">
              {script.thumbnail_url ? (
                <img src={script.thumbnail_url} alt={script.title} className="w-full h-auto object-cover max-h-[500px]" />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                   <LayoutTemplate size={64} className="mb-4 opacity-50" />
                   <p>No preview image available</p>
                </div>
              )}
              {script.preview_url && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-8 opacity-0 hover:opacity-100 transition-opacity">
                  <a href={script.preview_url} target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-gray-50 flex items-center gap-2 transform transition-transform hover:scale-105">
                    <Monitor size={18} />
                    Live Preview
                  </a>
                </div>
              )}
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
                    <p className="whitespace-pre-line text-lg leading-relaxed">{script.long_description || script.description}</p>
                    
                    {script.features && script.features.length > 0 && (
                      <>
                        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Key Features</h3>
                        <ul className="space-y-3">
                          {script.features.map((feature: string, i: number) => (
                            <li key={i} className="flex items-start gap-3">
                              <Check size={20} className="text-green-500 shrink-0 mt-0.5" />
                              <span className="text-gray-700 font-medium">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {script.github_repo_url && (
                      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
                         <Github className="text-gray-700" size={24} />
                         <div>
                           <p className="text-sm font-bold text-gray-900">Stored Securely on GitHub</p>
                           <p className="text-xs text-gray-500">Upon purchase, you will receive direct access to the source code repository.</p>
                         </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab !== 'details' && (
                  <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                    <MessageSquare size={48} className="text-gray-300 mb-4" />
                    <p>No content available for {activeTab} yet.</p>
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
                <span className="text-4xl font-extrabold text-gray-900">${Number(script.price).toFixed(2)}</span>
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
                  <span>6 months support from {script.author_name}</span>
                </li>
              </ul>

              <button className="w-full bg-indigo-600 text-white font-bold text-lg py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mb-3">
                <ShoppingCart size={20} />
                Purchase Now
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
                  <span className="font-medium text-gray-900">{updatedAtFormatted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2"><FileCode size={16}/> Version</span>
                  <span className="font-medium text-gray-900">{script.version || '1.0.0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2"><LayoutTemplate size={16}/> Category</span>
                  <span className="font-medium text-indigo-600">{script.category}</span>
                </div>
                
                {script.tags && script.tags.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-gray-500 block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {script.tags.map((tag: string) => (
                        <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md border border-gray-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
