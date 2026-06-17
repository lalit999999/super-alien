# SuperAlien Feature Expansion Specification


## Overview

This specification defines the next major feature expansion phase for SuperAlien.

Goals:

1. Increase Gmail Agent capabilities
2. Introduce persistent AI chat sessions
3. Expose sync operations as agent tools
4. Improve user productivity
5. Improve long-term agent memory

---

# Phase 1 — Gmail Tool Expansion

## Objective

Current Gmail Tool Coverage:

```txt
4 / 12 Tools
Coverage: 33%
```

The agent can retrieve information but cannot perform many common inbox actions.

Users expect action-oriented commands.

Examples:

```txt
Archive all newsletters

Delete spam emails

Mark all Amazon emails as read

Show my conversation with Rahul
```

---

## New Gmail Tools

### getThread

Retrieve a complete Gmail conversation thread.

Input:

```ts
{
  threadId: string;
}
```

Output:

```ts
{
  threadId: string;
  messages: Email[];
}
```

Use Cases:

```txt
Show my conversation with Rahul

Summarize this email thread

Find decisions from this discussion
```

---

### archiveEmail

Archive a specific email.

Input:

```ts
{
  emailId: string;
}
```

Output:

```ts
{
  success: boolean;
}
```

Use Cases:

```txt
Archive this newsletter

Archive all GitHub notifications
```

---

### deleteEmail

Delete a specific email.

Input:

```ts
{
  emailId: string;
}
```

Output:

```ts
{
  success: boolean;
}
```

Use Cases:

```txt
Delete spam

Delete old promotions
```

---

### markRead

Mark email as read.

Input:

```ts
{
  emailId: string;
}
```

Output:

```ts
{
  success: boolean;
}
```

---

### markUnread

Mark email as unread.

Input:

```ts
{
  emailId: string;
}
```

Output:

```ts
{
  success: boolean;
}
```

---

## Architecture

Module:

```txt
src/modules/gmail/
```

Files:

```txt
gmail.tools.ts
gmail.service.ts
gmail.repository.ts
gmail.schema.ts
```

Rules:

* Tool Layer → Service Layer
* Service Layer → Corsair
* No direct Gmail API calls
* Use Corsair abstraction only

---

## Success Criteria

Coverage:

```txt
4 / 12
↓
9 / 12
```

All tools:

* Registered
* Tested
* Available to Agent

---

# Phase 2 — Persistent Chat System

## Objective

Current Status:

```txt
Chat Coverage = 0%
```

The application lacks persistent conversations.

Users lose context between sessions.

---

## Architecture Decision

Do NOT build:

```txt
/history
```

Build:

```txt
/chat
/chat/[sessionId]
```

Pattern:

```txt
ChatGPT
Claude
Cursor
Perplexity
```

---

## Database Models

### ChatSession

```prisma
model ChatSession {
  id String @id @default(cuid())

  userId String

  title String

  lastMessageAt DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages ChatMessage[]

  @@index([userId])
  @@index([lastMessageAt])
}
```

---

### ChatMessage

```prisma
model ChatMessage {
  id String @id @default(cuid())

  sessionId String

  role MessageRole

  content String @db.Text

  createdAt DateTime @default(now())
}
```

---

### MessageRole

```prisma
enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

---

## Pages

### /chat

New conversation page.

Layout:

```txt
Sidebar
+
Chat Window
```

---

### /chat/[sessionId]

Existing conversation page.

Load:

```txt
Last 20 Messages
```

for context injection.

---

## Chat Sidebar

Groups:

```txt
Today

Yesterday

Last 7 Days

Last 30 Days
```

---

## Chat APIs

### Create Session

```txt
POST /api/chat/session
```

---

### List Sessions

```txt
GET /api/chat/sessions
```

---

### Session Detail

```txt
GET /api/chat/session/[id]
```

---

### Delete Session

```txt
DELETE /api/chat/session/[id]
```

---

### Send Message

```txt
POST /api/chat/session/[id]/message
```

---

## Agent Context Strategy

Before every response:

```txt
Load Last 20 Messages
↓
Build Context
↓
Call Agent
```

Never load full conversation history.

---

## Success Criteria

* Session persistence
* Sidebar history
* Conversation continuation
* Delete session support
* Agent memory

---

# Phase 3 — Sync Agent Tools

## Objective

Sync infrastructure already exists.

Users and agents cannot interact with sync operations.

Expose sync functionality as agent tools.

---

## New Sync Tools

### triggerSync

Start synchronization.

Input:

```ts
{
  integration: "gmail" | "calendar";
}
```

Output:

```ts
{
  status: "started";
}
```

---

### getSyncStatus

Retrieve sync state.

Output:

```ts
{
  gmailStatus: SyncStatus;
  calendarStatus: SyncStatus;
}
```

---

### checkProgress

Retrieve sync progress.

Output:

```ts
{
  gmailProgress: number;
  calendarProgress: number;
}
```

---

## Sync Status Enum

```prisma
enum SyncStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}
```

---

## Agent Use Cases

```txt
Sync my Gmail

How much syncing is left?

Is my workspace ready?

Check sync status
```

---

## Dashboard Integration

Banner:

```txt
Preparing Workspace...

42 / 100 Emails Imported

Calendar Sync Running...
```

Do not block the user.

---

# Overall Success Criteria

Phase 1:

```txt
Gmail Coverage
33% → 75%+
```

Phase 2:

```txt
Chat Coverage
0% → 100%
```

Phase 3:

```txt
Sync Tools
0% → Complete
```

All new tools must:

* Use Zod validation
* Use Service Layer
* Use Repository Layer
* Be Agent Registered
* Be Tested
* Follow existing SuperAlien architecture
