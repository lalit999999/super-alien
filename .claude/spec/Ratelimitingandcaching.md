# SuperAlien Caching & Rate Limiting Specification

## Overview

This specification defines the caching and rate limiting architecture for SuperAlien.

Goals:

* Reduce LLM costs
* Reduce Gmail and Calendar API latency
* Improve response times
* Prevent abuse
* Protect infrastructure
* Support future scaling

---

# Architecture

Introduce two platform services:

```txt
src/modules/cache/
src/modules/rate-limit/
```

Technology:

```txt
Redis (Upstash)
```

Redis will be used for:

* Request caching
* Context caching
* Search caching
* Rate limiting
* Session throttling

PostgreSQL will be used for:

* Persistent AI cache
* Long-term summaries
* Long-term classifications

---

# Cache Strategy

## Layer 1 — AI Cache

### Purpose

Avoid repeated LLM calls.

### Affected Services

```txt
summarizeEmail
classifyEmail
generateDraft
summarizeThread
```

### Flow

Request
↓
Cache Lookup
↓
Hit?
├─ Yes → Return Cached Result
└─ No
↓
Call AI
↓
Persist Result
↓
Return Result

### Storage

PostgreSQL

### Models

```prisma
model EmailSummary {
  id String @id @default(cuid())

  emailId String @unique

  model String

  summary String @db.Text

  createdAt DateTime @default(now())
}
```

```prisma
model EmailClassification {
  id String @id @default(cuid())

  emailId String @unique

  classification String

  confidence Float?

  createdAt DateTime @default(now())
}
```

---

## Layer 2 — Gmail Cache

### Purpose

Reduce Gmail fetch latency.

### Cache Keys

```txt
gmail:user:{userId}:email:{emailId}

gmail:user:{userId}:thread:{threadId}

gmail:user:{userId}:search:{queryHash}
```

### TTL

Email:

```txt
15 minutes
```

Thread:

```txt
15 minutes
```

Search:

```txt
5 minutes
```

---

## Layer 3 — Calendar Cache

### Purpose

Reduce event lookup latency.

### Cache Keys

```txt
calendar:user:{userId}:events:today

calendar:user:{userId}:event:{eventId}
```

### TTL

```txt
5–15 minutes
```

---

## Layer 4 — Chat Context Cache

### Purpose

Avoid repeated database reads.

### Cache Keys

```txt
chat:session:{sessionId}:messages
```

### Data

Latest 20 messages.

### TTL

```txt
10 minutes
```

---

# Rate Limiting Strategy

## User Rate Limits

### AI Chat

Free Tier

```txt
100 messages/day
```

Paid Tier

```txt
5000 messages/day
```

Redis Key:

```txt
rate:user:{userId}:chat
```

---

### Email Summaries

```txt
200/day
```

Redis Key:

```txt
rate:user:{userId}:summaries
```

---

### Draft Generation

```txt
50/day
```

Redis Key:

```txt
rate:user:{userId}:drafts
```

---

## Gmail Action Protection

Protect:

```txt
archiveEmail
deleteEmail
markRead
markUnread
sendEmail
```

Limit:

```txt
20 actions/minute
```

Redis Key:

```txt
rate:user:{userId}:gmail-actions
```

---

## API Protection

Protect:

```txt
/api/chat/*
/api/gmail/*
/api/calendar/*
/api/agent/*
```

Limit:

```txt
60 requests/minute
```

per user.

---

# Cache Module

Create:

```txt
src/modules/cache/

cache.service.ts
cache.constants.ts
cache.types.ts
cache.utils.ts
index.ts
```

Responsibilities:

* Read cache
* Write cache
* Delete cache
* TTL management
* Key generation

---

# Rate Limit Module

Create:

```txt
src/modules/rate-limit/

rate-limit.service.ts
rate-limit.constants.ts
rate-limit.types.ts
rate-limit.utils.ts
index.ts
```

Responsibilities:

* Sliding Window
* User limits
* Tier limits
* Action limits

---

# Observability

Track:

```txt
Cache Hit Rate
Cache Miss Rate
LLM Calls Saved
Average Response Time
Rate Limit Violations
```

Dashboard Metrics:

```txt
Cache Hit %
AI Cost Savings
Requests Blocked
```

---

# Security

Rate limiting must be enforced:

* Before tool execution
* Before AI calls
* Before Gmail actions
* Before Calendar actions

Users must never bypass limits.

---

# Success Criteria

Caching:

✅ AI responses cached

✅ Gmail search cached

✅ Calendar events cached

✅ Chat context cached

---

Rate Limiting:

✅ AI requests protected

✅ Gmail actions protected

✅ APIs protected

✅ User abuse prevented

---

Performance:

✅ Lower LLM costs

✅ Faster response times

✅ Lower Gmail API usage

✅ Better scalability
