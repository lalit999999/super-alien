"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import type { Components } from "react-markdown";
import "highlight.js/styles/github-dark.css";

// ─── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [text]);

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${className}`}
      title="Copy"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Custom code block ─────────────────────────────────────────────────────────

function CodeBlock({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const isBlock = "data-block" in props;
  const lang = (className ?? "").replace("language-", "") || "text";
  const code = typeof children === "string" ? children : String(children ?? "");

  if (!isBlock) {
    return (
      <code
        className="rounded bg-ps-surface px-1.5 py-0.5 font-mono text-[0.85em] text-ps-accent"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-ps-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-medium text-white/40">{lang}</span>
        <CopyButton
          text={code}
          className="text-white/40 hover:bg-white/10 hover:text-white/80"
        />
      </div>
      <div className="overflow-x-auto">
        <code
          className={`block px-4 py-3 font-mono text-sm leading-relaxed ${className ?? ""}`}
          {...props}
        >
          {children}
        </code>
      </div>
    </div>
  );
}

// ─── Markdown components ───────────────────────────────────────────────────────

const markdownComponents: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-xl font-bold text-ps-text first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 text-lg font-semibold text-ps-text first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-ps-text first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-3 text-sm font-semibold text-ps-text first:mt-0">{children}</h4>
  ),

  // Paragraph
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed text-ps-text last:mb-0">{children}</p>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="mb-3 ml-5 list-disc space-y-1 text-ps-text marker:text-ps-accent">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1 text-ps-text marker:text-ps-accent">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-ps-accent pl-4 text-ps-secondary italic">
      {children}
    </blockquote>
  ),

  // Table
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-ps-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-ps-surface">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-ps-border">{children}</tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-ps-secondary">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-ps-text">{children}</td>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ps-accent underline underline-offset-2 hover:text-ps-accent-dark"
    >
      {children}
    </a>
  ),

  // Horizontal rule
  hr: () => <hr className="my-4 border-ps-border" />,

  // Inline code + code blocks — rehype-highlight annotates <pre><code>
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    // rehype-highlight wraps block code in <pre><code class="language-...">
    // We detect block vs inline by presence of a language class
    const isBlock = Boolean(className?.startsWith("language-"));
    if (isBlock) {
      return (
        <CodeBlock className={className} data-block {...props}>
          {children}
        </CodeBlock>
      );
    }
    return (
      <code
        className="rounded bg-ps-surface px-1.5 py-0.5 font-mono text-[0.85em] text-ps-accent"
        {...props}
      >
        {children}
      </code>
    );
  },
};

// ─── Public component ──────────────────────────────────────────────────────────

interface MarkdownRendererProps {
  content: string;
  showCopyMessage?: boolean;
}

export function MarkdownRenderer({ content, showCopyMessage = true }: MarkdownRendererProps) {
  return (
    <div className="relative group">
      <div className="prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>

      {showCopyMessage && (
        <div className="mt-2 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
          <CopyButton
            text={content}
            className="text-ps-muted hover:bg-ps-surface hover:text-ps-text"
          />
        </div>
      )}
    </div>
  );
}
