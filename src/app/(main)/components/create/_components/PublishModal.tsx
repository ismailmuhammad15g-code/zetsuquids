"use client";

import { Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  componentType: 'component' | 'template';
  onComponentTypeChange: (type: 'component' | 'template') => void;
  tags: string;
  onTagsChange: (value: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

export function PublishModal({
  open,
  onOpenChange,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  componentType,
  onComponentTypeChange,
  tags,
  onTagsChange,
  isSaving,
  onSave,
}: PublishModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#1e1e1e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Publish Component</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your creation with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs uppercase tracking-wider font-bold">
              Title *
            </Label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder-gray-700 focus:border-[#007acc] focus:ring-[#007acc]"
              placeholder="e.g., Neon Liquid Button"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400 text-xs uppercase tracking-wider font-bold">
              Description{" "}
              <span className="text-gray-600 normal-case font-normal">(optional)</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder-gray-700 focus:border-[#007acc] focus:ring-[#007acc] h-20 resize-none"
              placeholder="What does this component do?"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400 text-xs uppercase tracking-wider font-bold">
              Type
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onComponentTypeChange('component')}
                className={
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all " +
                  (componentType === 'component'
                    ? "border-[#007acc]/50 bg-[#007acc]/10 text-[#007acc]"
                    : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300")
                }
              >
                <Layers size={14} /> Component
              </button>
              <button
                type="button"
                onClick={() => onComponentTypeChange('template')}
                className={
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all " +
                  (componentType === 'template'
                    ? "border-[#007acc]/50 bg-[#007acc]/10 text-[#007acc]"
                    : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300")
                }
              >
                <Layers size={14} /> Template
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400 text-xs uppercase tracking-wider font-bold">
              Tags
            </Label>
            <Input
              value={tags}
              onChange={(e) => onTagsChange(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder-gray-700 focus:border-[#007acc] focus:ring-[#007acc]"
              placeholder="button, neon, hover, 3d"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
            <span className="text-amber-500/60 mt-0.5 text-sm">&#128274;</span>
            <p className="text-[11px] text-amber-500/60 leading-relaxed">
              ENV variables are encrypted and never shown publicly.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Publish Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
