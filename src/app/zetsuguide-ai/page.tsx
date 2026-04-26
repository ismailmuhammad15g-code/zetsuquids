"use client";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  Copy,
  PanelLeft,
  PanelLeftClose,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  SquarePen,
  Trash2,
  Zap
} from "lucide-react";
import mermaid from "mermaid";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Inline Styles (scoped to this page only) ────────────────────────────────
const styles = `
  /* Page shell */
  .zg-page {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #f9fafb;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
  }

  /* ─── Sidebar ─── */
  .zg-sidebar {
    width: 268px;
    min-width: 268px;
    background: #fff;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    transition: width 0.25s ease, min-width 0.25s ease, opacity 0.2s ease, transform 0.25s ease;
    z-index: 30;
    overflow: hidden;
  }
  .zg-sidebar.collapsed {
    width: 0;
    min-width: 0;
    opacity: 0;
    border-right: none;
  }
  .zg-sidebar-header {
    padding: 18px 16px 12px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .zg-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: #111;
    text-decoration: none;
  }
  .zg-logo-icon {
    width: 30px;
    height: 30px;
    background: #111;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  .zg-logo-badge {
    font-size: 10px;
    font-weight: 600;
    background: #f0f0f0;
    color: #666;
    padding: 2px 6px;
    border-radius: 20px;
    letter-spacing: 0.5px;
  }
  .zg-new-chat-btn {
    width: 100%;
    margin: 12px 0 8px;
    padding: 9px 14px;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: background 0.15s;
    letter-spacing: -0.2px;
  }
  .zg-new-chat-btn:hover { background: #222; }

  /* History list */
  .zg-history-section {
    flex: 1;
    overflow-y: auto;
    padding: 8px 10px;
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb transparent;
  }
  .zg-history-label {
    font-size: 10.5px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    padding: 8px 6px 6px;
  }
  .zg-history-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.12s;
    min-width: 0;
    border: 1.5px solid transparent;
    margin-bottom: 2px;
  }
  .zg-history-item:hover { background: #f3f4f6; }
  .zg-history-item.active {
    background: #f3f4f6;
    border-color: #e5e7eb;
  }
  .zg-history-item-icon {
    width: 28px;
    height: 28px;
    background: #f3f4f6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    flex-shrink: 0;
  }
  .zg-history-item-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13.5px;
    color: #374151;
    font-weight: 450;
  }
  .zg-history-item-del {
    opacity: 0;
    padding: 3px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 4px;
    color: #9ca3af;
    transition: all 0.1s;
    flex-shrink: 0;
  }
  .zg-history-item:hover .zg-history-item-del { opacity: 1; }
  .zg-history-item-del:hover { background: #fee2e2; color: #ef4444; }

  /* Sidebar footer */
  .zg-sidebar-footer {
    padding: 14px 16px;
    border-top: 1px solid #f3f4f6;
  }
  .zg-user-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .zg-avatar {
    width: 32px;
    height: 32px;
    background: #111;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .zg-user-info { flex: 1; min-width: 0; }
  .zg-user-name {
    font-size: 13px;
    font-weight: 600;
    color: #111;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .zg-credits-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
  }

  /* ─── Main content ─── */
  .zg-main {
    flex: 1;
    height: 100vh; /* Force exact viewport height */
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  /* Top bar */
  .zg-topbar {
    height: 56px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #e5e7eb;
    background: #fff;
    flex-shrink: 0;
  }
  .zg-topbar-title {
    font-size: 14px;
    font-weight: 600;
    color: #111;
    flex: 1;
  }
  .zg-icon-btn {
    width: 34px;
    height: 34px;
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: all 0.12s;
    flex-shrink: 0;
  }
  .zg-icon-btn:hover { background: #f3f4f6; color: #111; border-color: #d1d5db; }

  /* Chat canvas */
  .zg-chat-canvas {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb transparent;
  }
  .zg-messages-inner {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 20px 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* Empty state */
  .zg-empty {
    max-width: 700px;
    margin: 0 auto;
    padding: 60px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }
  .zg-empty-icon {
    width: 48px;
    height: 48px;
    background: #111;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin-bottom: 18px;
  }
  .zg-empty-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.8px;
    color: #111;
    line-height: 1.2;
    margin-bottom: 10px;
  }
  .zg-empty-subtitle {
    font-size: 15px;
    color: #6b7280;
    margin-bottom: 36px;
    font-weight: 400;
    line-height: 1.5;
    max-width: 420px;
  }
  .zg-suggestions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
    max-width: 600px;
  }
  .zg-suggestion-card {
    padding: 14px 16px;
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
    font-size: 13.5px;
    color: #374151;
    font-weight: 450;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    line-height: 1.4;
  }
  .zg-suggestion-card:hover {
    border-color: #9ca3af;
    background: #f9fafb;
    box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  }
  .zg-sc-arrow { color: #d1d5db; flex-shrink: 0; }
  .zg-suggestion-card:hover .zg-sc-arrow { color: #374151; }

  /* ─── Messages ─── */
  .zg-msg-row {
    display: flex;
    flex-direction: column;
    padding: 6px 0;
  }
  /* User bubble */
  .zg-msg-user {
    align-items: flex-end;
    padding: 8px 0;
  }
  .zg-user-bubble {
    max-width: 78%;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 18px 18px 4px 18px;
    padding: 10px 16px;
    font-size: 14.5px;
    color: #111;
    line-height: 1.55;
    word-break: break-word;
  }
  /* AI response */
  .zg-msg-ai {
    align-items: flex-start;
    padding: 8px 0;
    gap: 12px;
  }
  .zg-ai-row { display: flex; gap: 12px; align-items: flex-start; width: 100%; }
  .zg-ai-avatar {
    width: 30px;
    height: 30px;
    background: #111;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .zg-ai-body { flex: 1; min-width: 0; }
  .zg-ai-name {
    font-size: 12px;
    font-weight: 700;
    color: #111;
    letter-spacing: -0.2px;
    margin-bottom: 6px;
  }
  .zg-ai-content {
    font-size: 14.5px;
    color: #374151;
    line-height: 1.65;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .zg-ai-content p { margin: 0 0 8px; }
  .zg-ai-content p:last-child { margin: 0; }
  .zg-ai-content code {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    padding: 1px 5px;
    font-size: 13px;
    color: #111;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }
  .zg-ai-content pre {
    background: #111;
    border-radius: 10px;
    padding: 14px 16px;
    overflow-x: auto;
    margin: 10px 0;
  }
  .zg-ai-content pre code {
    background: none;
    border: none;
    color: #e5e7eb;
    font-size: 13px;
    padding: 0;
  }
  .zg-ai-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 10px;
    padding-left: 2px;
  }
  .zg-action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.12s;
  }
  .zg-action-btn:hover { background: #f3f4f6; color: #111; border-color: #d1d5db; }

  /* Thinking */
  .zg-thinking-dots {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 4px 0;
  }
  .zg-dot {
    width: 6px; height: 6px;
    background: #9ca3af;
    border-radius: 50%;
    animation: dotPulse 1.4s ease-in-out infinite;
  }
  .zg-dot:nth-child(1) { animation-delay: 0s; }
  .zg-dot:nth-child(2) { animation-delay: 0.2s; }
  .zg-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dotPulse {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
    40% { transform: scale(1.1); opacity: 1; }
  }
  .zg-thinking-label {
    font-size: 12.5px;
    color: #9ca3af;
    font-weight: 500;
    margin-left: 2px;
  }

  /* ─── Input Area ─── */
  .zg-input-area {
    background: #f9fafb; /* Solid background matches chat exactly */
    padding: 0 0 16px;
    flex-shrink: 0;
    z-index: 10;
  }
  .zg-input-shell {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 20px;
  }
  .zg-input-box {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    transition: all 0.2s ease;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
  }
  .zg-input-box:focus-within {
    border-color: #d1d5db;
    box-shadow: 0 6px 25px rgba(0,0,0,0.08);
  }
  .zg-textarea {
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    font-size: 15px;
    color: #111;
    background: transparent;
    padding: 16px 20px 4px;
    font-family: inherit;
    line-height: 1.5;
    max-height: 250px;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .zg-textarea::placeholder { color: #9ca3af; }
  .zg-input-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px 10px;
  }
  .zg-toggle-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .zg-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 100px;
    border: 1px solid #f3f4f6;
    background: #f9fafb;
    font-size: 12.5px;
    font-weight: 600;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.15s;
  }
  .zg-toggle:hover { background: #e5e7eb; color: #111; border-color: #e5e7eb; }
  .zg-toggle.active {
    background: #111;
    color: #fff;
    border-color: #111;
  }
  .zg-send-btn {
    width: 36px;
    height: 36px;
    background: #111;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .zg-send-btn:hover { background: #374151; transform: scale(1.05); }
  .zg-send-btn:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; transform: none; }
  .zg-disclaimer {
    max-width: 860px;
    margin: 8px auto 0;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
  }

  /* Login state */
  .zg-login-banner {
    max-width: 440px;
    margin: 80px auto;
    padding: 40px;
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 4px 24px rgba(0,0,0,0.05);
  }
  .zg-login-icon {
    width: 56px;
    height: 56px;
    background: #111;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto 18px;
  }
  .zg-login-title {
    font-size: 20px;
    font-weight: 700;
    color: #111;
    margin-bottom: 8px;
    letter-spacing: -0.4px;
  }
  .zg-login-sub {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 24px;
    line-height: 1.5;
  }
  .zg-login-btn {
    padding: 11px 28px;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .zg-login-btn:hover { background: #374151; }

  /* Error + retry */
  .zg-error-box {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 12px 14px;
    margin-top: 10px;
    font-size: 13px;
    color: #b91c1c;
  }
  .zg-error-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .zg-retry-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font-size: 12.5px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.12s;
  }
  .zg-retry-btn:hover { background: #f3f4f6; }

  /* No credits */
  .zg-no-credits {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 13.5px;
    font-weight: 500;
    color: #92400e;
    text-align: center;
    margin-bottom: 12px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .zg-sidebar {
      position: fixed;
      top: 0; left: 0; bottom: 0;
      width: 280px !important;
      min-width: 280px !important;
      opacity: 1 !important;
      transform: translateX(-100%);
      box-shadow: 4px 0 24px rgba(0,0,0,0.12);
      transition: transform 0.25s ease !important;
      border-right: 1px solid #e5e7eb !important;
    }
    .zg-sidebar.mobile-open { transform: translateX(0); }
    .zg-sidebar.collapsed {
      transform: translateX(-100%);
      width: 280px !important;
      min-width: 280px !important;
      opacity: 1 !important;
    }
    .zg-topbar { padding: 0 12px; }
    .zg-messages-inner { padding: 16px 12px; }
    .zg-input-area { padding: 10px 12px 16px; }
    .zg-input-shell { padding: 0; }
    .zg-empty { padding: 40px 16px 24px; }
    .zg-empty-title { font-size: 22px; }
    .zg-suggestions-grid { grid-template-columns: 1fr; }
    .zg-user-bubble { max-width: 95%; }
  }


  /* ─── Reasoning (Thinking) Component ─── */
  .zg-reasoning {
    margin-bottom: 12px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: #fbfcfd;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .zg-reasoning:hover {
    border-color: #d1d5db;
    background: #f8fafc;
  }
  .zg-reasoning.open {
    border-color: #e5e7eb;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .zg-reasoning-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    user-select: none;
    transition: background 0.1s ease;
  }
  .zg-reasoning-trigger:hover {
    background: rgba(0,0,0,0.02);
  }
  .zg-reasoning-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: color 0.2s;
  }
  .zg-reasoning.open .zg-reasoning-icon {
    color: #111;
  }
  .zg-reasoning-trigger-text {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: #4b5563;
    letter-spacing: -0.1px;
    transition: color 0.2s;
  }
  .zg-reasoning.open .zg-reasoning-trigger-text {
    color: #111;
  }
  .zg-reasoning-duration {
    font-size: 11px;
    font-weight: 500;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 1px 6px;
    border-radius: 100px;
    font-variant-numeric: tabular-nums;
  }
  .zg-reasoning-chevron {
    color: #9ca3af;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .zg-reasoning-chevron.open {
    transform: rotate(180deg);
    color: #6b7280;
  }
  .zg-reasoning-body {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
  }
  .zg-reasoning-body.open {
    max-height: 1000px;
    opacity: 1;
  }
  .zg-reasoning-content {
    padding: 12px 16px 16px;
    font-size: 13.5px;
    line-height: 1.6;
    color: #4b5563;
    border-top: 1px solid #f3f4f6;
    white-space: pre-wrap;
    font-family: inherit;
    border-left: 2px solid #e5e7eb;
    margin: 0 14px 14px;
    background: #fdfdfd;
    border-radius: 0 0 8px 8px;
  }
  .zg-reasoning-content p {
    margin-bottom: 8px;
  }
  .zg-reasoning-content p:last-child {
    margin-bottom: 0;
  }

  /* Streaming state */
  .zg-reasoning.streaming {
    border-color: #d1d5db;
    box-shadow: 0 0 0 2px rgba(0,0,0,0.03);
  }
  .zg-reasoning-pulse {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #111;
    animation: reasoningPulse 1.2s ease-in-out infinite;
  }
  @keyframes reasoningPulse {
    0%, 100% { opacity: 1; transform: scale(1.1); }
    50% { opacity: 0.3; transform: scale(0.8); }
  }

`;

