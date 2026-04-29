"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UiComponent } from "../types";
import { Heart, Eye, Code, Layers } from "lucide-react";
import { getAvatarForUser } from "../lib/avatar";
import { useAuth } from "../contexts/AuthContext";
import { uiComponentsApi } from "../lib/supabase";

interface Props {
  component: UiComponent;
}

export default function UiComponentCard({ component }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'css' | 'js'>('preview');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(component.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  // Check if user already liked this component
  useEffect(() => {
    if (user?.id && component.id) {
      uiComponentsApi.hasUserLiked(String(component.id), user.id).then(setLiked);
    }
  }, [user?.id, component.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return; // Must be logged in
    if (isLiking) return;

    setIsLiking(true);
    try {
      const result = await uiComponentsApi.toggleLike(String(component.id), user.id);
      setLiked(result.liked);
      setLikesCount(result.newCount);
    } catch (err) {
      console.error("Like failed:", err);
    } finally {
      setIsLiking(false);
    }
  };

  // Build the source doc that safely wraps the code
  const srcDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          /* Reset and center alignment to make it look like a nice preview */
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: transparent;
            font-family: system-ui, -apple-system, sans-serif;
          }
          ${component.theme === 'dark' ? 'body { color: white; }' : ''}
          ${component.css_code}
        </style>
      </head>
      <body>
        ${component.html_code}
        <script>
          // Run JS with error catching to avoid crashing the iframe silently
          try {
            ${component.js_code}
          } catch (e) {
            console.error("Component JS Error:", e);
          }
        </script>
      </body>
    </html>
  `;

  const isTemplate = component.component_type === 'template';

  // Resolve author avatar: prefer saved author_avatar, fallback to getAvatarForUser
  const authorAvatarUrl = component.author_avatar || getAvatarForUser(component.author_name || null);

  return (
    <div 
      onClick={() => router.push(`/components/${component.id}`)}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-500/30 cursor-pointer"
    >
      
      {/* Viewport for Component */}
      <div className="relative h-64 w-full bg-gray-50/50 dark:bg-black/20 overflow-hidden" style={{
        backgroundImage: 'radial-gradient(circle, #00000010 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}>
          {component.preview_url ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-black overflow-hidden p-4">
              <img 
                src={component.preview_url} 
                alt={component.title} 
                className="max-w-full max-h-full object-contain shadow-sm rounded transition-transform group-hover:scale-105 duration-500" 
              />
            </div>
          ) : (component.react_files && component.react_files.length > 0) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
                <Layers className="text-blue-500" size={32} />
              </div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">React Component</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">{component.description || 'No preview available'}</p>
            </div>
          ) : activeTab === 'preview' ? (
             <div className="absolute top-0 left-0 w-[200%] h-[200%] transform origin-top-left scale-50 z-0">
                 <iframe
                    ref={iframeRef}
                    srcDoc={srcDoc}
                    title={component.title}
                    sandbox="allow-scripts allow-modals"
                    className="w-full h-full border-none pointer-events-none group-hover:pointer-events-auto"
                    loading="lazy"
                    tabIndex={-1}
                 ></iframe>
             </div>
          ) : (
             <div className="absolute inset-0 p-4 z-0">
                 <div className="w-full h-full overflow-auto p-4 bg-gray-900 text-gray-100 text-sm font-mono rounded-lg">
                    <pre>
                        <code>{String(component[`${activeTab}_code` as keyof UiComponent] || '')}</code>
                    </pre>
                 </div>
             </div>
          )}

        {/* Type Badge */}
        {isTemplate && (
          <div className="absolute top-3 left-3 z-10">
            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm">
              <Layers size={10} /> Template
            </span>
          </div>
        )}

        {/* Hover overlay actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onClick={(e) => {
               e.stopPropagation();
               setActiveTab(activeTab === 'preview' ? 'html' : 'preview');
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 dark:bg-black/90 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
            title="View Code"
          >
            <Code size={16} />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col p-4 gap-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
            {component.title}
            </h3>
            <div className="flex flex-shrink-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                 <button
                   onClick={handleLike}
                   className={"flex items-center gap-1 transition-colors " + (liked ? "text-red-500" : "hover:text-red-500")}
                   title={user ? (liked ? "Unlike" : "Like") : "Login to like"}
                 >
                   <Heart size={14} className={liked ? "fill-red-500" : ""} /> {likesCount}
                 </button>
                 <span className="ml-1 mr-1">&middot;</span>
                 <Eye size={14} /> {component.views_count || 0}
            </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
              <img
                src={authorAvatarUrl}
                alt={component.author_name || 'Author'}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getAvatarForUser(null);
                }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                  {component.author_name || 'Anonymous'}
              </span>
          </div>
          {component.component_type && (
            <span className={"text-[10px] font-semibold px-1.5 py-0.5 rounded " + (isTemplate ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}>
              {isTemplate ? 'Template' : 'Component'}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
