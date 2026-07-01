"use client";

import {
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Info,
  AlertTriangle,
  Zap,
  Lightbulb,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

interface GuideMarkdownRendererProps {
  content: string;
  className?: string;
}

/* ── Language display names ───────────────────────────────────────────────── */
const LANG_MAP: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  ruby: "Ruby",
  go: "Go",
  rust: "Rust",
  java: "Java",
  kt: "Kotlin",
  kotlin: "Kotlin",
  swift: "Swift",
  c: "C",
  cpp: "C++",
  "c++": "C++",
  cs: "C#",
  "c#": "C#",
  php: "PHP",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  xml: "XML",
  sql: "SQL",
  sh: "Shell",
  bash: "Bash",
  zsh: "Zsh",
  powershell: "PowerShell",
  ps1: "PowerShell",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  markdown: "Markdown",
  md: "Markdown",
  graphql: "GraphQL",
  gql: "GraphQL",
  terraform: "Terraform",
  hcl: "HCL",
  lua: "Lua",
  r: "R",
  dart: "Dart",
  ex: "Elixir",
  elixir: "Elixir",
  erlang: "Erlang",
  haskell: "Haskell",
  hs: "Haskell",
  clojure: "Clojure",
  clj: "Clojure",
  vim: "Vim",
  nginx: "Nginx",
  diff: "Diff",
  ini: "INI",
  toml: "TOML",
  makefile: "Makefile",
  cmake: "CMake",
  objectivec: "Objective-C",
  matlab: "MATLAB",
  julia: "Julia",
  scala: "Scala",
  groovy: "Groovy",
  properties: "Properties",
  env: "Env",
  text: "Text",
  plaintext: "Plain Text",
  txt: "Plain Text",
};

function getLangName(lang: string): string {
  return LANG_MAP[lang.toLowerCase()] || lang.toUpperCase();
}

