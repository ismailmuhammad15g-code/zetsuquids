"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/github-dark.css";

interface GuideMarkdownRendererProps {
    content: string;
}

/**
 * Memoized Markdown renderer - only re-renders when content actually changes.
 * Uses rehype-slug for heading IDs (required for TOC scroll-spy).
 */
const GuideMarkdownRenderer = memo(function GuideMarkdownRenderer({
    content,
}: GuideMarkdownRendererProps) {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:scroll-mt-24
            prose-h1:text-3xl prose-h1:mb-4
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-2
            prose-p:leading-7 prose-p:text-gray-700 dark:prose-p:text-gray-300
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 dark:prose-strong:text-white
            prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5
            prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-gray-900 prose-pre:rounded-xl prose-pre:shadow-lg
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic
            prose-img:rounded-lg prose-img:shadow-md
            prose-table:border-collapse prose-th:bg-gray-50 dark:prose-th:bg-gray-800
            prose-li:marker:text-gray-400
        ">
            <ReactMarkdown rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true }], rehypeSlug]}>
                {content}
            </ReactMarkdown>
        </div>
    );
});

export default GuideMarkdownRenderer;
