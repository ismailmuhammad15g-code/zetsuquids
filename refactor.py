import re

with open('d:/new/zetsuquids/src/app/(main)/guide/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove marked and Balloons imports
code = re.sub(r'import \{ marked \} from "marked";\n?', '', code)
code = re.sub(r'import \{ Balloons \} from "../../../../components/ui/balloons";\n?', '', code)

# Add new imports
new_imports = """import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";
import Link from "next/link";"""
code = re.sub(r'import Link from "next/link";', new_imports, code)

# 2. Remove marked setup
code = re.sub(r'// Configure marked[\s\S]*?marked\.setOptions\(\{[\s\S]*?\}\s*as\s*any\);\n?', '', code)

# 3. Modify renderContentWithComments to use ReactMarkdown
code = re.sub(
    r'function renderContentWithComments\(\): JSX\.Element \| null \{[\s\S]*?return \(\n\s*<div\n\s*ref=\{contentRef\}\n\s*className="prose md:prose-lg[\s\S]*?dangerouslySetInnerHTML=\{\{ __html: html \}\}\n\s*/>\n\s*\);\n\s*\}',
    """function renderContentWithComments(): JSX.Element | null {
        if (!processedContent) return null;

        if (processedContent.type === "html") {
            return (
                <iframe
                    srcDoc={processedContent.content}
                    className="w-full min-h-[700px] border-2 border-black bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                    title={guide?.title || "Guide Document"}
                    style={{ display: "block" }}
                />
            );
        }

        let html = contentWithAnchors || processedContent.content;

        inlineComments.forEach((comment: any) => {
            if (!comment.selected_text) return;
            const escaped = comment.selected_text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
            const regex = new RegExp(`(${escaped})`, 'gi');

            let isApproved = false;
            try {
                if (comment.position_json) {
                    const pos = typeof comment.position_json === 'string' ? JSON.parse(comment.position_json) : comment.position_json;
                    isApproved = !!pos.approved;
                }
            } catch (e) { }

            const bgClass = isApproved ? 'bg-blue-200/60 hover:bg-blue-300/80' : 'bg-yellow-200/60 hover:bg-yellow-300/80';
            const commentHtml = `<span id="comment-ghost-${comment.id}" class="relative ${bgClass} rounded px-0.5 cursor-pointer transition-colors inline" data-comment-id="${comment.id}">$1</span>`;
            html = html.replace(regex, commentHtml);
        });

        return (
            <div ref={contentRef} className="prose md:prose-xl max-w-none prose-headings:font-black prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white dark:prose-invert dark:prose-a:text-blue-400 dark:prose-code:bg-gray-800 dark:prose-pre:bg-gray-800 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
                <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>{html}</ReactMarkdown>
            </div>
        );
    }""",
    code
)

# 4. Modify renderContent to use ReactMarkdown
code = re.sub(
    r'function renderContent\(\): JSX\.Element \| null \{[\s\S]*?return \(\n\s*<div\n\s*ref=\{contentRef\}\n\s*className="prose md:prose-lg[\s\S]*?dangerouslySetInnerHTML=\{\{ __html: contentWithAnchors \|\| processedContent\.content \}\}\n\s*/>\n\s*\);\n\s*\}',
    """function renderContent(): JSX.Element | null {
        if (!processedContent) return null;

        if (processedContent.type === "html") {
            return (
                <iframe
                    srcDoc={processedContent.content}
                    className="w-full min-h-[700px] border-2 border-black bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                    title={guide?.title || "Guide Document"}
                    style={{ display: "block" }}
                />
            );
        }

        return (
            <div ref={contentRef} className="prose md:prose-xl max-w-none prose-headings:font-black prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white dark:prose-invert dark:prose-a:text-blue-400 dark:prose-code:bg-gray-800 dark:prose-pre:bg-gray-800 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
                <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>{contentWithAnchors || processedContent.content}</ReactMarkdown>
            </div>
        );
    }""",
    code
)

# 5. Remove Fireworks/Balloons refs
code = re.sub(r'const fireworksRef = useRef<HTMLDivElement>\(null\);\n?', '', code)
code = re.sub(r'const balloonsRef = useRef<any>\(null\);\n?', '', code)
code = re.sub(r'const \[showCelebrationText, setShowCelebrationText\] = useState<boolean>\(true\);\n?', '', code)

# 6. Remove Fireworks useEffect
code = re.sub(r'useEffect\(\(\) => \{\n\s*if \(!fireworksRef\.current\) return;[\s\S]*?\}\), \[loading, guide\]\);\n?', '', code)

# 7. Remove Fireworks/Balloons from JSX
code = re.sub(r'\{\/\* Bottom Celebration Section \*\/\}(.|\n)*?<Balloons ref=\{balloonsRef\} />\n\s*</div>', '', code)

with open('d:/new/zetsuquids/src/app/(main)/guide/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
