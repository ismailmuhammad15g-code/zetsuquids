import re

with open('d:/new/zetsuquids/src/app/(main)/guide/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Completely rewrite `processedContent` useMemo
processed_content_new = """    const processedContent = useMemo((): ProcessedContent | null => {
        if (!guide) return null;

        if (
            guide.content_type === "html" ||
            (guide.html_content && guide.html_content.trim())
        ) {
            const htmlContent = guide.html_content?.trim() || "";
            const isFullDocument =
                htmlContent.toLowerCase().includes("<!doctype") ||
                htmlContent.toLowerCase().includes("<html");

            const fullHTML = isFullDocument
                ? htmlContent
                : `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            padding: 20px;
            margin: 0;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
            return { type: "html", content: fullHTML };
        }

        let markdownContent = guide.markdown || guide.content || "";
        
        // Search highlighting on markdown (basic regex approach)
        if (debouncedSearch && debouncedSearch.trim()) {
            const escaped = debouncedSearch.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
            const regex = new RegExp(`(${escaped})`, "gi");
            markdownContent = markdownContent.replace(regex, '<mark class="bg-yellow-200 text-black font-bold px-1 rounded-sm">$1</mark>');
        }

        return { type: "markdown", content: markdownContent };
    }, [guide, debouncedSearch]);"""

# Replace the useMemo from const processedContent = useMemo(...) to }, [guide, debouncedSearch]);
code = re.sub(
    r'const processedContent = useMemo\(\(\): ProcessedContent \| null => \{[\s\S]*?\}, \[guide, debouncedSearch\]\);',
    processed_content_new,
    code
)

with open('d:/new/zetsuquids/src/app/(main)/guide/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
