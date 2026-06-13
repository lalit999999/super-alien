@AGENTS.md

# CLAUDE.md

## Project Overview

Project Name: SuperAlien

SuperAlien is an AI-powered productivity platform built on top of Gmail and Google Calendar using Corsair.

The application is NOT a Gmail clone.

The goal is to improve workflows around:

- Email management
- Calendar management
- AI-assisted actions
- Agent-driven automation
- Smart search
- Productivity workflows

Core integrations:

- Gmail via Corsair
- Google Calendar via Corsair
- AI Provider (OpenAI/Gemini)
- Clerk Authentication
- PostgreSQL + Prisma

---

# Tech Stack

Frontend:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn UI

Backend:

- Next.js Route Handlers

Database:

- PostgreSQL
- Prisma ORM

Authentication:

- Clerk

State Management:

- TanStack Query
- Zustand

Validation:

- Zod

AI:

- OpenAI or Gemini

Integrations:

- Corsair

---

# Architecture Principles

Follow these rules strictly.

## Rule 1

Never place business logic inside route handlers.

Bad:

route.ts
→ validation
→ database
→ business logic

Good:

route.ts
→ controller
→ service
→ repository

---

## Rule 2

Only repositories may access Prisma.

Allowed:

gmail.repository.ts

Forbidden:

gmail.service.ts

Forbidden:

route.ts

Forbidden:

React components

---

## Rule 3

Services contain business logic.

Examples:

- Send Email
- Create Event
- Sync Inbox
- Generate AI Summary
- Execute Agent Action

Business logic belongs in services.

---

## Rule 4

Controllers handle:

- request parsing
- validation
- calling services
- returning responses

Controllers do not contain business logic.

---

## Rule 5

Feature-based architecture is mandatory.

Do not create:

- global services folder
- global repositories folder
- global controllers folder

Everything belongs to a feature module.

---

# Folder Structure

src/

app/
components/
config/
constants/
hooks/
lib/
modules/
providers/
types/
validations/

---

# Module Structure

Every module follows:

feature/

feature.controller.ts
feature.service.ts
feature.repository.ts
feature.schema.ts
feature.types.ts
feature.constants.ts
index.ts

Example:

gmail/

gmail.controller.ts
gmail.service.ts
gmail.repository.ts
gmail.schema.ts
gmail.types.ts
gmail.constants.ts
index.ts

---

# Core Modules

modules/

auth/
user/
gmail/
calendar/
corsair/
ai/
agent/
webhooks/
search/
dashboard/
shared/

---

# Authentication Rules

Authentication is managed by Clerk.

Do NOT build:

- custom login
- custom signup
- custom session handling
- password reset

Use Clerk.

Auth module responsibilities:

- current user helpers
- permissions
- user sync
- auth utilities

---

# Routing Rules

Use App Router.

Example:

app/

(auth)/
(dashboard)/

api/

---

# Protected Routes

Require authentication:

/dashboard
/inbox
/calendar
/chat
/settings

Public:

/
/sign-in
/sign-up

---

# API Design Rules

Route handlers must stay thin.

Example:

app/api/gmail/send/route.ts

Responsibilities:

- validate request
- call controller
- return response

Nothing else.

---

# Database Rules

Database ownership:

Store:

- users
- synced emails
- synced calendar events
- classifications
- agent executions
- preferences

Do NOT mirror Gmail completely.

Avoid:

- attachment tables
- header tables
- mime structures
- raw email structures

until absolutely necessary.

---

# Project File Placement Rules

## Gmail Module

Location:

src/modules/gmail/

Required files:

- gmail.controller.ts
- gmail.service.ts
- gmail.repository.ts
- gmail.schema.ts
- gmail.types.ts
- gmail.constants.ts
- index.ts

---

## Calendar Module

Location:

src/modules/calendar/

Required files:

- calendar.controller.ts
- calendar.service.ts
- calendar.repository.ts
- calendar.schema.ts
- calendar.types.ts
- calendar.constants.ts
- index.ts

