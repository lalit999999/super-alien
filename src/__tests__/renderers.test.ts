// @vitest-environment jsdom

import { describe, it, expect, beforeAll } from "vitest";
import { DOMPURIFY_CONFIG } from "@/components/renderers/email-renderer";

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function sanitize(html: string): Promise<string> {
  const DOMPurify = (await import("dompurify")).default;
  return DOMPurify.sanitize(html, {
    ...DOMPURIFY_CONFIG,
    FORBID_TAGS: [...DOMPURIFY_CONFIG.FORBID_TAGS],
    FORBID_ATTR: [...DOMPURIFY_CONFIG.FORBID_ATTR],
  });
}

// ─── Security / XSS tests ─────────────────────────────────────────────────────

describe("EmailRenderer sanitization — XSS prevention", () => {
  it("strips <script> tags", async () => {
    const result = await sanitize('<script>alert("xss")</script><p>Hello</p>');
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert");
    expect(result).toContain("Hello");
  });

  it("strips inline event handlers (onclick)", async () => {
    const result = await sanitize('<a href="#" onclick="evil()">click</a>');
    expect(result).not.toContain("onclick");
    expect(result).toContain("click");
  });

  it("strips onload handlers", async () => {
    const result = await sanitize('<img src="x" onload="evil()" />');
    expect(result).not.toContain("onload");
  });

  it("strips onerror handlers", async () => {
    const result = await sanitize('<img src="bad" onerror="evil()" />');
    expect(result).not.toContain("onerror");
  });

  it("strips <iframe> tags", async () => {
    const result = await sanitize('<iframe src="https://evil.com"></iframe><p>text</p>');
    expect(result).not.toContain("<iframe");
    expect(result).not.toContain("evil.com");
    expect(result).toContain("text");
  });

  it("strips <object> tags", async () => {
    const result = await sanitize('<object data="evil.swf"></object><p>ok</p>');
    expect(result).not.toContain("<object");
    expect(result).toContain("ok");
  });

  it("strips <embed> tags", async () => {
    const result = await sanitize('<embed src="evil.swf" /><p>ok</p>');
    expect(result).not.toContain("<embed");
    expect(result).toContain("ok");
  });

  it("strips <form> tags", async () => {
    const result = await sanitize('<form action="//evil.com"><input /></form><p>ok</p>');
    expect(result).not.toContain("<form");
    expect(result).toContain("ok");
  });

  it("strips javascript: protocol in href", async () => {
    const result = await sanitize('<a href="javascript:evil()">link</a>');
    expect(result).not.toContain("javascript:");
  });

  it("strips data: URIs used for XSS", async () => {
    const result = await sanitize(
      '<a href="data:text/html,<script>evil()</script>">link</a>'
    );
    expect(result).not.toContain("data:text/html");
  });

  it("strips onmouseover handlers", async () => {
    const result = await sanitize('<p onmouseover="evil()">hover</p>');
    expect(result).not.toContain("onmouseover");
    expect(result).toContain("hover");
  });
});

// ─── Allowlist tests ───────────────────────────────────────────────────────────

describe("EmailRenderer sanitization — safe content preserved", () => {
  it("preserves <p> tags", async () => {
    const result = await sanitize("<p>Hello world</p>");
    expect(result).toContain("<p>");
    expect(result).toContain("Hello world");
  });

  it("preserves <table> tags", async () => {
    const result = await sanitize(
      "<table><tr><td>Cell</td></tr></table>"
    );
    expect(result).toContain("<table>");
    expect(result).toContain("<td>");
    expect(result).toContain("Cell");
  });

  it("preserves <a> href links", async () => {
    const result = await sanitize('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain("link");
  });

  it("preserves <img> src attributes", async () => {
    const result = await sanitize('<img src="https://example.com/img.png" alt="logo" />');
    expect(result).toContain('src="https://example.com/img.png"');
  });

  it("preserves <strong> and <em>", async () => {
    const result = await sanitize("<p><strong>Bold</strong> and <em>italic</em></p>");
    expect(result).toContain("<strong>");
    expect(result).toContain("<em>");
  });

  it("preserves nested <ul><li> lists", async () => {
    const result = await sanitize("<ul><li>Item 1</li><li>Item 2</li></ul>");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
  });

  it("preserves <div> containers", async () => {
    const result = await sanitize('<div class="email-body"><p>Content</p></div>');
    expect(result).toContain("<div");
    expect(result).toContain("Content");
  });
});

// ─── DOMPurify config shape tests ─────────────────────────────────────────────

describe("DOMPURIFY_CONFIG", () => {
  it("forbids script tag", () => {
    expect(DOMPURIFY_CONFIG.FORBID_TAGS).toContain("script");
  });

  it("forbids iframe tag", () => {
    expect(DOMPURIFY_CONFIG.FORBID_TAGS).toContain("iframe");
  });

  it("forbids object tag", () => {
    expect(DOMPURIFY_CONFIG.FORBID_TAGS).toContain("object");
  });

  it("forbids embed tag", () => {
    expect(DOMPURIFY_CONFIG.FORBID_TAGS).toContain("embed");
  });

  it("forbids form tag", () => {
    expect(DOMPURIFY_CONFIG.FORBID_TAGS).toContain("form");
  });

  it("forbids onclick attribute", () => {
    expect(DOMPURIFY_CONFIG.FORBID_ATTR).toContain("onclick");
  });

  it("forbids onload attribute", () => {
    expect(DOMPURIFY_CONFIG.FORBID_ATTR).toContain("onload");
  });

  it("forbids onerror attribute", () => {
    expect(DOMPURIFY_CONFIG.FORBID_ATTR).toContain("onerror");
  });
});

// ─── Responsive tests (config-level) ──────────────────────────────────────────

describe("EmailRenderer responsive behavior", () => {
  it("FORCE_BODY is true to wrap content consistently", () => {
    expect(DOMPURIFY_CONFIG.FORCE_BODY).toBe(true);
  });

  it("allows target attribute for new-tab links", () => {
    expect(DOMPURIFY_CONFIG.ADD_ATTR).toContain("target");
  });

  it("disables data attributes to block data: URI injection", () => {
    expect(DOMPURIFY_CONFIG.ALLOW_DATA_ATTR).toBe(false);
  });
});
