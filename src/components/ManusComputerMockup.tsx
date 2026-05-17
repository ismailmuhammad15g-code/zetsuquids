"use client";
import { CheckCircle2, ChevronRight, ListChecks, Loader2, Maximize, Minus, PauseCircle, Terminal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export type AgentLogEntry = {
    id: string;
    type: "thought" | "step" | "action" | "result" | "error" | "search" | "write" | "done";
    text: string;
    timestamp: number;
    isLive?: boolean;
};

export interface AgentTask {
    id: string;
    label: string;
    status: "pending" | "in_progress" | "completed";
}

interface ManusComputerMockupProps {
    logs: AgentLogEntry[];
    isActive: boolean;
    currentCode?: string;
    filename?: string;
    plan?: string[];
    tasks?: AgentTask[];
    currentStep?: number;
    maxSteps?: number;
}

export default function ManusComputerMockup({
    logs,
    isActive,
    currentCode,
    filename = "task_workflow.md",
    plan = [],
    tasks = [],
    currentStep = 0,
    maxSteps = 25,
}: ManusComputerMockupProps) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const startTime = useRef(Date.now());

    const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, tasks]);

    useEffect(() => {
        if (!isActive) { setElapsed(0); return; }
        startTime.current = Date.now();
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isActive]);

    const completedCount = tasks.filter(t => t.status === "completed").length;
    const totalTasks = tasks.length;
    const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    return (
        <div className="flex flex-col w-[600px] h-[700px] max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-right-4 zoom-in-95 duration-500 font-sans">
            {/* macOS Title Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 select-none cursor-default flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors shadow-sm" />
                    </div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 text-xs font-medium text-slate-400 tracking-wide flex items-center gap-2">
                    <Terminal size={12} />
                    Zetsu Agent
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                    <Minus size={14} className="cursor-pointer hover:text-slate-600" />
                    <Maximize size={14} className="cursor-pointer hover:text-slate-600" />
                    <X size={14} className="cursor-pointer hover:text-slate-600" />
                </div>
            </div>

            {/* Live Status Bar */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 text-xs font-mono flex-shrink-0">
                {isActive ? (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Processing
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-slate-500">
                        <PauseCircle size={10} />
                        Idle
                    </span>
                )}
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 truncate flex-1">
                    {latestLog ? latestLog.text : "Waiting for instructions..."}
                </span>
                <span className="text-slate-600 tabular-nums">{elapsed}s</span>
            </div>

            {/* Context Bar */}
            <div className={`flex items-center justify-between px-4 py-2 border-b flex-shrink-0 ${isActive ? "bg-indigo-50/50 border-indigo-100" : "bg-emerald-50/50 border-emerald-100"}`}>
                <div className="flex items-center gap-2 text-sm font-medium">
                    {isActive ? (
                        <>
                            <Loader2 size={14} className="text-indigo-500 animate-spin" />
                            <span className="text-indigo-700">Processing Autonomous Task</span>
                            {totalTasks > 0 && (
                                <span className="text-xs text-indigo-400 ml-2">
                                    ({completedCount}/{totalTasks} tasks)
                                </span>
                            )}
                            {currentStep > 0 && (
                                <span className="text-[10px] text-indigo-300 ml-1">
                                    Step {currentStep}/{maxSteps}
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-emerald-700">Task Successfully Completed</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isActive && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-xs font-medium">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                            </span>
                            Live
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>

                    {/* Plan Section */}
                    {plan.length > 0 && (
                        <div className="bg-white rounded-lg border border-indigo-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100">
                                <ListChecks size={14} className="text-indigo-500" />
                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Plan</span>
                            </div>
                            <div className="p-2 space-y-1">
                                {plan.map((step, i) => (
                                    <div key={i} className="flex items-start gap-2 px-2 py-1.5 text-sm">
                                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="text-slate-700">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks Section */}
                    {tasks.length > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-slate-500" />
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tasks</span>
                                </div>
                                {totalTasks > 0 && (
                                    <span className="text-[10px] text-slate-400">
                                        {completedCount}/{totalTasks}
                                    </span>
                                )}
                            </div>
                            <div className="p-2 space-y-1">
                                {tasks.map((task) => (
                                    <div key={task.id} className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${task.status === "completed" ? "bg-emerald-50" : task.status === "in_progress" ? "bg-indigo-50" : ""}`}>
                                        {task.status === "completed" ? (
                                            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                        ) : task.status === "in_progress" ? (
                                            <Loader2 size={14} className="text-indigo-500 animate-spin flex-shrink-0" />
                                        ) : (
                                            <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                                        )}
                                        <span className={`${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                                            {task.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {/* Progress bar */}
                            <div className="h-1 bg-slate-100">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Code/Editor Display */}
                    {currentCode && (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                                <span className="w-3 h-3 rounded-full bg-red-300" />
                                <span className="w-3 h-3 rounded-full bg-yellow-300" />
                                <span className="w-3 h-3 rounded-full bg-green-300" />
                                <span className="ml-2 text-xs text-slate-400 font-mono">{filename}</span>
                            </div>
                            <div className="p-3 max-h-[200px] overflow-y-auto">
                                <div className="prose prose-xs prose-slate max-w-none text-xs leading-relaxed">
                                    <ReactMarkdown>{currentCode.replace(/\[\s*ACTION\s*:[^\]]+\]/gi, "").trim()}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!currentCode && logs.length === 0 && plan.length === 0 && tasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Terminal size={32} className="mb-2 opacity-40" />
                            <p className="text-sm">Agent workstation ready</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Logs Panel */}
            <div className="flex flex-col border-t border-slate-200 bg-slate-50 flex-shrink-0 max-h-[150px]">
                <div className="flex items-center gap-2 px-4 py-1.5 border-b border-slate-200/50">
                    <ChevronRight size={10} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activity Log</span>
                    {logs.length > 0 && <span className="text-[10px] text-slate-400 ml-auto">{logs.length} entries</span>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {logs.length === 0 && (
                        <div className="text-xs text-slate-400 px-2 py-1">No activity recorded yet.</div>
                    )}
                    {logs.slice(-3).map((log) => (
                        <div key={log.id} className={`flex items-start gap-2 px-2 py-1 rounded text-xs ${log.isLive ? "bg-indigo-50" : ""}`}>
                            <span className="text-slate-300 mt-0.5 flex-shrink-0">
                                {log.type === "thought" && <span className="text-indigo-400">?</span>}
                                {log.type === "step" && <span className="text-indigo-400">?</span>}
                                {log.type === "action" && <span className="text-amber-500">?</span>}
                                {log.type === "result" && <span className="text-emerald-500">?</span>}
                                {log.type === "error" && <span className="text-red-500">?</span>}
                                {log.type === "search" && <span className="text-blue-400">?</span>}
                                {log.type === "write" && <span className="text-emerald-400">?</span>}
                                {log.type === "done" && <span className="text-emerald-600">?</span>}
                            </span>
                            <span className="text-slate-600 flex-1">{log.text}</span>
                            {log.isLive && (
                                <span className="flex items-center gap-1 text-indigo-400 flex-shrink-0">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                                    </span>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Elapsed Bar */}
            <div className="w-full h-1 bg-slate-100 flex-shrink-0 overflow-hidden">
                {isActive && (
                    <div
                        className="h-full bg-indigo-200 transition-all duration-1000"
                        style={{ width: `${Math.min((elapsed / 120) * 100, 100)}%` }}
                    />
                )}
            </div>
        </div>
    );
}
