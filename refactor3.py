import re

with open('d:/new/zetsuquids/src/app/(main)/guide/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add rehypeSlug import
if "import rehypeSlug" not in code:
    code = code.replace(
        'import rehypeRaw from "rehype-raw";',
        'import rehypeRaw from "rehype-raw";\nimport rehypeSlug from "rehype-slug";'
    )

# 2. Add rehypeSlug to ReactMarkdown plugins
code = code.replace(
    '<ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>',
    '<ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}>'
)

# 3. Hide GuideTimer
code = code.replace(
    '{user && guide && <GuideTimer guideId={guide.id} userId={user.id} />}',
    '<div className="hidden">\n                        {user && guide && <GuideTimer guideId={guide.id} userId={user.id} />}\n                    </div>'
)

# 4. Fix Cover Image style
code = code.replace(
    '<div className="mb-14 relative w-full">\n                        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-2xl md:rounded-[3rem] border border-gray-200/50 dark:border-gray-800/50 shadow-2xl bg-gray-50 dark:bg-gray-900">',
    '<div className="mb-14 w-full">\n                        <div className="aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">'
)

# 5. Fix padding left issue causing it to not be aligned left
code = code.replace(
    '<div ref={contentRef} className="guide-content relative pl-16 md:pl-20 overflow-visible">',
    '<div ref={contentRef} className="guide-content relative overflow-visible">'
)

# 6. Fix prose container boxing/shadow
# renderContentWithComments container
code = re.sub(
    r'<div ref=\{contentRef\} className="prose md:prose-xl max-w-none prose-headings:font-black prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0\.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white dark:prose-invert dark:prose-a:text-blue-400 dark:prose-code:bg-gray-800 dark:prose-pre:bg-gray-800 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">',
    '<div ref={contentRef} className="prose md:prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white dark:prose-invert dark:prose-a:text-blue-400 dark:prose-code:bg-gray-800 dark:prose-pre:bg-gray-800 w-full">',
    code
)

# renderContent container
code = re.sub(
    r'<div ref=\{contentRef\} className="prose md:prose-xl max-w-none prose-headings:font-black prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0\.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white dark:prose-invert dark:prose-a:text-blue-400 dark:prose-code:bg-gray-800 dark:prose-pre:bg-gray-800 p-6 bg-white dark:bg-gray-900 rounded-lg shadow">',
    '<div ref={contentRef} className="prose md:prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white dark:prose-invert dark:prose-a:text-blue-400 dark:prose-code:bg-gray-800 dark:prose-pre:bg-gray-800 w-full">',
    code
)

with open('d:/new/zetsuquids/src/app/(main)/guide/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
