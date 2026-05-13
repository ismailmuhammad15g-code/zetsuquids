"use client";
import { CheckCircle2, ChevronRight, Code2, Loader2, Maximize, Minus, PauseCircle, Terminal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export type AgentLogEntry = {
    id: string;
    type: "thought" | "step" | "action" | "result" | "error" | "search" | "write" | "done";
    text: string;
    timestamp: number;
    isLive?: boolean;
};

interface ManusComputerMockupProps {
    logs: AgentLogEntry[];
    isActive: boolean;
    currentCode?: string; // If the AI is writing code/markdown currently
    filename?: string;
}

export default function ManusComputerMockup({ logs, isActive, currentCode, filename = "ai_news_findings.md" }: ManusComputerMockupProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const startTime = useRef(Date.now());

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Elapsed time counter
    useEffect(() => {
        if (!isActive) { setElapsed(0); return; }
        startTime.current = Date.now();
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isActive]);

    return (
        <div className="flex flex-col w-[600px] h-[700px] max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-right-4 zoom-in-95 duration-500 font-sans">
            {/* macOS Title Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 select-none">
                <div className="flex items-center gap-2">
                    {/* Mac Buttons */}
                    <div className="flex gap-1.5 group">
                        <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500 flex items-center justify-center">
                            <X size={8} className="text-red-900 opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500 flex items-center justify-center">
                            <Minus size={8} className="text-yellow-900 opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500 flex items-center justify-center">
                            <Maximize size={8} className="text-green-900 opacity-0 group-hover:opacity-100" />
                        </div>
                    </div>
                    <span className="ml-2 font-semibold text-slate-700 text-sm">ZetsuGuide AI Workstation</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-tight">Secure</span>
                    </div>
                    <Terminal size={14} className="text-slate-400" />
                </div>
            </div>

            {/* Professional Browser/App Address Bar */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <ChevronRight size={14} className="rotate-180" />
                    <ChevronRight size={14} />
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-md py-1 px-3 flex items-center gap-2 shadow-sm">
                    <span className="text-slate-300 text-xs font-semibold select-none">https://</span>
                    <span className="text-slate-600 text-xs font-medium">ai.zetsuguide.com/workspace/agent-01</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                    V2.5.0
                </div>
            </div>

            {/* Task Context Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-indigo-600 text-white shadow-lg">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Loader2 size={12} className={`animate-spin ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                        {isActive ? 'Processing Autonomous Task' : 'Task Successfully Completed'}
                    </span>
                    <span className="text-indigo-300">|</span>
                    <span className="text-[11px] font-medium truncate italic opacity-90">
                        Target: {filename}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/50"></div>
                    <span className="text-[9px] font-mono opacity-70">CPU: {isActive ? '12%' : '0%'}</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
                {/* Editor Tab */}
                <div className="mx-4 mt-4 bg-white border border-slate-200 rounded-t-lg shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-mono text-slate-500 flex justify-center font-semibold">
                        {filename}
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 prose prose-sm max-w-none text-slate-700 font-mono text-sm leading-relaxed">
                        {currentCode ? (
                            <ReactMarkdown>{currentCode}</ReactMarkdown>
                        ) : (
                            <div className="flex flex-col gap-4 text-slate-300 mt-4 animate-pulse">
                                {isActive && (
                                    <>
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar overlay at the bottom of the editor */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1 z-10">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <ChevronRight size={14} />
                            <ChevronRight size={14} className="-ml-3" />
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                            {isActive ? 'live' : 'done'}
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div className={`h-full bg-blue-500 rounded-full transition-all duration-300 ${isActive ? 'w-2/3 animate-pulse' : 'w-full'}`}></div>
                    </div>
                </div>
            </div>

            {/* Bottom Log Panel like the screenshot */}
            <div className="h-28 bg-white border-t border-slate-200 p-4 flex flex-col justify-between">
                <div ref={scrollRef} className="flex-1 overflow-hidden relative">
                    <div className="absolute bottom-0 w-full flex flex-col gap-1 justify-end transition-all duration-300">
                        {logs.slice(-3).map((log, idx, arr) => (
                            <div key={log.id} className={`flex items-start gap-3 transition-opacity ${idx === arr.length - 1 ? 'opacity-100' : 'opacity-40'}`}>
                                <div className="mt-1 flex-shrink-0">
                                    {log.type === 'done' ? (
                                        <CheckCircle2 size={14} className="text-green-500" />
                                    ) : (
                                        <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
                                    )}
                                </div>
                                <div className="flex flex-col -mt-0.5">
                                    <span className="text-sm font-medium text-slate-700">{log.text}</span>
                                    {idx === arr.length - 1 && isActive && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono">
                                            <span>0:{elapsed.toString().padStart(2, '0')}</span>
                                            <span className="flex items-center gap-1">
                                                <Loader2 size={10} className="animate-spin" />
                                                {log.type === 'thought' ? 'Thinking' : log.type === 'search' ? 'Searching internet' : 'Working'}...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="flex items-start gap-3 opacity-100">
                                <div className="mt-1 flex-shrink-0">
                                    <PauseCircle size={14} className="text-slate-400" />
                                </div>
                                <div className="flex flex-col -mt-0.5">
                                    <span className="text-sm font-medium text-slate-500">Awaiting task...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
