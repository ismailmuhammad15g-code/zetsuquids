import { Check, Copy, FileCode, Terminal } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

// Language icons and names mapping
const languageConfig = {
    javascript: { name: 'JavaScript', color: '#f7df1e' },
    js: { name: 'JavaScript', color: '#f7df1e' },
    typescript: { name: 'TypeScript', color: '#3178c6' },
    ts: { name: 'TypeScript', color: '#3178c6' },
    jsx: { name: 'React JSX', color: '#61dafb' },
    tsx: { name: 'React TSX', color: '#61dafb' },
    python: { name: 'Python', color: '#3776ab' },
    py: { name: 'Python', color: '#3776ab' },
    html: { name: 'HTML', color: '#e34f26' },
    css: { name: 'CSS', color: '#1572b6' },
    scss: { name: 'SCSS', color: '#c6538c' },
    json: { name: 'JSON', color: '#292929' },
    bash: { name: 'Terminal', color: '#4eaa25' },
    sh: { name: 'Shell', color: '#4eaa25' },
    shell: { name: 'Shell', color: '#4eaa25' },
    sql: { name: 'SQL', color: '#e38c00' },
    java: { name: 'Java', color: '#007396' },
    cpp: { name: 'C++', color: '#00599c' },
    c: { name: 'C', color: '#a8b9cc' },
    csharp: { name: 'C#', color: '#239120' },
    cs: { name: 'C#', color: '#239120' },
    php: { name: 'PHP', color: '#777bb4' },
    ruby: { name: 'Ruby', color: '#cc342d' },
    go: { name: 'Go', color: '#00add8' },
    rust: { name: 'Rust', color: '#dea584' },
    swift: { name: 'Swift', color: '#f05138' },
    kotlin: { name: 'Kotlin', color: '#7f52ff' },
    yaml: { name: 'YAML', color: '#cb171e' },
    yml: { name: 'YAML', color: '#cb171e' },
    markdown: { name: 'Markdown', color: '#083fa1' },
    md: { name: 'Markdown', color: '#083fa1' },
    dockerfile: { name: 'Dockerfile', color: '#2496ed' },
    xml: { name: 'XML', color: '#e37933' },
    graphql: { name: 'GraphQL', color: '#e535ab' },
};

