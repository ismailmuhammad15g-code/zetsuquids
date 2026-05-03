import { ReactNode } from "react";

export interface FormData {
  title: string;
  keywords: string;
  content: string;
  html_content: string;
  css_content: string;
  cover_image: string;
}

export type MainTab = "editor" | "preview" | "details";
export type PreviewDevice = "laptop" | "tablet" | "phone";
export type ViewMode = "edit" | "split" | "preview";

export interface AddGuideModalProps {
  onClose: () => void;
}

export interface ToolbarButtonProps {
  icon: ReactNode;
  onClick: () => void;
  tooltip: string;
  className?: string;
}
