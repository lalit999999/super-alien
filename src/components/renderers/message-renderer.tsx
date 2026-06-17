"use client";

import { MarkdownRenderer } from "./markdown-renderer";
import { EmailRenderer } from "./email-renderer";

export type MessageType = "AI" | "EMAIL";

interface MessageRendererProps {
  type: MessageType;
  content: string;
  className?: string;
}

export function MessageRenderer({ type, content, className }: MessageRendererProps) {
  if (type === "AI") {
    return <EmailRenderer html={content} className={className} />;
  }

  return <MarkdownRenderer content={content} />;
}
