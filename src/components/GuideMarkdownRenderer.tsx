"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

interface GuideMarkdownRendererProps {
    content: string;
}

/**
 * Memoized Markdown renderer - only re-renders when content actually changes.
 * Uses remark-gfm for GitHub Flavored Markdown (tables, task lists, strikethrough, autolinks).
 * Uses rehype-slug for heading IDs (required for TOC scroll-spy).
 */
const GuideMarkdownRenderer = memo(function GuideMarkdownRenderer({
    content,
}: GuideMarkdownRendererProps) {
    return (
        <div className="guide-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true }], rehypeSlug]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

export default GuideMarkdownRenderer;
