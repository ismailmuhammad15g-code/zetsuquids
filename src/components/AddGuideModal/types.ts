import { ReactNode } from "react";

export interface GuideQuestion {
  id: string; // Client-side temp ID
  question_text: string;
  options: string[];
  correct_option_index: number;
  points: number;
}

export interface FormData {
  title: string;
  keywords: string;
  content: string;
  html_content: string;
  css_content: string;
  cover_image: string;
  category: string;
  difficulty: string;
  questions?: GuideQuestion[];
}

export type MainTab = "editor" | "preview" | "details" | "questions";
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
