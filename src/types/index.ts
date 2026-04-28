// Shared TypeScript type definitions for the entire application

// User and Auth Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

// Guide and Content Types
export interface GuideMetadata {
  id?: string | number;
  title: string;
  slug?: string;
  cover_image?: string | null;
  description?: string;
  content?: string;
  markdown?: string;
  html_content?: string;
  css_content?: string;
  keywords?: string[];
  status?: string;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
  author_name?: string;
  author_email?: string;
  author_id?: string | null;
  content_type?: string;
}

// Community Types
export interface Post {
  id: string | number;
  title?: string;
  content: string;
  author_id?: string;
  author_name?: string;
  author_email?: string;
  created_at?: string;
  updated_at?: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
}

export interface Conversation {
  id: string;
  user_email: string;
  user_name?: string;
  last_message?: string;
  updated_at?: string;
  unread_count?: number;
}

export interface Message {
  id?: string | number;
  conversation_id?: string;
  user_id?: string;
  user_email?: string;
  sender_type?: 'user' | 'staff';
  sender_name?: string;
  message: string;
  created_at?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Component Props Types
export interface WithChildren {
  children: React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Event Handler Types
export type EventHandler<T = React.SyntheticEvent> = (e: T) => void;
export type FormEventHandler = (e: React.FormEvent<HTMLFormElement>) => void;
export type ChangeEventHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
export type ClickEventHandler = (e: React.MouseEvent<HTMLElement>) => void;

// Common Generic Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// State setter types for common patterns
export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

// UI Components Library Types
export interface UiComponent {
  id?: string | number;
  title: string;
  description?: string;
  tags?: string[];
  html_code: string;
  css_code: string;
  js_code: string;
  env_vars?: Record<string, string>;
  author_name?: string;
  author_id?: string;
  author_avatar?: string;
  created_at?: string;
  likes_count?: number;
  views_count?: number;
  theme?: 'light' | 'dark' | 'both';
  component_type?: 'component' | 'template';
  react_files?: { name: string, content: string }[];
  lottie_url?: string;
}
