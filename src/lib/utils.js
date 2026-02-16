import { clsx } from "clsx";
import DOMPurify from "dompurify";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function sanitizeContent(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"], // Optional: if we ever want to allow safe iframes, but for now mostly for style
    ADD_ATTR: ["style", "class", "target", "rel"],
  });
}

export function extractGuideContent(guide) {
  if (!guide) return "";

  // Prioritize markdown as it's cleaner for AI
  if (guide.markdown && guide.markdown.trim()) {
    return guide.markdown;
  }

  // Checking content field (sometimes used for markdown too)
  if (guide.content && guide.content.trim()) {
    return guide.content;
  }

  // Fallback to HTML content (stripping tags might be better but raw HTML provides structure)
  if (guide.html_content && guide.html_content.trim()) {
    // For now, returning raw HTML is okay for LLMs
    return guide.html_content;
  }

  return "";
}
