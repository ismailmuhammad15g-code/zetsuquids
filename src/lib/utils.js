import { clsx } from "clsx";
import DOMPurify from "dompurify";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function sanitizeContent(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    // allow safe embed-related + lightweight HTML used by editor tools
    ADD_TAGS: [
      "iframe",
      "mark",
      "figure",
      "figcaption",
      "kbd",
      "details",
      "summary",
      "nav",
      "section",
      "sup",
      "time",
      "aside",
      "svg",
    ],
    // preserve attributes commonly used by embeds, anchors, and accessibility
    ADD_ATTR: [
      "style",
      "class",
      "target",
      "rel",
      "allow",
      "allowfullscreen",
      "frameborder",
      "loading",
      "referrerpolicy",
      "width",
      "height",
      "src",
      "id",
      "aria-label",
      "aria-hidden",
      "role",
      "data-*",
      "title",
    ],
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

// Helper: lazy import with retry for transient dev-server/import failures
export function lazyWithRetry(factory, retries = 2, delayMs = 250) {
  return React.lazy(
    () =>
      new Promise((resolve, reject) => {
        const attempt = (n) => {
          factory()
            .then(resolve)
            .catch((err) => {
              if (n <= 0) return reject(err);
              setTimeout(() => attempt(n - 1), delayMs);
            });
        };
        attempt(retries);
      }),
  );
}
