"use client";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from "react";

interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}

const PromptInputContext = createContext<PromptInputContextType | undefined>(undefined);

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput");
  }
  return context;
}

interface PromptInputProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  maxHeight?: number | string;
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: () => void;
  children?: ReactNode;
}

function PromptInput({
  className,
  isLoading = false,
  maxHeight = 240,
  value,
  onValueChange,
  onSubmit,
  children,
}: PromptInputProps) {
  const [internalValue, setInternalValue] = useState(value || "");

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <PromptInputContext.Provider
      value={{
        isLoading,
        value: value ?? internalValue,
        setValue: onValueChange ?? handleChange,
        maxHeight,
        onSubmit,
      }}
    >
      <div
        className={cn(
          "border-input bg-background rounded-3xl border p-2 shadow-xs",
          className,
        )}
      >
        {children}
      </div>
    </PromptInputContext.Provider>
  );
}

interface PromptInputTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  disableAutosize?: boolean;
}

function PromptInputTextarea({
  className,
  onKeyDown,
  disableAutosize = false,
  ...props
}: PromptInputTextareaProps) {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (disableAutosize) return;

    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Type your message..."
      className={cn(
        "max-h-96 resize-none rounded-lg border-0 p-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className,
      )}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      {...props}
    />
  );
}

interface PromptInputButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function PromptInputButton({
  className,
  children,
  ...props
}: PromptInputButtonProps) {
  const { isLoading } = usePromptInput();

  return (
    <button
      disabled={isLoading}
      className={cn(
        "rounded-md bg-primary p-2 text-primary-foreground disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { PromptInput, PromptInputTextarea, PromptInputButton };
