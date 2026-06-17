# SuperAlien Content Rendering Architecture Specification

## Overview

SuperAlien currently displays two very different types of content:

1. AI-generated responses
2. Email content

Both are currently rendered through a similar UI layer.

This creates several issues:

* Email formatting breaks
* Tables and rich email layouts are lost
* AI responses are difficult to scan
* Code blocks are poorly rendered
* Users cannot visually distinguish AI content from email content

The application must implement dedicated rendering pipelines for each content type.

---

# Content Types

## AI Content

Source:

```txt
Agent Responses
Summaries
Draft Suggestions
Email Analysis
Calendar Analysis
Tool Results
```

Format:

```txt
Markdown
```

Examples:

```md
# Weekly Summary

## Important Emails

- Amazon order shipped
- GitHub PR approved

### Action Items

1. Reply to Rahul
2. Schedule meeting
```

---

## Email Content

Source:

```txt
Inbox Emails
Email Threads
Draft Previews
Sent Emails
```

Format:

```txt
HTML
```

Examples:

```html
<div>
  <table>
    <tr>
      <td>Invoice</td>
    </tr>
  </table>
</div>
```

---

# Rendering Rules

## AI Responses

Render using:

```txt
react-markdown
remark-gfm
rehype-highlight
```

Features:

* Headers
* Lists
* Tables
* Links
* Code blocks
* Blockquotes
* Checklists

---

## Email Content

Render using:

```txt
Sanitized HTML Renderer
```

Examples:

```tsx
dangerouslySetInnerHTML
```

ONLY after sanitization.

Never render raw email HTML directly.

---

# Security Requirements

Before rendering email HTML:

```txt
DOMPurify
sanitize-html
```

must execute.

Remove:

```txt
script
iframe
embed
object
form
```

Remove:

```txt
onclick
onload
onerror
```

Remove all executable content.

---

# Component Architecture

Create:

```txt
src/components/renderers/

markdown-renderer.tsx
email-renderer.tsx
message-renderer.tsx
```

---

## MarkdownRenderer

Purpose:

```txt
AI Messages Only
```

Input:

```ts
{
  content: string;
}
```

Output:

```txt
Formatted Markdown
```

---

## EmailRenderer

Purpose:

```txt
Email Content Only
```

Input:

```ts
{
  html: string;
}
```

Output:

```txt
Sanitized Email HTML
```

---

## MessageRenderer

Purpose:

Automatically select renderer.

Input:

```ts
{
  type:
    | "AI"
    | "EMAIL";

  content: string;
}
```

Behavior:

```txt
AI
 ↓
MarkdownRenderer

EMAIL
 ↓
EmailRenderer
```

---

# Chat UI Improvements

## AI Messages

Style:

```txt
ChatGPT
Claude
Cursor
```

Features:

* Typography optimized
* Markdown rendering
* Syntax highlighting
* Copy code button
* Copy message button

---

## Email Messages

Style:

```txt
Gmail
Superhuman
Outlook
```

Features:

* Preserve HTML formatting
* Preserve tables
* Preserve buttons
* Preserve spacing
* Preserve email branding

---

# Inbox Improvements

Email View:

```txt
Email Header
↓
Sender
Subject
Date
↓
Email HTML Renderer
```

Never show raw HTML.

---

# Agent Tool Responses

When tools return structured data:

Example:

```json
{
  "emails": [...]
}
```

Convert into markdown before rendering.

Agent output should always be:

```txt
Markdown
```

Never HTML.

---

# Visual Differentiation

AI Response:

```txt
Surface Card
Markdown Typography
Code Blocks
```

Email:

```txt
Email Container
HTML Content
```

Users should immediately know:

"This is AI"

vs

"This is an actual email"

---

# Success Criteria

AI Responses:

✅ Render Markdown

✅ Support tables

✅ Support code blocks

✅ Support copy actions

✅ Support syntax highlighting

---

Email Content:

✅ Render sanitized HTML

✅ Preserve formatting

✅ Preserve tables

✅ Preserve email layouts

✅ Prevent XSS

---

Architecture:

✅ Separate renderers

✅ Type-safe rendering

✅ Secure rendering

✅ Reusable components

✅ Production-ready