/* ── Copy Button ─────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 z-10 group/copy"
      style={{
        background: copied
          ? "rgba(34, 197, 94, 0.15)"
          : "rgba(255, 255, 255, 0.07)",
        color: copied ? "#4ade80" : "rgba(255,255,255,0.5)",
        border: copied
          ? "1px solid rgba(34, 197, 94, 0.3)"
          : "1px solid rgba(255, 255, 255, 0.08)",
      }}
      aria-label={copied ? "Copied!" : "Copy code"}
    >
      {copied ? (
        <>
          <Check size={12} className="text-green-400" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy
            size={12}
            className="opacity-60 group-hover/copy:opacity-100 transition-opacity"
          />
          <span className="opacity-60 group-hover/copy:opacity-100 transition-opacity">
            Copy
          </span>
        </>
      )}
    </button>
  );
}

/* ── Code Block with header ──────────────────────────────────────────────── */
function CodeBlock({
  children,
  className,
  ...props
}: {
  children?: ReactNode;
  className?: string;
}) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = extractText(children);
  const isInline = !className;

  if (isInline) {
    return (
      <code className="guide-inline-code" {...props}>
        {children}
      </code>
    );
  }

  const lines = codeString.split("\n");
  const displayLines =
    lines.length > 1 && lines[lines.length - 1] === ""
      ? lines.slice(0, -1)
      : lines;

  return (
    <div className="guide-code-block group">
      {/* Header bar */}
      <div className="guide-code-header">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57] opacity-80" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e] opacity-80" />
            <span className="w-3 h-3 rounded-full bg-[#28c840] opacity-80" />
          </div>
          {language && (
            <span className="guide-code-lang">{getLangName(language)}</span>
          )}
        </div>
        <CopyButton text={codeString} />
      </div>
      {/* Code body */}
      <div className="guide-code-body">
        <pre className={className} {...props}>
          <code className={className} {...props}>
            {displayLines.map((line, i) => (
              <div key={i} className="guide-code-line">
                <span className="guide-code-line-number">{i + 1}</span>
                <span className="guide-code-line-content">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

/* ── Extract text from React children ─────────────────────────────────────── */
function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (!children) return "";
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (
    typeof children === "object" &&
    children !== null &&
    "props" in children
  ) {
    return extractText((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

/* ── Callout Config ──────────────────────────────────────────────────────── */
const CALLOUT_CONFIG: Record<
  string,
  {
    icon: ReactNode;
    label: string;
    borderColor: string;
    bgColor: string;
    iconColor: string;
  }
> = {
  info: {
    icon: <Info size={18} />,
    label: "Info",
    borderColor: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.06)",
    iconColor: "#3b82f6",
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    label: "Warning",
    borderColor: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.06)",
    iconColor: "#f59e0b",
  },
  danger: {
    icon: <AlertCircle size={18} />,
    label: "Danger",
    borderColor: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.06)",
    iconColor: "#ef4444",
  },
  success: {
    icon: <CheckCircle size={18} />,
    label: "Success",
    borderColor: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.06)",
    iconColor: "#10b981",
  },
  tip: {
    icon: <Lightbulb size={18} />,
    label: "Tip",
    borderColor: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.06)",
    iconColor: "#8b5cf6",
  },
  note: {
    icon: <BookOpen size={18} />,
    label: "Note",
    borderColor: "#6366f1",
    bgColor: "rgba(99, 102, 241, 0.06)",
    iconColor: "#6366f1",
  },
  important: {
    icon: <Zap size={18} />,
    label: "Important",
    borderColor: "#ec4899",
    bgColor: "rgba(236, 72, 153, 0.06)",
    iconColor: "#ec4899",
  },
};

/* ── Custom Components ───────────────────────────────────────────────────── */
const components = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="guide-heading guide-h1" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="guide-heading guide-h2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="guide-heading guide-h3" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="guide-heading guide-h4" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className="guide-heading guide-h5" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6 className="guide-heading guide-h6" {...props}>
      {children}
    </h6>
  ),

  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="guide-paragraph" {...props}>
      {children}
    </p>
  ),

  a: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        className="guide-link"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
        {isExternal && (
          <ExternalLink
            size={12}
            className="inline-block ml-0.5 opacity-50 -translate-y-0.5"
          />
        )}
      </a>
    );
  },

  blockquote: ({
    children,
    ...props
  }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => {
    const text = extractText(children).toLowerCase();
    let calloutType: string | null = null;
    for (const key of Object.keys(CALLOUT_CONFIG)) {
      if (text.startsWith(`[${key}]`) || text.startsWith(`(${key})`)) {
        calloutType = key;
        break;
      }
    }

    if (calloutType) {
      const config = CALLOUT_CONFIG[calloutType];
      let cleanChildren = children;
      if (Array.isArray(children) && children.length > 0) {
        const first = children[0] as React.ReactElement;
        if (first?.props?.children) {
          const firstText = extractText(first.props.children);
          if (
            firstText.toLowerCase().startsWith(`[${calloutType}]`) ||
            firstText.toLowerCase().startsWith(`(${calloutType})`)
          ) {
            const remainder = firstText.slice(calloutType.length + 2).trim();
            cleanChildren = [
              remainder ? <span key="r">{remainder}</span> : null,
              ...([] as ReactNode[]).concat(children.slice(1)),
            ].filter(Boolean) as ReactNode[];
          }
        }
      }
      return (
        <div
          className="guide-callout"
          style={{
            borderLeftColor: config.borderColor,
            background: config.bgColor,
          }}
        >
          <div className="guide-callout-header" style={{ color: config.iconColor }}>
            <span className="guide-callout-icon">{config.icon}</span>
            <span className="guide-callout-label">{config.label}</span>
          </div>
          <div className="guide-callout-body">{cleanChildren}</div>
        </div>
      );
    }

    return (
      <blockquote className="guide-blockquote" {...props}>
        <div className="guide-blockquote-icon">❝</div>
        {children}
      </blockquote>
    );
  },

  code: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
    const match = /language-(\w+)/.exec(className || "");
    if (match) {
      return (
        <CodeBlock className={className} {...props}>
          {children}
        </CodeBlock>
      );
    }
    return (
      <code className="guide-inline-code" {...props}>
        {children}
      </code>
    );
  },

  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => {
    return (
      <div className="guide-pre-wrapper">
        {children}
      </div>
    );
  },

  table: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="guide-table-wrapper">
      <table className="guide-table" {...props}>
        {children}
      </table>
    </div>
  ),

  thead: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="guide-thead" {...props}>
      {children}
    </thead>
  ),

  tbody: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="guide-tbody" {...props}>
      {children}
    </tbody>
  ),

  th: ({
    children,
    ...props
  }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="guide-th" {...props}>
      {children}
    </th>
  ),

  td: ({
    children,
    ...props
  }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="guide-td" {...props}>
      {children}
    </td>
  ),

  tr: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="guide-tr" {...props}>
      {children}
    </tr>
  ),

  ul: ({
    children,
    ordered,
    ...props
  }: React.HTMLAttributes<HTMLUListElement> & { ordered?: boolean }) => (
    <ul className="guide-list guide-list-unordered" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="guide-list guide-list-ordered" {...props}>
      {children}
    </ol>
  ),

  li: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLLIElement>) => {
    const text = extractText(children);
    const isTask = /^\[[ x]\]\s/.test(text);
    const isChecked = /^\[x\]\s/.test(text.toLowerCase());

    if (isTask) {
      const content = text.replace(/^\[[ x]\]\s/i, "");
      return (
        <li className="guide-list-item guide-task-item" {...props}>
          <span
            className={`guide-checkbox ${isChecked ? "guide-checkbox-checked" : ""}`}
          >
            {isChecked && <Check size={12} />}
          </span>
          <span>{content}</span>
        </li>
      );
    }

    return (
      <li className="guide-list-item" {...props}>
        {children}
      </li>
    );
  },

  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="guide-hr" {...props} />
  ),

  img: ({
    src,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <figure className="guide-figure">
      <img
        src={src}
        alt={alt || ""}
        className="guide-image"
        loading="lazy"
        decoding="async"
        {...props}
      />
      {alt && <figcaption className="guide-figcaption">{alt}</figcaption>}
    </figure>
  ),

  strong: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="guide-strong" {...props}>
      {children}
    </strong>
  ),

  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="guide-em" {...props}>
      {children}
    </em>
  ),

  del: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <del className="guide-del" {...props}>
      {children}
    </del>
  ),

  kbd: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <kbd className="guide-kbd" {...props}>
      {children}
    </kbd>
  ),

  mark: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <mark className="guide-mark" {...props}>
      {children}
    </mark>
  ),

  sup: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <sup className="guide-sup" {...props}>
      {children}
    </sup>
  ),

  sub: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <sub className="guide-sub" {...props}>
      {children}
    </sub>
  ),

  details: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDetailsElement>) => (
    <details className="guide-details" {...props}>
      {children}
    </details>
  ),

  summary: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => (
    <summary className="guide-summary" {...props}>
      <ChevronRight size={16} className="guide-summary-icon" />
      {children}
    </summary>
  ),

  input: ({
    checked,
    disabled,
    ...rest
  }: React.InputHTMLAttributes<HTMLInputElement>) => {
    if (rest.type === "checkbox") {
      return (
        <span
          className={`guide-checkbox guide-checkbox-standalone ${checked ? "guide-checkbox-checked" : ""}`}
        >
          {checked && <Check size={12} />}
        </span>
      );
    }
    return <input checked={checked} disabled={disabled} {...rest} />;
  },
};

/* ── Main Component ──────────────────────────────────────────────────────── */
const GuideMarkdownRenderer = ({
  content,
  className = "",
}: GuideMarkdownRendererProps) => {
  return (
    <div className={`guide-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true }], rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default GuideMarkdownRenderer;
