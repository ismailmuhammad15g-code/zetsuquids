"use client";

import { Button } from "@/components/ui/button";
import {
    PromptInput,
    PromptInputAction,
    PromptInputActions,
    PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { ArrowUp, Paperclip, Square, X } from "lucide-react";
import { useRef, useState } from "react";

export default function PromptInputWithActions({
  onSend,
  isLoading,
  onFileSelect,
  placeholder = "Ask me anything...",
  value,
  onChange,
  startActions,
}) {
  const [internalInput, setInternalInput] = useState("");
  const [files, setFiles] = useState([]);
  const uploadInputRef = useRef(null);

  // Handle controlled vs uncontrolled input
  const input = value !== undefined ? value : internalInput;
  const setInput = onChange || setInternalInput;

  const handleSubmit = () => {
    if ((input && input.trim()) || files.length > 0) {
      if (onSend) {
        onSend(input, files);
      }
      // If uncontrolled, clear input
      if (!onChange) {
        setInput("");
      }
      setFiles([]);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      if (onFileSelect) onFileSelect(newFiles);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = "";
    }
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      className="w-full bg-[#1a1a1a]/90 backdrop-blur-xl border-white/10 text-white shadow-2xl rounded-2xl"
    >
      <PromptInputTextarea
        placeholder={placeholder}
        className="text-gray-200 placeholder:text-gray-500 min-h-[50px] selection:bg-blue-500/30 px-3 py-3"
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pb-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-white/10 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white border border-white/5 animate-in fade-in zoom-in-95 duration-200"
            >
              <Paperclip className="size-3 text-blue-400" />
              <span className="max-w-[100px] truncate">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="hover:bg-white/10 rounded-full p-1 transition-colors hover:text-red-400"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <PromptInputActions className="flex items-center justify-between gap-2 pt-2 px-3 pb-2 border-t border-white/5 mt-1">
        <div className="flex items-center gap-2">
          {startActions}

          <PromptInputAction tooltip="Attach files">
            <label
              htmlFor="file-upload"
              className="hover:bg-white/5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 text-gray-400 hover:text-white active:scale-95"
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                ref={uploadInputRef}
              />

              <Paperclip className="size-5" />
            </label>
          </PromptInputAction>
        </div>

        <PromptInputAction
          tooltip={isLoading ? "Stop generation" : "Send message"}
        >
          <Button
            variant="default"
            size="icon"
            className={`h-9 w-9 rounded-xl transition-all duration-300 shadow-lg ${
              (input && input.trim()) || files.length > 0
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 translate-y-0 opacity-100"
                : "bg-white/5 text-gray-600 cursor-not-allowed shadow-none"
            }`}
            onClick={handleSubmit}
            disabled={(!input?.trim() && files.length === 0) || isLoading}
          >
            {isLoading ? (
              <Square className="size-4 fill-current animate-pulse" />
            ) : (
              <ArrowUp className="size-5" />
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
