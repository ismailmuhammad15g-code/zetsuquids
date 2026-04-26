import { Check, Copy, FileCode, Terminal } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

// Language icons and names mapping
const languageConfig: Record<string, { name: string; color: string }> = {
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

interface CodeBlockProps {
    code: string;
    language?: string;
    filename?: string;
    className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
    code,
    language = "javascript",
    filename,
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

    return (
        <div className={cn("rounded-lg overflow-hidden border border-slate-200 bg-slate-950", className)}>
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    {isTerminal ? (
                        <Terminal className="w-4 h-4 text-green-400" />
                    ) : (
                        <FileCode className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium text-slate-300">{filename || langInfo.name}</span>
                </div>
                <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1 rounded text-sm hover:bg-slate-700 transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            <span className="text-slate-300">Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code */}
            <pre className="p-4 overflow-x-auto text-sm text-slate-200 bg-slate-950">
                <code>{code}</code>
            </pre>
        </div>
    );
};

export default CodeBlock;