// ─── Components & Helpers ───────────────────────────────────────────────────

function ChevronDownIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="14" height="14"
      viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={`zg-reasoning-chevron${isOpen ? " open" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MessageSquareIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function getInitials(email: string | null): string {
  if (!email) return "U";
  const name = email.split("@")[0];
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MermaidChart({ chart }: { chart: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current && chart) {
      try {
        if (containerRef.current) containerRef.current.innerHTML = chart;
        mermaid.init(undefined, containerRef.current);
      } catch (err) {
        console.error("Mermaid format error:", err);
      }
    }
  }, [chart]);
  return (
    <div
      className="mermaid bg-white border border-gray-200 rounded-xl p-4 my-4 flex justify-center text-[13px]"
      ref={containerRef}
      dir="ltr"
    />
  );
}

function parseThoughtAndResponse(text: string): { thought: string; response: string; isStreaming?: boolean } {
  if (!text) return { thought: "", response: "" };

  const textLower = text.toLowerCase();
  const thinkingStart = textLower.indexOf("<thinking>");
  const thinkingEnd = textLower.indexOf("</thinking>");

  // Case 1: Both tags found (normal case)
  if (thinkingStart !== -1 && thinkingEnd !== -1) {
    const thought = text.substring(thinkingStart + 10, thinkingEnd).trim();
    const response = text.substring(thinkingEnd + 11).trim();
    return { thought, response, isStreaming: false };
  }

  // Case 2: Only closing tag found - content before it is thinking!
  if (thinkingStart === -1 && thinkingEnd !== -1) {
    const thought = text.substring(0, thinkingEnd).trim();
    const response = text.substring(thinkingEnd + 11).trim();
    return { thought, response, isStreaming: false };
  }

  // Case 3: Only opening tag (streaming)
  if (thinkingStart !== -1 && thinkingEnd === -1) {
    const thoughtContent = text.substring(thinkingStart + 10);
    const responseBefore = text.substring(0, thinkingStart);
    return {
      thought: thoughtContent,
      response: responseBefore,
      isStreaming: true
    };
  }

  // Case 4: No tags at all
  return { thought: "", response: text };
}

interface ReasoningBlockProps {
  thought: string;
  duration?: number;
  isStreaming: boolean;
  isInitialOpen?: boolean;
}

function ReasoningBlock({ thought, duration, isStreaming, isInitialOpen = true }: ReasoningBlockProps) {
  const [isOpen, setIsOpen] = useState(isInitialOpen);

  useEffect(() => {
    if (isStreaming) setIsOpen(true);
  }, [isStreaming]);

  return (
    <div className={`zg-reasoning ${isOpen ? "open" : ""} ${isStreaming ? "streaming" : ""}`} style={{ marginBottom: "16px", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
      <button
        className="zg-reasoning-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Hide thinking process" : "Show thinking process"}
        style={{ background: "#f9fafb", width: "100%", textAlign: "left" }}
      >
        <div className="zg-reasoning-icon">
          {isStreaming ? (
            <div className="zg-reasoning-pulse" style={{ background: "#111" }} />
          ) : (
            <BrainCircuit size={15} style={{ color: "#111" }} />
          )}
        </div>
        <span className="zg-reasoning-trigger-text" style={{ color: "#111", fontWeight: 600 }}>
          {isStreaming ? "🧠 Thinking..." : "💭 Thought Process"}
        </span>
        {duration && !isStreaming && (
          <span className="zg-reasoning-duration">{duration}s</span>
        )}
        <ChevronDownIcon isOpen={isOpen} />
      </button>
      <div className={`zg-reasoning-body ${isOpen ? "open" : ""}`} style={{ maxHeight: isOpen ? "500px" : "0", overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div className="zg-reasoning-content" dir="ltr" style={{
          padding: "12px 16px",
          background: "#fff",
          fontSize: "13px",
          lineHeight: "1.6",
          color: "#4b5563",
          borderTop: "1px solid #f3f4f6"
        }}>
          {thought ? (
            <pre style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
              fontFamily: "inherit",
              background: "#f9fafb",
              padding: "8px",
              borderRadius: "6px"
            }}>{thought}</pre>
          ) : (
            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
              {isStreaming ? "Generating thoughts..." : "No thinking process recorded"}
            </span>
          )}
          {isStreaming && <span className="zg-reasoning-pulse" style={{ display: 'inline-block', marginLeft: '4px', background: "#111" }} />}
        </div>
      </div>
    </div>
  );
}

interface MessageContentProps {
  text: string;
  isError?: boolean;
  isThinking?: boolean;
}

function MessageContent({ text, isError, isThinking }: MessageContentProps) {
  // If the AI is expected to think but hasn't sent text yet, show a placeholder
  if (isThinking && !text) {
    return (
      <div className="zg-ai-content prose prose-sm max-w-none" dir="auto">
        <ReasoningBlock thought="" duration={undefined} isStreaming={true} isInitialOpen={true} />
      </div>
    );
  }

  if (!text) return null;

  const { thought, response, isStreaming = false } = parseThoughtAndResponse(text);

  const hasThinkingStart = text.toLowerCase().includes("<thinking>");
  const hasThinkingEnd = text.toLowerCase().includes("</thinking>");
  const hasThinkingTag = hasThinkingStart || hasThinkingEnd;

  const showThought = hasThinkingTag || thought !== "" || isStreaming || isThinking;

  return (
    <div className={`zg-ai-content prose prose-sm max-w-none ${isError ? "text-red-600" : ""}`} dir="auto">
      {showThought && (
        <ReasoningBlock
          thought={thought}
          duration={undefined}
          isStreaming={isStreaming}
          isInitialOpen={true}
        />
      )}

      {response && (
        <FilteredMarkdown content={response} />
      )}
      {isError && <ReactMarkdown>{text}</ReactMarkdown>}
    </div>
  );
}

// Custom component to filter thinking tags from rendered markdown
interface FilteredMarkdownProps {
  content: string;
}

function FilteredMarkdown({ content }: FilteredMarkdownProps) {
  // Aggressive cleaning of thinking tags from content
  let cleanContent = content;

  // Remove all thinking tag patterns (case insensitive, global)
  cleanContent = cleanContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
  cleanContent = cleanContent.replace(/<thinking>[\s\S]*?$/gi, "");
  cleanContent = cleanContent.replace(/^[\s\S]*?<thinking>/gi, "");
  cleanContent = cleanContent.replace(/<\/thinking>[\s\S]*/gi, "");

  // Also handle any remaining angle bracket patterns that look like thinking
  cleanContent = cleanContent.replace(/<think[\s\S]*?>/gi, "");
  cleanContent = cleanContent.replace(/<\/think[\s\S]*?>/gi, "");

  cleanContent = cleanContent.trim();

  if (!cleanContent) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const lang = match ? match[1] : "";
          if (!inline && lang === "mermaid") {
            return <MermaidChart chart={String(children).replace(/\n$/, "")} />;
          }
          return !inline ? (
            <div className="my-4 rounded-xl overflow-hidden" dir="ltr">
              <SyntaxHighlighter
                {...props}
                children={String(children).replace(/\n$/, "")}
                style={vscDarkPlus}
                language={lang || "javascript"}
                PreTag="div"
                customStyle={{ margin: 0, padding: "16px", fontSize: "13px", background: "#111" }}
              />
            </div>
          ) : (
            <code {...props} className="bg-gray-100/80 border border-gray-200 text-gray-800 px-[5px] py-[2px] rounded-[5px] text-[13px] font-mono mx-0.5" dir="ltr">
              {children}
            </code>
          );
        },
        h1: (p) => <h1 className="text-xl font-extrabold mt-8 mb-4 text-gray-900 tracking-tight" {...p} />,
        h2: (p) => <h2 className="text-lg font-bold mt-7 mb-3 text-gray-900 tracking-tight" {...p} />,
        h3: (p) => <h3 className="text-base font-bold mt-6 mb-2 text-gray-900 tracking-tight" {...p} />,
        p: (p) => <p className="my-2.5 leading-relaxed text-[14.5px] text-gray-700" {...p} />,
        ul: (p) => <ul className="list-disc list-inside my-4 space-y-1.5 text-[14.5px] text-gray-700" {...p} />,
        ol: (p) => <ol className="list-decimal list-inside my-4 space-y-1.5 text-[14.5px] text-gray-700" {...p} />,
        a: (p) => <a className="text-blue-600 hover:text-blue-800 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...p} />,
        blockquote: (p) => <blockquote className="border-r-4 border-gray-300 pr-4 mr-0 my-4 italic text-gray-600 bg-gray-50 p-3 rounded-l-lg" {...p} />,
      }}
    >
      {cleanContent}
    </ReactMarkdown>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface Credits {
  balance?: number;
  used?: number;
}

export default function ZetsuGuideAIPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const [credits, setCredits] = useState<Credits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isDeepReasoning, setIsDeepReasoning] = useState<boolean>(false);
  const [isSubAgent, setIsSubAgent] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showApiSettings, setShowApiSettings] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [customModel, setCustomModel] = useState<string>("google/gemini-2.0-flash-exp:free");
  const [apiKeyError, setApiKeyError] = useState<string>("");
  const [apiKeySuccess, setApiKeySuccess] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isThinking]);

  useEffect(() => {
    if (isAuthenticated()) {
      loadCredits();
      loadConversations();
    }
  }, []);

  async function loadCredits() {
    if (!user?.email) return;
    setCreditsLoading(true);
    try {
      const { data } = await supabase
        .from("zetsuguide_credits")
        .select("credits")
        .eq("user_email", user.email.toLowerCase())
        .maybeSingle();
      setCredits({ balance: data?.credits ?? 5 });
    } catch { setCredits({ balance: 5 }); }
    finally { setCreditsLoading(false); }
  }

  async function loadConversations() {
    if (!user?.email) return;
    setIsLoadingHistory(true);
    try {
      const { data } = await supabase
        .from("zetsuguide_conversations")
        .select("id, title, updated_at")
        .eq("user_email", user.email.toLowerCase())
        .order("updated_at", { ascending: false });
      setConversations(data || []);
    } catch { }
    setIsLoadingHistory(false);
  }

  const handleSend = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isThinking) return;
    if (!isAuthenticated()) { router.push("/auth"); return; }
    if (credits !== null && credits.balance !== undefined && credits.balance <= 0) {
      toast.error("You're out of credits! Please top up to continue.");
      return;
    }

    const query = input.trim();
    const userMsg: ChatMessage = { id: Date.now(), role: "user", content: query, timestamp: new Date().toISOString() };
    const assistantMsg: ChatMessage = { id: Date.now() + 1, role: "assistant", content: "", timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg, assistantMsg];

    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsThinking(true);

    try {
      // ── Smart Search: Fetch guides from Supabase for AI context ──
      let guidesContext = "";
      try {
        const { data: guides } = await supabase
          .from("guides")
          .select("id, title, slug, markdown, keywords, created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(50);

        if (guides && guides.length > 0) {
          guidesContext = guides.map((g: { id: string | number; title: string; slug: string; markdown: string | null; keywords: string[] | null; created_at: string }) =>
            `## ${g.title}\nSlug: ${g.slug}\nKeywords: ${(g.keywords || []).join(", ")}\nContent: ${(g.markdown || "").substring(0, 500)}\nLink: /guide/${g.slug}`
          ).join("\n\n---\n\n");
        }
      } catch (err) {
        console.warn("Failed to fetch guides for AI context:", err);
      }

      // Build messages payload with guides context injected as system message
      const contextSystemMessage = guidesContext
        ? {
          role: "system",
          content: `You are ZetsuGuide AI, a technical expert for the ZetsuGuide platform.

KNOWLEDGE BASE:
${guidesContext}

🧠 DEEP THINKING INSTRUCTIONS:
- START your response IMMEDIATELY with the <thinking> tag. NEVER omit it.
- Your thinking should be DETAILED and thorough (200-500 words minimum)
- Think about:
  * What is the user really asking?
  * What context do they need?
  * Which guides from our knowledge base are relevant?
  * What's the best structure for explaining this?
  * What examples would help?
- Make the user AWARE you're thinking by showing the full reasoning process inside the tags

📝 RESPONSE INSTRUCTIONS:
- AFTER </thinking>, give a concise, professional answer
- If the answer is in our guides, cite it: **📖 Guide:** [Title](/guide/slug)
- Keep response under 500 words
- Use Markdown for formatting
- Be friendly and professional

⚠️ CRITICAL: You MUST use <thinking>...</thinking> tags. Your response will be REJECTED if you don't wrap your thinking process in these exact tags. Start with <thinking> and end with </thinking>.`
        }
        : {
          role: "system",
          content: `You are ZetsuGuide AI, a technical expert assistant.

🧠 DEEP THINKING INSTRUCTIONS:
- START your response IMMEDIATELY with the <thinking> tag. NEVER omit it.
- Your thinking should be DETAILED and thorough (200-500 words minimum)
- Think about:
  * What is the user asking exactly?
  * What knowledge do they need?
  * What's the best way to explain this?
  * What examples or analogies would help?
  * Are there important nuances to cover?
- Make the user SEE your thinking process inside the tags

📝 RESPONSE INSTRUCTIONS:
- AFTER </thinking>, give a clear, professional answer
- Keep response under 500 words
- Use Markdown for formatting
- Be friendly, helpful, and professional

⚠️ CRITICAL: You MUST use <thinking>...</thinking> tags. Your response will be REJECTED if you don't wrap your thinking process in these exact tags. Start with <thinking> and end with </thinking>.`
        };

      const messagesPayload = [contextSystemMessage, ...newMessages.slice(-8)];

      // If it's the first message, ask for brief response
      const isFirstMessage = messages.length === 0;
      const modelToUse = customModel || "google/gemini-2.0-flash-exp:free";
      const bodyPayload = {
        model: modelToUse,
        messages: isFirstMessage
          ? [
            contextSystemMessage,
            {
              role: "user",
              content: `${query}\n\n(Note: This is the first message. After thinking, give a SHORT and friendly greeting response - max 100 words. Be welcoming but don't give long explanations yet.)`
            }
          ]
          : messagesPayload,
        userEmail: user?.email,
        userId: user?.id,
        isDeepReasoning,
        isSubAgentMode: isSubAgent,
        skipCreditDeduction: true,
        stream: true,
        ...(customApiKey && { apiKey: customApiKey }),
      };

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errorMessage = "The AI service is temporarily unavailable. Please try again.";

        try {
          const errorData = JSON.parse(errText);
          if (errorData.error?.message?.includes("503") || errorData.error?.message?.includes("unavailable")) {
            errorMessage = "⚠️ The AI service is currently unavailable (503 Service Unavailable).\n\nThis usually means the server is busy or the model is at capacity.\n\n💡 Try using your own API key:\n1. Click the ⚙️ settings icon in the top right\n2. Enter your API key\n3. Select a different model if needed\n4. Try again";
          }
        } catch (e: unknown) {
          // Not JSON, use default message
        }

        throw new Error(errorMessage);
      }

      // Check Content-Type to determine if response is streaming or JSON
      const contentType = response.headers.get("Content-Type") || "";
      const isStreaming = contentType.includes("text/event-stream");

      let aiContent = "";
      let rawContent = ""; // لتخزين النص الخام كاملاً

      if (isStreaming) {
        // Handle SSE streaming response
        console.log("📊 Receiving STREAMING response from AI...");

        // Streaming reader setup
        if (!response.body) {
          throw new Error("Response body is null");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "token" || data.type === "content") {
                  const content = data.content;
                  rawContent += content;

                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = rawContent;
                    return newMsgs;
                  });
                }
              } catch (e: unknown) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      } else {
        // Handle regular JSON response (non-streaming)
        console.log("📦 Receiving JSON response from AI...");

        try {
          const jsonResponse = await response.json();
          aiContent = jsonResponse.content || jsonResponse.message || "I received your message but couldn't generate a response. Please try again.";
          rawContent = aiContent;

          // Update the already added assistant message
          setMessages((prev) => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = rawContent;
            return newMsgs;
          });
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError);
          aiContent = "I received your message but couldn't parse the response. Please try again.";
          // Update the already added assistant message
          setMessages((prev) => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = aiContent;
            return newMsgs;
          });
        }
      }

      if (!rawContent && !aiContent) {
        aiContent = "I received your message but couldn't generate a response. Please try again.";
        setMessages((prev) => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = aiContent;
          return newMsgs;
        });
      }

      const finalAiContent = rawContent || aiContent;

      // Prepare final messages for saving
      // Note: For streaming, we already added an empty message. For non-streaming, we already added the complete message.
      // In both cases, the latest message already contains the AI content
      const finalMessages = messages.length > 0 && messages[messages.length - 1].role === "assistant"
        ? messages  // Use current messages state which already has the AI response
        : [...newMessages, { id: Date.now() + 2, role: "assistant", content: finalAiContent, timestamp: new Date().toISOString() } as ChatMessage];  // Fallback

      // Deduct credit
      const creditBalance = credits?.balance ?? 5;
      const newCredits = Math.max(0, creditBalance - 1);
      setCredits({ balance: newCredits });
      if (user?.email) {
        await supabase
          .from("zetsuguide_credits")
          .update({ credits: newCredits })
          .eq("user_email", user.email.toLowerCase());
      }

      // Save conversation
      await saveConversation(finalMessages);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.content = errorMsg;
        }
        return newMsgs;
      });
      toast.error(errorMsg);
    } finally {
      setIsThinking(false);
    }
  };

  async function saveConversation(msgs: ChatMessage[]): Promise<void> {
    if (!user?.email) return;
    try {
      const title = msgs.find(m => m.role === "user")?.content?.substring(0, 50) || "New Chat";
      if (!currentConvId) {
        const { data } = await supabase
          .from("zetsuguide_conversations")
          .insert({ user_email: user.email.toLowerCase(), title, messages: msgs, updated_at: new Date().toISOString() })
          .select()
          .single();
        if (data) setCurrentConvId(data.id);
      } else {
        await supabase
          .from("zetsuguide_conversations")
          .update({ messages: msgs, updated_at: new Date().toISOString() })
          .eq("id", currentConvId);
      }
      loadConversations();
    } catch { }
  }

  const startNewChat = (): void => {
    setMessages([]);
    setCurrentConvId(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const loadConversation = async (conv: Conversation): Promise<void> => {
    try {
      const { data } = await supabase
        .from("zetsuguide_conversations")
        .select("messages")
        .eq("id", conv.id)
        .single();
      if (data?.messages) {
        const typedMessages: ChatMessage[] = (data.messages || []).map((msg: any) => ({
          id: msg.id || Date.now(),
          role: msg.role || 'assistant',
          content: msg.content || '',
          timestamp: msg.timestamp || new Date().toISOString(),
          type: msg.type
        }));
        setMessages(typedMessages);
        setCurrentConvId(conv.id);
      }
    } catch { toast.error("Failed to load conversation."); }
  };

  const deleteConversation = async (e: React.MouseEvent<HTMLButtonElement>, convId: string): Promise<void> => {
    e.stopPropagation();
    try {
      await supabase.from("zetsuguide_conversations").delete().eq("id", convId);
      if (currentConvId === convId) startNewChat();
      loadConversations();
    } catch { toast.error("Failed to delete."); }
  };

  const copyMessage = (text: string, idx: number): void => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    });
  };

  const retryLastMessage = () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (lastUser) {
      setMessages(prev => prev.slice(0, -1));
      setInput(lastUser.content);
      textareaRef.current?.focus();
    }
  };

  const auth = isAuthenticated();

  // Reactive mobile detection
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="zg-page">
        {/* ── Mobile overlay ── */}
        {showSidebar && isMobile && (
          <div
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 29,
            }}
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={[
          "zg-sidebar",
          !showSidebar ? "collapsed" : "",
          showSidebar && isMobile ? "mobile-open" : "",
        ].filter(Boolean).join(" ")}>
          <div className="zg-sidebar-header">
            <Link href="/" className="zg-logo">
              <div className="zg-logo-icon">
                <Bot size={16} />
              </div>
              ZetsuGuide
              <span className="zg-logo-badge">AI</span>
            </Link>
          </div>

          <div style={{ padding: "0 12px" }}>
            <button className="zg-new-chat-btn" onClick={startNewChat}>
              <SquarePen size={15} />
              New Chat
            </button>
          </div>

          <div className="zg-history-section">
            <div className="zg-history-label">Recent</div>
            {isLoadingHistory ? (
              <div style={{ padding: "16px", display: "flex", gap: 6, alignItems: "center" }}>
                <div className="zg-dot" /><div className="zg-dot" /><div className="zg-dot" />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Loading...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: "24px 12px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
                No conversations yet.<br />Start chatting below!
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`zg-history-item${currentConvId === conv.id ? " active" : ""}`}
                  onClick={() => loadConversation(conv)}
                >
                  <div className="zg-history-item-icon">
                    <MessageSquareIcon size={13} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="zg-history-item-text">{conv.title}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{formatDate(conv.updated_at)}</div>
                  </div>
                  <button className="zg-history-item-del" onClick={(e: any) => deleteConversation(e, conv.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {auth && (
            <div className="zg-sidebar-footer">
              <div className="zg-user-row">
                <div className="zg-avatar">{getInitials(user?.email ?? null)}</div>
                <div className="zg-user-info">
                  <div className="zg-user-name">{user?.email?.split("@")[0]}</div>
                  <div className="zg-credits-badge">
                    <Zap size={11} style={{ color: "#f59e0b" }} />
                    {creditsLoading ? "..." : credits?.balance ?? 0} credits
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <div className="zg-main">
          {/* Topbar */}
          <div className="zg-topbar">
            <button
              className="zg-icon-btn"
              onClick={() => setShowSidebar(v => !v)}
              title={showSidebar ? "Close sidebar" : "Open sidebar"}
              style={{ flexShrink: 0 }}
            >
              {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
            <span className="zg-topbar-title">
              {currentConvId
                ? conversations.find(c => c.id === currentConvId)?.title || "Chat"
                : "New Conversation"}
            </span>
            <button className="zg-icon-btn" onClick={startNewChat} title="New chat">
              <SquarePen size={16} />
            </button>
            <button
              className="zg-icon-btn"
              onClick={() => setShowApiSettings(!showApiSettings)}
              title="API Settings"
              style={{ color: showApiSettings ? "#111" : "#6b7280" }}
            >
              <Settings2 size={16} />
            </button>
          </div>

          {/* API Settings Panel */}
          {showApiSettings && (
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e5e7eb",
              background: "#fafafa"
            }}>
              <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#111" }}>
                  API Settings
                </h3>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <input
                    type="password"
                    placeholder="Enter your API Key (optional)"
                    value={customApiKey}
                    onChange={(e: any) => { setCustomApiKey(e.target.value); setApiKeyError(""); setApiKeySuccess(false); }}
                    style={{
                      flex: 1,
                      minWidth: "200px",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "13px"
                    }}
                  />
                  <select
                    value={customModel}
                    onChange={(e: any) => setCustomModel(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: "#fff",
                      minWidth: "180px"
                    }}
                  >
                    <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
                    <option value="google/gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="openai/gpt-4o">GPT-4o</option>
                    <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                    <option value="mistralai/mixtral-8x7b-instruct">Mixtral 8x7B</option>
                  </select>
                </div>
                {apiKeyError && (
                  <div style={{ color: "#ef4444", fontSize: "12px", marginBottom: "8px" }}>{apiKeyError}</div>
                )}
                {apiKeySuccess && (
                  <div style={{ color: "#10b981", fontSize: "12px", marginBottom: "8px" }}>API Key saved successfully!</div>
                )}
                <div style={{ fontSize: "11px", color: "#6b7280" }}>
                  💡 If the default API is unavailable, enter your own API key. Your key will be used instead of the default.
                </div>
              </div>
            </div>
          )}

          {/* Chat Canvas */}
          <div className="zg-chat-canvas">
            {!auth ? (
              <div className="zg-login-banner">
                <div className="zg-login-icon"><Bot size={26} /></div>
                <div className="zg-login-title">Sign in to get started</div>
                <div className="zg-login-sub">
                  ZetsuGuide AI is available exclusively for registered users. Log in to access your AI-powered coding assistant.
                </div>
                <button className="zg-login-btn" onClick={() => router.push("/auth")}>
                  Sign in
                </button>
              </div>
            ) : messages.length === 0 && !isThinking ? (
              <div className="zg-empty">
                <div className="zg-empty-icon"><Sparkles size={24} /></div>
                <div className="zg-empty-title">What can I help you with?</div>
                <div className="zg-empty-subtitle">
                  Expert programming help, guide creation, and technical troubleshooting — all in one place.
                </div>
                <div className="zg-suggestions-grid">
                  {[
                    "Optimize this React component for performance",
                    "Explain Supabase Row Level Security policies",
                    "Create a clean authentication flow in Next.js",
                    "Debug my Tailwind CSS responsive layout",
                  ].map((hint, i) => (
                    <button
                      key={i}
                      className="zg-suggestion-card"
                      onClick={() => {
                        setInput(hint);
                        textareaRef.current?.focus();
                      }}
                    >
                      <span>{hint}</span>
                      <ArrowRight size={14} className="zg-sc-arrow" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="zg-messages-inner">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`zg-msg-row${msg.role === "user" ? " zg-msg-user" : " zg-msg-ai"}`}>
                    {msg.role === "user" ? (
                      <div className="zg-user-bubble" dir="auto">{msg.content}</div>
                    ) : (
                      <div className="zg-ai-row">
                        <div className="zg-ai-avatar"><Bot size={16} /></div>
                        <div className="zg-ai-body">
                          <div className="zg-ai-name">ZetsuGuide AI</div>
                          <MessageContent text={msg.content} isThinking={idx === messages.length - 1 && isThinking} />
                          {false && null}
                          {msg.role === 'assistant' && (
                            <div className="zg-ai-actions">
                              <button
                                className="zg-action-btn"
                                onClick={() => copyMessage(msg.content, idx)}
                              >
                                {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                                {copiedIdx === idx ? "Copied" : "Copy"}
                              </button>
                              <button className="zg-action-btn" onClick={retryLastMessage}>
                                <RefreshCw size={12} /> Retry
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Thinking indicator handled inside MessageContent via parseThoughtAndResponse */}

                <style>{`
                  @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.2); }
                  }
                `}</style>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {auth && (
            <div className="zg-input-area">
              <div className="zg-input-shell">
                {credits !== null && credits.balance !== undefined && credits.balance <= 0 && (
                  <div className="zg-no-credits">
                    ⚡ You have no credits left. Please purchase more to continue chatting.
                  </div>
                )}
                <form onSubmit={handleSend}>
                  <div className="zg-input-box">
                    <textarea
                      ref={textareaRef}
                      className="zg-textarea"
                      placeholder="Message ZetsuGuide AI…"
                      value={input}
                      rows={1}
                      onInput={handleInput}
                      onChange={(e: any) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isThinking}
                    />
                    <div className="zg-input-footer">
                      <div className="zg-toggle-group">
                        <button
                          type="button"
                          className={`zg-toggle${isDeepReasoning ? " active" : ""}`}
                          onClick={() => { setIsDeepReasoning(!isDeepReasoning); if (!isDeepReasoning) setIsSubAgent(false); }}
                          disabled={isThinking}
                        >
                          <BrainCircuit size={12} />
                          Deep Reasoning
                        </button>
                        <button
                          type="button"
                          className={`zg-toggle${isSubAgent ? " active" : ""}`}
                          onClick={() => { setIsSubAgent(!isSubAgent); if (!isSubAgent) setIsDeepReasoning(false); }}
                          disabled={isThinking}
                        >
                          <Settings2 size={12} />
                          Sub-Agent
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="zg-send-btn"
                        disabled={!input.trim() || isThinking || (credits?.balance ?? 5) === 0}
                        title="Send"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </form>
                <div className="zg-disclaimer">
                  ZetsuGuide AI can make mistakes. Review important information carefully.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
