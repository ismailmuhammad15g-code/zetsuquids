"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Eye, Copy, Moon, Sun, Check } from "lucide-react";
import { uiComponentsApi } from "../../../../lib/supabase";
import { UiComponent } from "../../../../types";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function ComponentPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [component, setComponent] = useState<UiComponent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [copied, setCopied] = useState(false);
  const [bgColor, setBgColor] = useState('#212121');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    async function loadComponent() {
      try {
        const all = await uiComponentsApi.getAll();
        const found = all.find(c => c.id === id);
        if (found) {
          setComponent(found);
          if (found.theme === 'light') {
             setBgColor('#ffffff');
             setIsDarkMode(false);
          }
        }
      } catch (e) {
         console.error(e);
      } finally {
         setIsLoading(false);
      }
    }
    if (id) loadComponent();
  }, [id]);

  if (isLoading) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
             <div className="w-12 h-12 border-4 border-[#007acc] border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
  }

  if (!component) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-gray-100">
             <h1 className="text-3xl font-bold mb-4">Element Not Found</h1>
             <p className="text-gray-500 mb-8">This element may have been deleted.</p>
             <button onClick={() => router.push('/components')} className="px-6 py-2 bg-[#1e1e1e] border border-[#2d2d2d] text-white rounded-lg hover:bg-[#252526] transition">Back to Library</button>
         </div>
      );
  }

  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: transparent; font-family: system-ui, -apple-system, sans-serif; }
          body { color: ${isDarkMode ? 'white' : 'black'}; }
          ${component.css_code}
        </style>
      </head>
      <body>
        ${component.html_code}
        <script>
          window.ENV = ${JSON.stringify(component.env_vars || {})};
          try {
            ${component.js_code}
          } catch(e) { console.error(e); }
        </script>
      </body>
    </html>
  `;

  const copyLink = () => {
     navigator.clipboard.writeText(window.location.href);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  const codeString = String((component as any)[`${activeTab}_code`] || '');

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 pb-20 font-sans selection:bg-[#007acc] selection:text-white">
       
       <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          {/* Top Bar Navigation & Stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
             <Link href="/components" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition">
                <ArrowLeft size={16} /> Go back
             </Link>
             
             <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                 <div className="flex items-center gap-2 mr-2">
                    <span className="hidden sm:inline">Element by</span>
                    {component.author_avatar ? (
                        <img src={component.author_avatar} alt="Author" className="w-6 h-6 rounded-full object-cover border border-[#2d2d2d]" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-[#1e1e1e] border border-[#2d2d2d] flex items-center justify-center text-white text-[10px] font-bold">
                            {component.author_name ? component.author_name.charAt(0).toUpperCase() : 'A'}
                        </div>
                    )}
                    <span className="text-white font-semibold">{component.author_name || 'Anonymous Maker'}</span>
                 </div>
                 
                 <div className="flex items-center gap-1.5" title="Views">
                    <Eye size={16} className="text-gray-500" />
                    <span>{component.views_count || 0}</span>
                 </div>
                 
                 <div className="flex items-center gap-1.5" title="Likes">
                    <Heart size={14} className="text-gray-500" />
                    <span>{component.likes_count || 0}</span>
                 </div>
             </div>
          </div>

          {/* Main Giant Container replacing old split view */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-[24px] overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[700px]">
             
             {/* Left Pane: Preview Viewport */}
             <div className="w-full lg:w-[45%] flex flex-col relative border-b lg:border-b-0 lg:border-r border-[#27272a]">
                 
                 {/* Preview Action Bar */}
                 <div className="h-14 flex items-center justify-end px-6 space-x-3 absolute top-0 w-full z-10">
                    <div className="flex items-center bg-[#212121]/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-[#3f3f46] text-xs font-medium text-gray-300 shadow-sm gap-3">
                       <span className="tracking-wide">{bgColor.toUpperCase()}</span>
                       <button 
                         onClick={() => {
                             setIsDarkMode(!isDarkMode);
                             setBgColor(!isDarkMode ? '#212121' : '#f4f4f5');
                         }}
                         className="hover:text-white transition-colors"
                       >
                          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                       </button>
                    </div>
                 </div>

                 {/* Iframe Viewport */}
                 <div className="flex-1 w-full h-full relative" style={{ backgroundColor: bgColor, transition: 'background-color 0.3s ease' }}>
                     <iframe
                        srcDoc={iframeSrcDoc}
                        title={component.title}
                        sandbox="allow-scripts allow-modals allow-same-origin"
                        className="w-full h-full border-none absolute inset-0"
                     />
                 </div>
             </div>

             {/* Right Pane: Code Editor */}
             <div className="w-full lg:w-[55%] flex flex-col bg-[#09090b]">
                 
                 {/* Code Tabs Header */}
                 <div className="h-16 flex items-center justify-between px-2 sm:px-6 bg-[#09090b] border-b border-[#27272a] overflow-x-auto">
                    
                    <div className="flex items-center gap-2">
                       <button
                          onClick={() => setActiveTab('html')}
                          className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (activeTab === 'html' ? "bg-[#1f1f22] text-[#f16529]" : "text-gray-500 hover:text-gray-300 hover:bg-[#18181b]")}
                       >
                          <div className="font-black text-lg">5</div>
                          HTML
                       </button>
                       <button
                          onClick={() => setActiveTab('css')}
                          className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (activeTab === 'css' ? "bg-[#1f1f22] text-[#2965f1]" : "text-gray-500 hover:text-gray-300 hover:bg-[#18181b]")}
                       >
                          <div className="font-black text-lg select-none text-[#2965f1]">3</div>
                          CSS
                       </button>
                       <button
                          onClick={() => setActiveTab('js')}
                          className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all " + (activeTab === 'js' ? "bg-[#1f1f22] text-[#f0db4f]" : "text-gray-500 hover:text-gray-300 hover:bg-[#18181b]")}
                       >
                          <div className="font-black text-lg select-none text-[#f0db4f]">JS</div>
                          JS
                       </button>
                    </div>

                    <div className="flex items-center gap-3">
                       <button 
                         className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#4f46e5]/10 text-[#818cf8] hover:bg-[#4f46e5]/20 border border-[#4f46e5]/20 rounded-full font-semibold text-xs transition"
                       >
                         <Heart size={14} /> Like
                       </button>
                       <button 
                         onClick={() => {
                             navigator.clipboard.writeText(codeString);
                             setCopied(true);
                             setTimeout(() => setCopied(false), 2000);
                         }}
                         className="flex items-center justify-center p-2 rounded-lg bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-gray-400 hover:text-white transition"
                         title="Copy Code"
                       >
                         {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                       </button>
                    </div>
                 </div>

                 {/* Monaco Editor Container */}
                 <div className="flex-1 relative bg-[#09090b] p-4 min-h-[500px]">
                    <Editor
                       height="100%"
                       theme="vs-dark"
                       language={activeTab === 'js' ? 'javascript' : activeTab}
                       value={codeString}
                       options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 15,
                          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                          wordWrap: 'on',
                          scrollBeyondLastLine: false,
                          smoothScrolling: true,
                          padding: { top: 16 },
                          lineHeight: 24,
                       }}
                    />
                 </div>
             </div>
          </div>
          
       </div>
    </div>
  );
}
