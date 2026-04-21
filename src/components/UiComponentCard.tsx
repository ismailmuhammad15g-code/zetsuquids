"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UiComponent } from "../types";
import { Heart, Eye, Code } from "lucide-react";

interface Props {
  component: UiComponent;
}

export default function UiComponentCard({ component }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'css' | 'js'>('preview');

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
         {activeTab === 'preview' ? (
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
                 <Heart size={14} className="hover:text-red-500 cursor-pointer transition-colors" /> {component.likes_count || 0}
                 <span className="ml-1 mr-1">&middot;</span>
                 <Eye size={14} /> {component.views_count || 0}
            </div>
        </div>
        <div className="flex items-center space-x-2">
            {component.author_avatar ? (
                <img src={component.author_avatar} alt={component.author_name || 'Author'} className="w-5 h-5 rounded-full object-cover" />
            ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                    {component.author_name ? component.author_name.charAt(0).toUpperCase() : 'A'}
                </div>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {component.author_name || 'Anonymous'}
            </span>
        </div>
      </div>

    </div>
  );
}
