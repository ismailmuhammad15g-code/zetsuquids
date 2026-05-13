import re

with open('src/components/Chatbot.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import AgentWorkspacePanel, { type AgentLogEntry } from "./AgentWorkspacePanel";',
    'import ManusComputerMockup, { type AgentLogEntry } from "./ManusComputerMockup";'
)

content = content.replace(
    '<AgentWorkspacePanel',
    '<ManusComputerMockup'
)

content = content.replace(
    'currentStep={agentCurrentStep}',
    'currentStep={agentCurrentStep}\n                currentCode={messages[messages.length - 1]?.role === "bot" ? messages[messages.length - 1].content : ""}'
)

content = content.replace(
    'className="hidden sm:flex flex-col w-[380px] flex-shrink-0 border-l border-slate-200 bg-slate-950 overflow-hidden rounded-l-3xl animate-in slide-in-from-right-4 duration-500"',
    'style={{ position: "relative", zIndex: 100, marginRight: "16px", marginTop: "16px", marginBottom: "16px", borderRadius: "16px" }} className="hidden sm:flex flex-col flex-shrink-0 animate-in slide-in-from-right-4 duration-500 overflow-hidden shadow-2xl relative"'
)

content = content.replace(
    'sm:w-[900px] sm:h-[700px]',
    'sm:w-[1300px] sm:h-[760px] gap-2'
)

with open('src/components/Chatbot.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
