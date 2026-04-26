"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Search, Layers, TrendingUp, Clock } from "lucide-react";
import UiComponentCard from "../../../components/UiComponentCard";
import { UiComponent } from "../../../types";
import { uiComponentsApi } from "../../../lib/supabase";

export default function ComponentsExplorePage() {
  const [components, setComponents] = useState<UiComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchComponents() {
      try {
        const data = await uiComponentsApi.getAll();
        setComponents(data);
      } catch (e) {
        console.error("Failed to fetch components:", e);
      } finally {
         setIsLoading(false);
      }
    }
    fetchComponents();
  }, []);

  const filteredComponents = components.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 pb-20">
      {/* Hero Section */}
      <div className="relative pt-12 pb-16 px-6 sm:px-12 lg:px-24 border-b border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Background gradient decorative */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-600/10 blur-[100px] rounded-full -translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
               <Layers size={16} /> Open Source UI Library
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
               Open-Source <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">UI Elements</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10">
               Community-made UI elements crafted with HTML, CSS, and JS. Free to use, open source, and ready to drop into your projects.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center w-full max-w-2xl gap-4">
               <div className="relative w-full flex-grow">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Search buttons, cards, forms..." 
                   className="w-full h-12 pl-12 pr-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                 />
               </div>
               <Link href="/components/create" className="w-full sm:w-auto h-12 px-6 flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:scale-105 transition-transform whitespace-nowrap shadow-lg shadow-black/10 dark:shadow-white/10">
                  <PlusCircle size={20} /> Create Element
               </Link>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 mt-12">
         {/* Filters bar */}
         <div className="flex items-center gap-4 mb-8">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-sm">
               <TrendingUp size={16} /> Trending
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-sm">
               <Clock size={16} /> Newest
            </button>
         </div>

         {/* Grid */}
         {isLoading ? (
            <div className="flex justify-center p-20">
               <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
         ) : filteredComponents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredComponents.map(component => (
                    <UiComponentCard key={component.id} component={component} />
                ))}
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
               <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <Search size={32} />
               </div>
               <h3 className="text-xl font-bold mb-2">No components found</h3>
               <p className="text-gray-500 dark:text-gray-400 max-w-md">
                 We couldn't find anything matching "{searchQuery}". Try a different search term or create one yourself!
               </p>
               {searchQuery && (
                   <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-500 font-medium hover:underline">
                      Clear Search
                   </button>
               )}
            </div>
         )}
      </div>
    </div>
  );
}
