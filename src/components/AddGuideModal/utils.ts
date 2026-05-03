import { marked } from "marked";
import { sanitizeContent } from "../../lib/utils";
import { FormData } from "./types";

// Configure marked renderer for quiz support
export const quizRenderer = {
  code(code: any, language?: any): string {
    let text = code;
    let lang = language;

    if (typeof code === "object" && code !== null) {
      text = code.text || "";
      lang = code.lang || "";
    }

    text = String(text || "");

    if (lang === "quiz") {
      try {
        const jsonStr = typeof code === "object" ? code.text : code;
        const encoded = btoa(
          encodeURIComponent(jsonStr).replace(
            /%([0-9A-F]{2})/g,
            function toSolidBytes(_match: string, p1: string) {
              return String.fromCharCode(parseInt("0x" + p1, 16));
            },
          ),
        );
        return `<div class="interactive-quiz-container my-8" data-quiz="${encoded}"></div>`;
      } catch (e) {
        console.error("Quiz encoding error", e);
        return `<pre class="bg-red-50 text-red-600 p-4 rounded border border-red-200">Error rendering quiz</pre>`;
      }
    }

    if (lang === "playground") {
      try {
        const rawText = (typeof code === "object" ? (code as any).text : String(text)).trim();
        const encoded = btoa(encodeURIComponent(rawText));
        return `<div class="zetsu-playground-container my-8"><div class="playground-data" style="display:none;">${encoded}</div></div>`;
      } catch (e) {
        return `<pre class="bg-red-50 text-red-600 p-4 rounded border border-red-200">Playground error: ${String(e)}</pre>`;
      }
    }

    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    if (!lang) {
      return `<pre><code>${escapedText}</code></pre>`;
    }

    const langClass = `language-${lang}`;
    return `<pre><code class="${langClass}">${escapedText}</code></pre>`;
  },

  image(href: any, title: any, text: any) {
    let url = href;
    if (typeof href === "object" && href !== null) {
      url = href.href || "";
      title = href.title || "";
      text = href.text || "";
    }
    let alignmentStyle = "margin-left: auto; margin-right: auto; display: block;";
    if (String(url).includes("#align-left")) alignmentStyle = "display: block; margin-right: auto; margin-left: 0;";
    if (String(url).includes("#align-right")) alignmentStyle = "display: block; margin-left: auto; margin-right: 0;";
    const cleanUrl = String(url).split("#")[0];
    return `<img src="${cleanUrl}" alt="${text || ""}" title="${title || ""}" class="rounded-xl max-w-full h-auto border border-gray-200 shadow-sm" style="${alignmentStyle}" />`;
  },
};

export const forbiddenPatterns = [
  { pattern: /(<footer[^>]*>)/gi, message: "Custom <footer> tags are not allowed" },
  { pattern: /(<\/footer>)/gi, message: "Custom </footer> tags are not allowed" },
  { pattern: /(&copy;|©)/gi, message: "Copyright symbols are not allowed" },
  { pattern: /(all rights reserved)/gi, message: "'All rights reserved' phrase is not allowed" },
  { pattern: /(class="[^"]*footer[^"]*")/gi, message: "Classes containing 'footer' are not allowed" },
  { pattern: /(id="[^"]*footer[^"]*")/gi, message: "IDs containing 'footer' are not allowed" },
  { pattern: /(<script[^>]*>[\s\S]*?<\/script>)/gi, message: "Script tags are forbidden for security" },
  { pattern: /(<object[^>]*>[\s\S]*?<\/object>)/gi, message: "Object tags are forbidden" },
  { pattern: /(<embed[^>]*>)/gi, message: "Embed tags are forbidden" },
  { pattern: /(javascript:)/gi, message: "JavaScript pseudo-protocol is forbidden" },
  { pattern: /(on[a-z]+="[^"]*")/gi, message: "Event handlers (onclick, etc.) are forbidden" },
  { pattern: /\b(sex|penis|vagina|sexual|dick|porn|xxx|asshole|bitch|fuck|cock)\b/gi, message: "Inappropriate content is not allowed" },
];

export const highlightForbiddenContent = (html: string): string => {
  if (!html) return "";
  let highlighted = html;

  forbiddenPatterns.forEach(({ pattern, message }) => {
    highlighted = highlighted.replace(pattern, (match: string) => {
      const escapedMatch = match.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<span style="background-color: rgba(255, 0, 0, 0.2); outline: 2px solid red; cursor: help; color: red; font-weight: bold;" title="${message.replace(/"/g, '&quot;')}" class="forbidden-highlight">${escapedMatch}</span>`;
    });
  });

  return highlighted;
};

export const validateContent = (formData: FormData, activeTab: string): string[] => {
  const errors: string[] = [];
  const { title, keywords, content, html_content } = formData;

  if (!title?.trim()) errors.push("Title is required");
  if (!keywords?.trim()) errors.push("Keywords are required");

  const activeContent = activeTab === "markdown" ? content : html_content;
  const wordCount = activeContent?.trim().split(/\s+/).filter(Boolean).length || 0;

  if (wordCount < 30) {
    errors.push(`Content is too short (${wordCount}/30 words)`);
  }

  if (activeContent) {
    forbiddenPatterns.forEach(({ pattern, message }) => {
      if (activeContent.search(pattern) !== -1) {
        if (!errors.includes(message)) errors.push(message);
      }
    });

    if (activeContent.includes("<iframe")) {
      const iframeRegex = /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi;
      let m: RegExpExecArray | null;
      while ((m = iframeRegex.exec(activeContent)) !== null) {
        const tag = m[0];
        const srcMatch = tag.match(/src\s*=\s*["']([^"']+)["']/i);
        const src = srcMatch ? srcMatch[1] : "";
        const allowed = /(?:youtube\.com|youtu\.be|youtube-nocookie\.com|player\.vimeo\.com)/i.test(src);
        if (!src || !allowed) {
          if (!errors.includes("Only YouTube/Vimeo iframes are allowed")) {
            errors.push("Only YouTube/Vimeo iframes are allowed");
          }
          break;
        }
      }
    }
  }

  return errors;
};

export const getMarkdownHtml = (markdown: string) => {
  marked.use({ renderer: quizRenderer as any });
  marked.setOptions({
    breaks: true,
    gfm: true,
  } as any);
  
  return highlightForbiddenContent(sanitizeContent(marked.parse(markdown) as string));
};
