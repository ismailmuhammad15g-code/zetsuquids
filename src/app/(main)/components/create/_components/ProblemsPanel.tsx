"use client";

import { AlertTriangle, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Marker {
  severity: number;
  message: string;
  startLineNumber: number;
  startColumn: number;
  source: string;
}

interface ProblemsPanelProps {
  markers: Marker[];
  isOpen: boolean;
  onToggle: () => void;
  onMarkerClick?: (line: number, column: number) => void;
}

export function ProblemsPanel({ markers, isOpen, onToggle, onMarkerClick }: ProblemsPanelProps) {
  const errors = markers.filter(m => m.severity === 8);
  const warnings = markers.filter(m => m.severity === 4);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 h-8 px-4 bg-[#0a0a0f] border-t border-white/5 text-xs text-gray-400 hover:text-gray-200 w-full transition-colors shrink-0">
          {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          <span className="font-medium uppercase tracking-wider text-[10px]">Problems</span>
          {errors.length > 0 && (
            <Badge variant="destructive" className="h-4 px-1.5 text-[9px] font-bold">
              {errors.length}
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-bold bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {warnings.length}
            </Badge>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="bg-[#0d0d12] border-t border-white/5 max-h-40 overflow-auto">
        {markers.length === 0 ? (
          <div className="p-4 text-xs text-gray-600 italic text-center">
            No problems detected
          </div>
        ) : (
          markers.map((m, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-4 py-1.5 text-[11px] hover:bg-white/5 cursor-pointer transition-colors"
              onClick={() => onMarkerClick?.(m.startLineNumber, m.startColumn)}
            >
              {m.severity === 8 ? (
                <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={12} className="text-yellow-400 mt-0.5 shrink-0" />
              )}
              <span className="text-gray-300 break-all">{m.message}</span>
              <span className="text-gray-600 ml-auto shrink-0 font-mono">
                [{m.startLineNumber}:{m.startColumn}]
              </span>
            </div>
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
