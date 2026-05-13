import re

with open('src/components/Chatbot.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace duplicate currentCode lines
content = re.sub(
    r'(currentCode=\{[^\}]+\}\s*)\1', r'\1', content
)
# Wait, it might have nested braces.

# Just do a literal string replace to remove one of them
dub = '                currentCode={messages[messages.length - 1]?.role === "bot" ? messages[messages.length - 1].content : ""}\n                currentCode={messages[messages.length - 1]?.role === "bot" ? messages[messages.length - 1].content : ""}'

content = content.replace(dub, '                currentCode={messages[messages.length - 1]?.role === "bot" ? messages[messages.length - 1].content : ""}')

with open('src/components/Chatbot.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
