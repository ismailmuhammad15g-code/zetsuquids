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
