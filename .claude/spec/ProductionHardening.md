# SuperAlien Production Hardening Specification

## Overview

This document defines mandatory production-hardening improvements for the AI Agent system.

Goals:

* Improve reliability
* Improve validation
* Improve security
* Reduce AI costs
* Reduce latency
* Prevent sensitive data leaks

These changes must be completed before adding new agent tools.

---

# PH-001 — Generate Draft Validation

## Problem

The current `generateDraft` tool accepts:

```ts
generateDraft({})
```

When neither:

* emailId
* prompt

is provided, the system generates a generic email draft and returns success.

This behavior is incorrect because the user did not provide enough information to create a meaningful draft.

---

## Required Behavior

At least one of the following must exist:

```ts
emailId
```

OR

```ts
prompt
```

If both are missing:

```json
{
  "success": false,
  "error": "Provide either emailId or prompt"
}
```

---

## Validation Rule

Add schema refinement.

```txt
Valid:
---------
{ emailId }

{ prompt }

{ emailId, prompt }

Invalid:
---------
{}
```

---

## Expected Outcome

* No meaningless drafts
* Better agent reliability
* Better tool invocation quality

---

# PH-002 — Email Header Injection Protection

## Problem

Current email generation:

```ts
Subject: ${subject}
```

Email headers are directly interpolated.

An attacker could inject:

```txt
Subject:
Hello

Bcc: attacker@email.com
```

creating unintended headers.

---

## Required Behavior

Before constructing RFC2822 messages:

```ts
sanitizeHeader()
```

must run on:

```txt
to
subject
cc
bcc
replyTo
```

when applicable.

---

## Sanitization Rules

Remove:

```txt
\r
\n
```

Collapse whitespace.

Trim values.

---

## Expected Outcome

* No header injection
* RFC2822-safe messages
* Safer email delivery

---

# PH-003 — Date Validation

## Problem

Current schemas use:

```ts
z.string()
```

for date values.

Invalid values pass validation:

```txt
tomorrow afternoon

random text

abc123
```

and later cause failures.

---

## Affected Tools

### searchEmails

```ts
from
to
```

### getEvents

```ts
timeMin
timeMax
```

---

## Required Behavior

Only valid ISO-8601 dates accepted.

Example:

```txt
2026-06-17T10:00:00Z
```

---

## Expected Outcome

* Fewer runtime failures
* Better Prisma queries
* Predictable filtering

---

# PH-004 — AI Result Caching

## Problem

Current flow:

```txt
User Request
↓
Always Call AI
↓
Return Result
```

Repeated requests for the same email repeatedly invoke AI.

---

## Affected Services

### summarizeEmail

### classifyEmail

---

## Required Flow

```txt
Request
↓
Check Database
↓
Result Exists?
 ├─ Yes → Return Cached Result
 └─ No
      ↓
      Call AI
      ↓
      Save Result
      ↓
      Return Result
```

---

## Cache Sources

Summary Table

Classification Table

Existing AI enrichment tables.

---

## Expected Outcome

### Cost Reduction

Avoid duplicate LLM calls.

### Latency Reduction

Instant responses for already processed emails.

### Scalability

Supports large inboxes.

---

# PH-005 — Log Sanitization

## Problem

Current logs may contain:

```txt
Email Bodies
Draft Content
Message Content
Invitation Text
Tool Payloads
```

Sensitive information should never be stored in logs.

---

## Required Behavior

Before logging tool arguments:

```ts
sanitizeArgsForLog()
```

must execute.

---

## Redacted Fields

```txt
body
content
emailBody
message
invitationBody
draft
text
```

Replace with:

```txt
[REDACTED]
```

---

## Example

Input:

```json
{
  "subject": "Meeting",
  "body": "Confidential Information"
}
```

Log Output:

```json
{
  "subject": "Meeting",
  "body": "[REDACTED]"
}
```

---

## Expected Outcome

* No sensitive data leakage
* Safer production logging
* Easier compliance readiness

---

# Success Criteria

All requirements pass:

* Validation Tests
* Security Tests
* Tool Tests
* Integration Tests

The implementation is complete only when:

* Invalid drafts are rejected
* Header injection is impossible
* Invalid dates fail validation
* AI results are cached
* Sensitive fields never appear in logs
