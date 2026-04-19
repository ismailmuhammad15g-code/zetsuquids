import { clsx } from "clsx";
import DOMPurify from "dompurify";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  return twMerge(clsx(inputs));
}

export function sanitizeContent(html: string | null | undefined): string {
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

interface Guide {
  markdown?: string;
  content?: string;
  html_content?: string;
}

export function extractGuideContent(guide: Guide | null | undefined): string {
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
export function lazyWithRetry(
  factory: () => Promise<{ default: React.ComponentType<unknown> }>,
  retries: number = 2,
  delayMs: number = 250
): React.LazyExoticComponent<React.ComponentType<unknown>> {
  return React.lazy(
    () =>
      new Promise<{ default: React.ComponentType<unknown> }>((resolve, reject) => {
        const attempt = (n: number): void => {
          factory()
            .then(resolve)
            .catch((err: unknown) => {
              if (n <= 0) return reject(err);
              setTimeout(() => attempt(n - 1), delayMs);
            });
        };
        attempt(retries);
      })
  );
}
