// Type definitions for LiveThinkingDisplay

interface LiveThinkingDisplayProps {
  // Add prop types here
}


import { AnimatePresence, motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

/**
 * Component لعرض التفكير المباشر والرد النهائي
 * ✨ يستخدم Framer Motion لانتقالات سلسة
 *
 * @param {Object} props
 * @param {boolean} props.isThinking - هل تجري عملية التفكير؟
 * @param {string} props.thinkingText - نص التفكير
 * @param {string} props.finalResponseText - الرد النهائي
 */
export const LiveThinkingDisplay = ({
    isThinking = false,
    thinkingText = '',
    finalResponseText = '',
}) => {
    // Markdown config for final response
    const markdownComponents = {
        code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : 'text';

            return inline ? (
                <code
                    className="bg-gray-800 text-gray-100 px-2 py-1 rounded text-sm font-mono"
                    {...props}
                >
                    {children}
                </code>
            ) : (
                <SyntaxHighlighter
                    language={lang}
                    style={vscDarkPlus}
                    className="rounded-lg my-2"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            );
        },
        a: ({ href, children, ...props }) => (
            <a
                href={href}
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
            >
                {children}
            </a>
        ),
        p: ({ children }) => <p className="mb-2">{children}</p>,
        ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 ml-2">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 ml-2">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-2">
                {children}
            </blockquote>
        ),
        table: ({ children }) => (
            <table className="border-collapse border border-gray-300 my-2">
                {children}
            </table>
        ),
        tr: ({ children }) => (
            <tr className="border border-gray-300">{children}</tr>
        ),
        td: ({ children }) => (
            <td className="border border-gray-300 px-2 py-1">{children}</td>
        ),
        th: ({ children }) => (
            <th className="border border-gray-300 px-2 py-1 bg-gray-100">{children}</th>
        ),
    };

    return (
        <div className="space-y-4">
            {/* 🧠 عرض التفكير أثناء البث */}
            <AnimatePresence>
                {isThinking && (
                    <motion.div
                        key="thinking-display"
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 overflow-hidden"
                    >
                        <div className="flex items-start gap-3">
                            {/* Spinner Icon */}
                            <div className="flex-shrink-0 mt-1">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                >
                                    <Loader className="w-5 h-5 text-blue-500" />
                                </motion.div>
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-blue-700 mb-2">
                                    🧠 جاري التفكير...
                                </p>

                                {thinkingText && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto"
                                    >
                                        {thinkingText}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ✅ عرض الرد النهائي */}
            <AnimatePresence>
                {finalResponseText && !isThinking && (
                    <motion.div
                        key="final-response"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="prose prose-sm max-w-none text-gray-900"
                    >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {finalResponseText}
                        </ReactMarkdown>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📝 عرض الرد أثناء التفكير (اختياري - في الخلفية) */}
            {isThinking && finalResponseText && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 0.3 }}
                    className="prose prose-sm max-w-none text-gray-500 pointer-events-none"
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                    >
                        {finalResponseText}
                    </ReactMarkdown>
                </motion.div>
            )}
        </div>
    );
};

export default LiveThinkingDisplay;

