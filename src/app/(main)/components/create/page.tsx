"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Maximize2, Minimize2, Play, Settings, Upload, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { uiComponentsApi } from "../../../../lib/supabase";
import { useAuth } from "../../../../contexts/AuthContext";
import dynamic from "next/dynamic";

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function CreateComponentPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [title, setTitle] = useState("My Awesome Component");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  
  const [htmlCode, setHtmlCode] = useState('<button class="my-btn">\n  Hover me\n</button>');
  const [cssCode, setCssCode] = useState(`.my-btn {
  padding: 12px 24px;
  background: linear-gradient(45deg, #FF512F 0%, #F09819 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(240, 152, 25, 0.4);
  transition: all 0.3s ease;
}

.my-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(240, 152, 25, 0.6);
}`);
  const [jsCode, setJsCode] = useState(`const btn = document.querySelector('.my-btn');
btn.addEventListener('click', () => {
  btn.innerText = 'Clicked!';
  setTimeout(() => btn.innerText = 'Hover me', 1000);
});`);
  const [envCode, setEnvCode] = useState(`# Enter your environment variables here
# MY_API_KEY=123456789
`);

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'env'>('html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  // Debounced states
  const [debouncedHtml, setDebouncedHtml] = useState(htmlCode);
  const [debouncedCss, setDebouncedCss] = useState(cssCode);
  const [debouncedJs, setDebouncedJs] = useState(jsCode);
  const [parsedEnv, setParsedEnv] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHtml(htmlCode);
      setDebouncedCss(cssCode);
      setDebouncedJs(jsCode);
      
      // Parse ENV
      const envObj: Record<string, string> = {};
      envCode.split('\\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length > 0) {
            envObj[key.trim()] = values.join('=').trim(); // handle ='foo=bar'
          }
        }
      });
      setParsedEnv(envObj);
      
    }, 800);
    return () => clearTimeout(handler);
  }, [htmlCode, cssCode, jsCode, envCode]);

  const handleEnvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setEnvCode(prev => prev + "\\n" + ev.target!.result);
          toast.success("ENV file loaded");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your component");
      return;
    }
    
    setIsSaving(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      await uiComponentsApi.create({
        id: Date.now().toString(),
        title,
        description,
        tags: tagsArray,
        env_vars: parsedEnv,
        html_code: htmlCode,
        css_code: cssCode,
        js_code: jsCode,
        author_name: (user?.user_metadata as any)?.full_name || (user?.email ? user.email.split('@')[0] : 'Anonymous Maker'),
        author_avatar: (user?.user_metadata as any)?.avatar_url || undefined,
        author_id: user?.id,
        theme: 'light',
      });
      toast.success("Component published successfully!");
      router.push('/components');
    } catch (e) {
      console.error(e);
      toast.error("Failed to save component");
    } finally {
      setIsSaving(false);
      setShowPublishModal(false);
    }
  };

  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: transparent; font-family: system-ui, -apple-system, sans-serif; }
          ${debouncedCss}
        </style>
      </head>
      <body>
        ${debouncedHtml}
        <script>
          // Inject ENV variables safely just into the local window context
          window.ENV = ${JSON.stringify(parsedEnv)};
          try {
            ${debouncedJs}
          } catch (e) {
            console.error(e);
          }
        </script>
      </body>
    </html>
  `;

  // Helper to determine the language for Monaco
  const getLanguage = (tab: string) => {
    if (tab === 'js') return 'javascript';
    if (tab === 'env') return 'shell';
    return tab;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#1e1e1e] text-gray-100 font-sans">
      
      {/* Top Navbar for Editor */}
      <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 bg-[#252526] shrink-0">
         <div className="flex items-center gap-4">
             <Link href="/components" className="p-1.5 hover:bg-[#333] rounded transition-colors text-gray-400 hover:text-white">
                <ArrowLeft size={18} />
             </Link>
             <span className="text-sm font-semibold text-gray-300">{title}</span>
         </div>
         
         <button 
           onClick={() => setShowPublishModal(true)}
           disabled={isSaving}
           className="flex items-center gap-2 bg-[#007acc] hover:bg-[#005c99] text-white px-4 py-1.5 rounded transition-all text-sm font-medium disabled:opacity-50"
         >
           <Save size={14} /> Publish
         </button>
      </div>

      {/* Editor Main Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
         
         {/* Left Side: Code Editor */}
         <div className={"w-full lg:w-1/2 flex flex-col border-r border-[#333] bg-[#1e1e1e] " + (isFullscreen ? "hidden" : "flex")}>
            {/* Tabs */}
            <div className="flex bg-[#2d2d2d] shrink-0">
               {['html', 'css', 'js', 'env'].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={"flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-t-2 " + (activeTab === tab ? "border-[#007acc] text-white bg-[#1e1e1e]" : "border-transparent text-gray-400 hover:text-gray-200 bg-[#2d2d2d]")}
                 >
                    {tab === 'env' && <Settings size={12} />}
                    {tab}
                 </button>
               ))}
            </div>
            
            {/* Editor Container */}
            <div className="flex-1 relative bg-[#1e1e1e]">
                {activeTab === 'env' && (
                    <div className="absolute top-2 right-4 z-10 flex gap-2">
                        <label className="flex items-center gap-2 cursor-pointer bg-[#333] hover:bg-[#444] text-xs px-3 py-1.5 rounded border border-[#555] transition text-gray-300">
                           <Upload size={12} /> Upload .env
                           <input type="file" className="hidden" accept=".env, .txt" onChange={handleEnvUpload} />
                        </label>
                    </div>
                )}
                <div className="absolute inset-0 pt-2">
                    <Editor
                       height="100%"
                       theme="vs-dark"
                       language={getLanguage(activeTab)}
                       value={
                          activeTab === 'html' ? htmlCode 
                          : activeTab === 'css' ? cssCode 
                          : activeTab === 'js' ? jsCode 
                          : envCode
                       }
                       onChange={(val) => {
                          if (val === undefined) return;
                          if (activeTab === 'html') setHtmlCode(val);
                          else if (activeTab === 'css') setCssCode(val);
                          else if (activeTab === 'js') setJsCode(val);
                          else setEnvCode(val);
                       }}
                       options={{
                          minimap: { enabled: false }, // Keeping minimap disabled for cleanliness, user has VS code clone anyway
                          fontSize: 14,
                          wordWrap: 'on',
                          scrollBeyondLastLine: false,
                          smoothScrolling: true,
                          cursorBlinking: 'smooth',
                          cursorSmoothCaretAnimation: 'on',
                          formatOnPaste: true,
                       }}
                    />
                </div>
            </div>
         </div>

         {/* Right Side: Live Preview */}
         <div className={"w-full flex flex-col bg-white relative " + (isFullscreen ? "lg:w-full" : "lg:w-1/2")}>
             <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <div className="bg-[#1e1e1e] border border-[#333] flex items-center p-1 rounded-md shadow-lg backdrop-blur-sm">
                     <button
                       onClick={() => {
                          setDebouncedHtml(htmlCode);
                          setDebouncedCss(cssCode);
                          setDebouncedJs(jsCode);
                       }}
                       className="p-1.5 text-gray-400 hover:text-white rounded transition-all"
                       title="Force Rerender"
                     >
                       <Play size={16} />
                     </button>
                     <div className="w-px h-4 bg-[#444] mx-1"></div>
                     <button
                       onClick={() => setIsFullscreen(!isFullscreen)}
                       className="p-1.5 text-gray-400 hover:text-white rounded transition-all hidden lg:block"
                       title="Toggle Fullscreen"
                     >
                       {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                     </button>
                 </div>
             </div>
             
             {/* The Sandboxed IFrame */}
             <iframe
                srcDoc={iframeSrcDoc}
                title="Live Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
                className="w-full flex-1 border-none bg-transparent"
                style={{
                  backgroundImage: 'radial-gradient(circle, #00000008 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
             />
         </div>

      </div>

      {/* Publish Modal */}
      {showPublishModal && (
         <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] border border-[#333] w-full max-w-lg rounded-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-xl font-bold text-white">Publish Component</h2>
                   <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-white">
                      <X size={20} />
                   </button>
                </div>
                
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                      <input 
                         type="text" 
                         value={title}
                         onChange={e => setTitle(e.target.value)}
                         className="w-full bg-[#2d2d2d] border border-[#444] rounded p-2.5 text-white focus:outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]"
                         placeholder="e.g., Neon Liquid Button"
                      />
                   </div>
                   
                   <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description <span className="text-xs text-gray-500">(Optional)</span></label>
                      <textarea 
                         value={description}
                         onChange={e => setDescription(e.target.value)}
                         className="w-full bg-[#2d2d2d] border border-[#444] rounded p-2.5 text-white focus:outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc] h-24 resize-none"
                         placeholder="What does this component do?"
                      />
                   </div>
                   
                   <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma-separated)</label>
                      <input 
                         type="text" 
                         value={tags}
                         onChange={e => setTags(e.target.value)}
                         className="w-full bg-[#2d2d2d] border border-[#444] rounded p-2.5 text-white focus:outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]"
                         placeholder="button, neon, hover, 3d"
                      />
                   </div>
                   
                   <p className="text-xs text-yellow-500/80 mt-2 italic">
                       * Environment variables added in the ENV tab are saved securely and will not be displayed in the public code viewer.
                   </p>
                </div>
                
                <div className="mt-8 flex justify-end gap-3.5">
                   <button 
                      onClick={() => setShowPublishModal(false)}
                      className="px-4 py-2 rounded text-gray-300 hover:bg-[#333] transition"
                   >
                     Cancel
                   </button>
                   <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-2 w-32 bg-[#007acc] hover:bg-[#005c99] text-white px-4 py-2 rounded transition font-medium disabled:opacity-50"
                   >
                     {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Publish Now'}
                   </button>
                </div>
            </div>
         </div>
      )}

    </div>
  );
}