export const CodeBlock = ({
    code,
    language = "javascript",
    filename,
    highlightLines = [],
    className,
}) => {
    const [copied, setCopied] = useState(false);
    const langLower = language.toLowerCase();
    const langInfo = languageConfig[langLower] || { name: language, color: '#6b7280' };
    const isTerminal = ['bash', 'sh', 'shell', 'terminal'].includes(langLower);

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Enhanced syntax highlighting
    const highlightSyntax = (line) => {
        // Escape HTML first
        let escaped = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return escaped
            // Comments
            .replace(/(\/\/.*$)/gm, '<span class="token-comment">$1</span>')
            .replace(/(\/\*[\s\S]*?\*\/)/gm, '<span class="token-comment">$1</span>')
            .replace(/(#.*$)/gm, '<span class="token-comment">$1</span>')
            // Strings - handle different quote types
            .replace(/(&quot;|"|')([^"']*?)(\1)/g, '<span class="token-string">$1$2$3</span>')
            .replace(/`([^`]*)`/g, '<span class="token-string">`$1`</span>')
            // Keywords
            .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|this|typeof|instanceof|null|undefined|true|false|extends|implements|interface|type|enum|public|private|protected|static|readonly|abstract|yield|break|continue|switch|case|void|delete|in|of)\b/g, '<span class="token-keyword">$1</span>')
            // Built-in functions/methods
            .replace(/\b(console|window|document|Array|Object|String|Number|Boolean|Promise|Map|Set|Date|Math|JSON|Error|RegExp|parseInt|parseFloat|setTimeout|setInterval|fetch|require)\b/g, '<span class="token-builtin">$1</span>')
            // Function calls
            .replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="token-function">$1</span>(')
            // Numbers
            .replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>')
            // JSX/HTML tags
            .replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, '<span class="token-tag">$1</span>')
            // Properties/attributes
            .replace(/\b([a-zA-Z_]\w*)\s*:/g, '<span class="token-property">$1</span>:')
            // Operators
            .replace(/([=!<>+\-*/%&|^~?:]+)/g, '<span class="token-operator">$1</span>');
    };

    const lines = code.split('\n');

    return (
        <div className={cn("code-block-container", className)} dir="ltr">
            {/* Header - Modern Dark Design */}
            <div className="code-block-header">
                <div className="code-block-header-left">
                    {isTerminal ? (
                        <Terminal size={14} className="code-block-icon" />
                    ) : (
                        <FileCode size={14} className="code-block-icon" />
                    )}
                    <span className="code-block-language" style={{ color: langInfo.color }}>
                        {filename || langInfo.name}
                    </span>
                </div>
                <button
                    onClick={copyToClipboard}
                    className="code-block-copy-btn"
                    aria-label="Copy code"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code Content - Clean Professional Design */}
            <div className="code-block-content">
                <pre className="code-block-pre">
                    <code className="code-block-code">
                        {lines.map((line, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "code-block-line",
                                    highlightLines.includes(idx + 1) && "code-block-line-highlighted"
                                )}
                            >
                                <span className="code-block-line-number">
                                    {idx + 1}
                                </span>
                                <span
                                    className="code-block-line-content"
                                    dangerouslySetInnerHTML={{ __html: highlightSyntax(line) || '&nbsp;' }}
                                />
                            </div>
                        ))}
                    </code>
                </pre>
            </div>

            <style>{`
                .code-block-container {
                    border-radius: 12px;
                    overflow: hidden;
                    background: #0d1117;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    margin: 16px 0;
                    font-family: 'SF Mono', 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
                }

                .code-block-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.03);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .code-block-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .code-block-icon {
                    color: rgba(255, 255, 255, 0.5);
                }

                .code-block-language {
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .code-block-copy-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .code-block-copy-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .code-block-content {
                    overflow-x: auto;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
                }

                .code-block-content::-webkit-scrollbar {
                    height: 6px;
                }

                .code-block-content::-webkit-scrollbar-track {
                    background: transparent;
                }

                .code-block-content::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }

                .code-block-pre {
                    margin: 0;
                    padding: 16px 0;
                    background: transparent;
                }

                .code-block-code {
                    display: block;
                    font-size: 13px;
                    line-height: 1.6;
                    tab-size: 4;
                }

                .code-block-line {
                    display: flex;
                    padding: 0 16px;
                    min-height: 22px;
                }

                .code-block-line:hover {
                    background: rgba(255, 255, 255, 0.03);
                }

                .code-block-line-highlighted {
                    background: rgba(59, 130, 246, 0.15) !important;
                    border-left: 3px solid #3b82f6;
                    padding-left: 13px;
                }

                .code-block-line-number {
                    display: inline-block;
                    width: 40px;
                    min-width: 40px;
                    padding-right: 16px;
                    text-align: right;
                    color: rgba(255, 255, 255, 0.3);
                    user-select: none;
                    font-size: 12px;
                }

                .code-block-line-content {
                    flex: 1;
                    color: #e6edf3;
                    white-space: pre;
                }

                /* Token Colors - GitHub Dark Theme */
                .token-keyword {
                    color: #ff7b72;
                    font-weight: 500;
                }

                .token-string {
                    color: #a5d6ff;
                }

                .token-comment {
                    color: #8b949e;
                    font-style: italic;
                }

                .token-function {
                    color: #d2a8ff;
                }

                .token-builtin {
                    color: #79c0ff;
                }

                .token-number {
                    color: #79c0ff;
                }

                .token-tag {
                    color: #7ee787;
                }

                .token-property {
                    color: #79c0ff;
                }

                .token-operator {
                    color: #ff7b72;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .code-block-container {
                        border-radius: 8px;
                        margin: 12px 0;
                    }

                    .code-block-header {
                        padding: 10px 12px;
                    }

                    .code-block-copy-btn span:last-child {
                        display: none;
                    }

                    .code-block-line {
                        padding: 0 12px;
                    }

                    .code-block-line-number {
                        width: 32px;
                        min-width: 32px;
                        padding-right: 12px;
                    }

                    .code-block-code {
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default CodeBlock;