---

## Corsair Module

Location:

src/modules/corsair/

Required files:

- corsair.client.ts
- corsair.service.ts
- corsair.schema.ts
- corsair.types.ts
- corsair.constants.ts
- index.ts

---

## AI Module

Location:

src/modules/ai/

Required files:

- ai.service.ts
- ai.provider.ts
- ai.schema.ts
- ai.types.ts
- ai.constants.ts

Prompts:

src/modules/ai/prompts/

---

## Agent Module

Location:

src/modules/agent/

Required files:

- agent.controller.ts
- agent.service.ts
- agent.workflow.ts
- agent.tools.ts
- agent.types.ts
- index.ts

---

## API Routes

Location:

src/app/api/

Examples:

src/app/api/gmail/
src/app/api/calendar/
src/app/api/webhooks/
src/app/api/agent/

Route handlers must remain thin.

---

## Prisma

Location:

prisma/

Files:

- schema.prisma
- seed.ts
- migrations/

---

## Shared Utilities

Location:

src/modules/shared/

Files:

- api-response.ts
- errors.ts
- pagination.ts
- constants.ts

---

## Strict Rules

Never create:

src/services/
src/controllers/
src/repositories/
src/features/
src/server/
src/domain/

Never create architecture outside the approved module structure.

Always place files inside their feature module.

Follow existing project organization before creating new folders.

# Initial Prisma Models

User

Email

CalendarEvent

EmailClassification

AgentExecution

UserPreference

No additional models without justification.

---

# AI Rules

AI is centralized.

All AI logic belongs inside:

modules/ai

Never place prompts inside:

- pages
- route handlers
- components

Prompts belong inside:

modules/ai/prompts

---

# Agent Rules

Agent logic belongs in:

modules/agent

Agent responsibilities:

- tool calling
- workflow execution
- action orchestration
- MCP integration

Do not mix agent logic with AI logic.

AI thinks.

Agent acts.

---

# Corsair Rules

Corsair is an infrastructure module.

Only:

modules/corsair

may communicate directly with Corsair APIs.

Other modules must use:

corsair.service.ts

Never call Corsair directly from:

- route handlers
- pages
- React components

---

# State Management

Use TanStack Query for:

- emails
- calendar events
- dashboard data
- user data
- search results

Use Zustand for:

- sidebar state
- command palette
- modal state
- draft email state
- chat UI state

Never store server data in Zustand.

---

# Components

components/ui

contains Shadcn components.

Do not modify Shadcn source components.

Create custom components inside:

components/

dashboard/
calendar/
inbox/
chat/
shared/

---

# Validation

All API inputs must use Zod.

Never trust request bodies.

Every endpoint requires schema validation.

---

# Environment Variables

Never access process.env directly.

Use:

config/env.ts

All environment variables must be validated.

---

# Imports

Always use absolute imports.

Use:

@/modules
@/components
@/lib

Avoid relative import chains.

Bad:

../../../../

---

# Coding Standards

Use:

- TypeScript strict mode
- Async/await
- Early returns
- Strong typing

Avoid:

- any
- duplicated logic
- large files

---

# UI Design System

Theme Name:

Stormy Morning

Primary Colors:

#384959
#6A89A7
#88BDF2
#BDDDFC

Design Inspiration:

- Linear
- Raycast
- Notion
- Superhuman

Avoid:

- Gmail clones
- Outlook clones
- overly colorful interfaces

The product should feel:

- Professional
- Fast
- AI-first
- Minimal
- Modern

---

# Before Creating New Files

Ask:

1. Does this belong to an existing module?
2. Can this be reused?
3. Does it violate the architecture?
4. Is there already a similar implementation?

Prefer extending existing modules over creating new patterns.

---

# Primary Goal

Build an AI-first workflow platform that improves Gmail and Google Calendar productivity through:

- AI assistance
- Smart prioritization
- Agent actions
- Workflow automation
- Fast search
- Clean UX

Do not build a Gmail clone.
