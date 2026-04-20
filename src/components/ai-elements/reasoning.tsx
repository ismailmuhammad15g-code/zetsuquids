import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, ChevronUp } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

// ─── Context ──────────────────────────────────────────────────────────────────

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setOpen: (val: boolean) => void;
  duration?: number;
};

const ReasoningContext = createContext<ReasoningContextValue | undefined>(undefined);

export const useReasoning = () => {
  const ctx = useContext(ReasoningContext);
  if (!ctx) throw new Error("useReasoning must be used inside <Reasoning>");
  return ctx;
};

// ─── Root ─────────────────────────────────────────────────────────────────────

/**
 * @param {Object}  props
 * @param {boolean} props.isStreaming   – auto-opens while streaming, closes when done
 * @param {boolean} [props.open]        – controlled open state
 * @param {boolean} [props.defaultOpen] – uncontrolled initial state (default true)
 * @param {(open: boolean) => void} [props.onOpenChange]
 * @param {number}  [props.duration]    – override elapsed seconds from outside
 * @param {string}  [props.className]
 */
export const Reasoning = ({
  isStreaming = false,
  open,
  defaultOpen = true,
  onOpenChange,
  duration,
  children,
  className = "",
}: {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  children?: React.ReactNode;
  className?: string;
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [elapsed, setElapsed] = useState<number | undefined>(undefined);
  const startRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const controlled = open !== undefined;
  const isOpen = controlled ? open : internalOpen;

  const setOpen = (val: boolean): void => {
    if (!controlled) setInternalOpen(val);
    onOpenChange?.(val);
  };

  useEffect(() => {
    if (isStreaming) {
      setOpen(true);
      startRef.current = Date.now();
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        if (startRef.current !== null) {
          setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
      if (startRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        startRef.current = null;
      }
      // small delay so user can see the final state before collapsing
      const t = setTimeout(() => setOpen(false), 600);
      return () => clearTimeout(t);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ReasoningContext.Provider
      value={{
        isStreaming,
        isOpen,
        setOpen,
        duration: duration ?? elapsed,
      }}
    >
      <div className={`w-full ${className}`}>{children}</div>
    </ReasoningContext.Provider>
  );
};

// ─── Trigger ──────────────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {(isStreaming: boolean, duration?: number) => React.ReactNode} [props.getThinkingMessage]
 */
export const ReasoningTrigger = ({ getThinkingMessage, className = "", ...rest }: { getThinkingMessage?: (isStreaming: boolean, duration?: number) => React.ReactNode; className?: string;[key: string]: any }) => {
  const { isStreaming, isOpen, setOpen, duration } = useReasoning();

  const label = getThinkingMessage
    ? getThinkingMessage(isStreaming, duration)
    : isStreaming
      ? "Thinking…"
      : duration !== undefined
        ? `Thought for ${duration}s`
        : "View reasoning";

  return (
    <button
      type="button"
      onClick={() => setOpen(!isOpen)}
      className={[
        "flex items-center gap-1.5 select-none",
        "text-sm transition-colors duration-150",
        isStreaming
          ? "text-blue-500 dark:text-blue-400"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
        className,
      ].join(" ")}
      {...rest}
    >
      {/* icon + pulse ring */}
      <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
        <BrainCircuit size={16} />
        {isStreaming && (
          <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-30 pointer-events-none" />
        )}
      </span>

      {/* label */}
      <span className="font-normal">{label}</span>

      {/* chevron rotates when open */}
      <motion.span
        className="flex items-center"
        animate={{ rotate: isOpen ? 0 : 180 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <ChevronUp size={14} />
      </motion.span>
    </button>
  );
};

// ─── Content ──────────────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {string} props.children  – reasoning text to display
 */
export const ReasoningContent = ({ children, className = "", ...rest }: { children?: React.ReactNode; className?: string;[key: string]: any }) => {
  const { isOpen } = useReasoning();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="reasoning-body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
          {...rest}
        >
          <div
            className={[
              "pt-2 pb-1 pl-0.5",
              "text-sm leading-relaxed whitespace-pre-wrap",
              "text-gray-600 dark:text-gray-300",
              className,
            ].join(" ")}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Composed default export (optional convenience) ───────────────────────────

/**
 * Drop-in composed version — matches the screenshot exactly.
 *
 * Usage:
 *   <ReasoningBlock isStreaming={isStreaming} text={reasoningText} />
 */
export const ReasoningBlock = ({ isStreaming, text, className = "" }: { isStreaming?: boolean; text?: string; className?: string }) => (
  <Reasoning isStreaming={isStreaming} className={className}>
    <ReasoningTrigger />
    <ReasoningContent>{text}</ReasoningContent>
  </Reasoning>
);
