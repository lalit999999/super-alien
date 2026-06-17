"use client";

import { useState, useEffect } from "react";

// ─── Sanitization config ───────────────────────────────────────────────────────

const FORBIDDEN_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "base",
  "meta",
  "link",
  "style",
  "svg",
  "math",
] as const;

const FORBIDDEN_ATTRS = [
  "onclick",
  "onload",
  "onerror",
  "onmouseover",
  "onmouseout",
  "onmouseenter",
  "onmouseleave",
  "onfocus",
  "onblur",
  "onchange",
  "onsubmit",
  "onreset",
  "onkeydown",
  "onkeyup",
  "onkeypress",
  "oninput",
  "onpaste",
  "ondblclick",
  "oncontextmenu",
  "onscroll",
  "onwheel",
  "onresize",
  "onabort",
  "onbeforeunload",
  "onhashchange",
  "onmessage",
  "onoffline",
  "ononline",
  "onpagehide",
  "onpageshow",
  "onpopstate",
  "onstorage",
  "onunhandledrejection",
  "onunload",
  "javascript",
] as const;

export const DOMPURIFY_CONFIG = {
  FORBID_TAGS: [...FORBIDDEN_TAGS] as string[],
  FORBID_ATTR: [...FORBIDDEN_ATTRS] as string[],
  FORCE_BODY: true as const,
  ADD_ATTR: ["target"] as string[],
  // Strip data: URIs from href/src to prevent data-URL attacks
  ALLOW_DATA_ATTR: false as const,
};

// ─── Sanitization utility (client-only) ───────────────────────────────────────

export async function sanitizeEmailHtml(html: string): Promise<string> {
  if (typeof window === "undefined") return "";
  const DOMPurify = (await import("dompurify")).default;
  const clean = DOMPurify.sanitize(html, {
    ...DOMPURIFY_CONFIG,
    FORBID_TAGS: [...DOMPURIFY_CONFIG.FORBID_TAGS],
    FORBID_ATTR: [...DOMPURIFY_CONFIG.FORBID_ATTR],
  });
  // Force all links to open in new tab
  const div = document.createElement("div");
  div.innerHTML = clean;
  div.querySelectorAll("a").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
  // Make images responsive
  div.querySelectorAll("img").forEach((img) => {
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.removeAttribute("width");
    img.removeAttribute("height");
  });
  // Make tables responsive
  div.querySelectorAll("table").forEach((table) => {
    table.style.maxWidth = "100%";
    table.style.overflowX = "auto";
    table.style.display = "block";
  });
  return div.innerHTML;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EmailRendererProps {
  html: string;
  className?: string;
}

export function EmailRenderer({ html, className = "" }: EmailRendererProps) {
  const [sanitized, setSanitized] = useState<string | null>(null);

  useEffect(() => {
    sanitizeEmailHtml(html).then(setSanitized);
  }, [html]);

  if (sanitized === null) {
    return (
      <div className="space-y-2 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded bg-ps-border"
            style={{ width: `${70 + (i % 3) * 10}%` }}
          />
        ))}
      </div>
    );
  }

  if (!sanitized) {
    return (
      <p className="py-4 text-sm text-ps-muted">No email content available.</p>
    );
  }

  return (
    <div
      className={`email-body overflow-x-auto text-sm leading-relaxed text-ps-text ${className}`}
      // Safe: html has been sanitized by DOMPurify before being stored in state
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
