"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Terminal, Search, Globe, Database, FileText, Cpu, Zap, Clock } from "lucide-react";

export type AgentLogEntry = {
  id: string;
  type: "thought" | "step" | "action" | "result" | "error" | "search" | "write" | "done";
  text: string;
  timestamp: number;
  isLive?: boolean;
};

const TYPE_META: Record<AgentLogEntry["type"], { icon: React.ReactNode; color: string; label: string }> = {
  thought: { icon: <Cpu size={12} />, color: "text-purple-500 bg-purple-50 border-purple-200", label: "Thinking" },
  search: { icon: <Search size={12} />, color: "text-blue-500 bg-blue-50 border-blue-200", label: "Searching" },
  action: { icon: <Globe size={12} />, color: "text-orange-500 bg-orange-50 border-orange-200", label: "Action" },
  step: { icon: <Terminal size={12} />, color: "text-slate-600 bg-slate-50 border-slate-200", label: "Step" },
  write: { icon: <FileText size={12} />, color: "text-green-600 bg-green-50 border-green-200", label: "Writing" },
  result: { icon: <Database size={12} />, color: "text-teal-600 bg-teal-50 border-teal-200", label: "Result" },
  done: { icon: <CheckCircle2 size={12} />, color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Done" },
  error: { icon: <AlertCircle size={12} />, color: "text-red-500 bg-red-50 border-red-200", label: "Error" },
};

function SkeletonLine({ width = "full", delay = 0 }: { width?: string; delay?: number }) {
  return (
    <div
      className={`h-2.5 bg-slate-200 rounded-full animate-pulse w-${width}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function LogEntryRow({ entry, isActive }: { entry: AgentLogEntry; isActive: boolean }) {
  const meta = TYPE_META[entry.type];
  const timeStr = new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className={`flex items-start gap-2.5 py-2 px-3 rounded-lg border transition-all duration-300 ${isActive ? "bg-white shadow-sm border-slate-200" : "border-transparent bg-transparent"}`}>
      {/* Timeline dot + icon */}
      <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${meta.color}`}>
        {isActive ? <Loader2 size={10} className="animate-spin" /> : meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-[9px] text-slate-400 flex items-center gap-1">
            <Clock size={8} /> {timeStr}
          </span>
        </div>
        <p className={`text-[11px] leading-relaxed break-words ${isActive ? "text-slate-800 font-medium" : "text-slate-500"}`}>
          {entry.text}
        </p>
        {/* Live typing skeleton for the current step */}
        {isActive && entry.isLive && (
          <div className="mt-2 space-y-1.5">
            <SkeletonLine width="3/4" delay={0} />
            <SkeletonLine width="full" delay={150} />
            <SkeletonLine width="1/2" delay={300} />
          </div>
        )}
      </div>
    </div>
  );
}

interface AgentWorkspacePanelProps {
  logs: AgentLogEntry[];
  isActive: boolean;
  currentStep?: string;
}

export default function AgentWorkspacePanel({ logs, isActive, currentStep }: AgentWorkspacePanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  // Auto-scroll to bottom
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
    <div className="flex flex-col h-full bg-slate-950 text-white font-mono text-xs overflow-hidden">
      {/* Top bar — macOS style */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Terminal size={10} className="text-slate-400" />
          <span className="text-[10px] text-slate-400 font-sans font-semibold tracking-wide">Agent Workspace</span>
        </div>
        {isActive && (
          <div className="flex items-center gap-1 text-[9px] text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {elapsed}s
          </div>
        )}
      </div>

      {/* Current step pill */}
      {isActive && currentStep && (
        <div className="flex-shrink-0 px-3 py-2 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-yellow-400 animate-pulse flex-shrink-0" />
            <p className="text-[10px] text-yellow-300 font-sans truncate">{currentStep}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {logs.length === 0 && !isActive && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
            <Terminal size={24} className="text-slate-600" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-sans font-semibold">Agent Standby</p>
            <p className="text-slate-600 text-[10px] font-sans mt-1">Assign a complex task to see the agent work in real-time.</p>
          </div>
        </div>
      )}

      {/* Log entries scroll area */}
      {logs.length > 0 && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent bg-white/95">
          {logs.map((entry, idx) => (
            <LogEntryRow
              key={entry.id}
              entry={entry}
              isActive={isActive && idx === logs.length - 1}
            />
          ))}

          {/* Skeleton for next incoming line */}
          {isActive && (
            <div className="flex items-start gap-2.5 py-2 px-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center mt-0.5 flex-shrink-0">
                <Loader2 size={10} className="animate-spin text-slate-500" />
              </div>
              <div className="flex-1 space-y-1.5 pt-1">
                <SkeletonLine width="1/3" />
                <SkeletonLine width="full" delay={100} />
                <SkeletonLine width="2/3" delay={200} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-slate-600"}`} />
          <span className="text-[9px] text-slate-500 font-sans">{isActive ? "Processing..." : "Idle"}</span>
        </div>
        <span className="text-[9px] text-slate-600 font-sans">{logs.length} events</span>
      </div>
    </div>
  );
}
