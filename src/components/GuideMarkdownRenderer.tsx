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
        <div className="guide-content prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:scroll-mt-24
            prose-h1:text-3xl prose-h1:mb-4 prose-h1:pb-3 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-800
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100 dark:prose-h2:border-gray-800/50
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-2
            prose-p:leading-7 prose-p:text-gray-700 dark:prose-p:text-gray-300
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-strong:text-gray-900 dark:prose-strong:text-white
            prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5
            prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-code:border prose-code:border-gray-200 dark:prose-code:border-gray-700
            prose-pre:bg-gray-950 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:border prose-pre:border-gray-800
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:italic prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-950/20 prose-blockquote:rounded-r-lg
            prose-img:rounded-lg prose-img:shadow-md
            prose-table:border-collapse prose-table:w-full prose-table:text-sm
            prose-th:bg-gray-50 dark:prose-th:bg-gray-800 prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-gray-200 dark:prose-th:border-gray-700
            prose-td:px-4 prose-td:py-2.5 prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700
            prose-tr:border-b prose-tr:border-gray-100 dark:prose-tr:border-gray-800
            prose-li:marker:text-gray-400 prose-li:leading-7
            prose-hr:border-gray-200 dark:prose-hr:border-gray-800
            [&_input[type='checkbox']]:mr-2 [&_input[type='checkbox']]:rounded [&_input[type='checkbox']]:accent-blue-600
        ">
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
