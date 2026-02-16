"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { createContext, useContext, useEffect, useState } from "react";

const ReasoningContext = createContext();

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("useReasoning must be used within a Reasoning component");
  }
  return context;
};

export function Reasoning({
  children,
  isStreaming = false,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  duration = 300,
  ...props
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (isStreaming) {
      setInternalOpen(true);
      onOpenChange?.(true);
    }
  }, [isStreaming, onOpenChange]);

  useEffect(() => {
    if (!isStreaming && isOpen) {
      const timer = setTimeout(() => {
        setInternalOpen(false);
        onOpenChange?.(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isStreaming, isOpen, duration, onOpenChange]);

  const handleOpenChange = (newOpen) => {
    setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <ReasoningContext.Provider
      value={{ isStreaming, isOpen, setIsOpen: handleOpenChange, duration }}
    >
      <Collapsible
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </Collapsible>
    </ReasoningContext.Provider>
  );
}

export function ReasoningTrigger({
  children,
  getThinkingMessage,
  ...props
}) {
  const { isStreaming, isOpen, duration } = useReasoning();

  const defaultThinkingMessage = (isStreaming, duration) => (
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <span className="flex items-center gap-1">
        <motion.span
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          •
        </motion.span>
        <motion.span
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0.2,
            ease: "easeInOut",
          }}
        >
          •
        </motion.span>
        <motion.span
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0.4,
            ease: "easeInOut",
          }}
        >
          •
        </motion.span>
      </span>
      <span className="font-medium">Thinking</span>
    </div>
  );

  const thinkingMessage =
    typeof getThinkingMessage === "function"
      ? getThinkingMessage(isStreaming, duration)
      : defaultThinkingMessage(isStreaming, duration);

  return (
    <CollapsibleTrigger
      className={clsx(
        "flex w-full items-center justify-between rounded-t-lg border-b border-transparent px-3 py-2 text-left text-sm font-medium hover:bg-white/5 dark:hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors",
        isOpen && "bg-white/5 dark:bg-black/5 border-gray-200 dark:border-gray-800",
      )}
      {...props}
    >
      {isStreaming ? thinkingMessage : "Show reasoning"}
    </CollapsibleTrigger>
  );
}

export function ReasoningContent({ children, ...props }) {
  return (
    <CollapsibleContent
      className="overflow-hidden text-sm text-gray-600 dark:text-gray-400"
      {...props}
    >
      <AnimatePresence initial={false}>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="px-3 pb-3 leading-relaxed">
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    </CollapsibleContent>
  );
}
