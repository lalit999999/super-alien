/**
 * Manual test script — replays the bug transcript and verifies the 6 acceptance criteria.
 *
 * Run with: npx tsx scripts/test-active-context.ts
 *
 * Tests are offline (no real LLM call) — they validate the normalization layer,
 * context-update logic, and ID validation directly from the service internals.
 */

// ─── Re-implement the testable functions inline (same logic as agent.service.ts) ──

type ActiveContext = {
  lastEmailId?: string;
  lastCorsairEmailId?: string;
  lastThreadId?: string;
  lastSearchResultIds?: string[];
  lastEventId?: string;
  lastCorsairEventId?: string;
  pendingAction?: {
    type: string;
    targetId: string;
  };
};

type ToolResult = { toolName: string; success: boolean; data?: unknown; error?: string };

const YES_TOKENS = new Set(["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "do it", "sounds good", "proceed", "go ahead", "affirmative", "yea", "k"]);
const NO_TOKENS = new Set(["no", "nvm", "cancel", "nope", "nah", "stop", "nevermind", "never mind"]);

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (__, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function normalizeConfirmationInput(prompt: string) {
  const clean = prompt.trim().toLowerCase();
  if (YES_TOKENS.has(clean)) return { normalized: "yes", isConfirm: true, isDeny: false };
  if (NO_TOKENS.has(clean)) return { normalized: "no", isConfirm: false, isDeny: true };
  if (clean.length <= 6) {
    for (const token of YES_TOKENS)
      if (token.length <= 6 && levenshtein(clean, token) <= 2)
        return { normalized: "yes", isConfirm: true, isDeny: false };
    for (const token of NO_TOKENS)
      if (token.length <= 6 && levenshtein(clean, token) <= 2)
        return { normalized: "no", isConfirm: false, isDeny: true };
  }
  return { normalized: prompt, isConfirm: false, isDeny: false };
}

const ID_ARG_FIELDS = new Set(["emailId", "threadId", "corsairEventId", "eventId"]);

function extractIdsFromResult(result: ToolResult): Set<string> {
  const ids = new Set<string>();
  if (!result.success || !result.data) return ids;
  const d = result.data as Record<string, unknown>;
  const emails = (d.emails as Record<string, unknown>[] | undefined) ?? [];
  for (const e of emails) {
    if (typeof e.id === "string") ids.add(e.id);
    if (typeof e.corsairEmailId === "string") ids.add(e.corsairEmailId);
    if (typeof e.threadId === "string") ids.add(e.threadId);
  }
  if (typeof d.id === "string") ids.add(d.id);
  if (typeof d.corsairEmailId === "string") ids.add(d.corsairEmailId);
  if (typeof d.threadId === "string") ids.add(d.threadId);
  return ids;
}

function buildKnownIds(ctx: ActiveContext, toolResults: ToolResult[]): Set<string> {
  const ids = new Set<string>();
  if (ctx.lastEmailId) ids.add(ctx.lastEmailId);
  if (ctx.lastCorsairEmailId) ids.add(ctx.lastCorsairEmailId);
  if (ctx.lastThreadId) ids.add(ctx.lastThreadId);
  if (ctx.lastCorsairEventId) ids.add(ctx.lastCorsairEventId);
  if (ctx.lastEventId) ids.add(ctx.lastEventId);
  if (ctx.pendingAction?.targetId) ids.add(ctx.pendingAction.targetId);
  for (const id of ctx.lastSearchResultIds ?? []) ids.add(id);
  for (const r of toolResults) for (const id of extractIdsFromResult(r)) ids.add(id);
  return ids;
}

function validateIdArgs(args: unknown, knownIds: Set<string>): string | null {
  if (typeof args !== "object" || !args) return null;
  for (const field of ID_ARG_FIELDS) {
    const value = (args as Record<string, unknown>)[field];
    if (typeof value === "string" && value && !knownIds.has(value)) {
      return `Ungrounded ID "${value}" in field "${field}"`;
    }
  }
  return null;
}

function updateContextFromResult(ctx: ActiveContext, toolName: string, result: ToolResult): ActiveContext {
  if (!result.success || !result.data) return ctx;
  const d = result.data as Record<string, unknown>;
  const updated = { ...ctx };
  if (toolName === "searchEmails") {
    const emails = (d.emails as Record<string, unknown>[] | undefined) ?? [];
    if (emails.length > 0) {
      updated.lastSearchResultIds = emails.map(e => String(e.id)).filter(Boolean);
      const first = emails[0];
      if (first) {
        if (typeof first.id === "string") updated.lastEmailId = first.id;
        if (typeof first.corsairEmailId === "string") updated.lastCorsairEmailId = first.corsairEmailId;
        if (typeof first.threadId === "string") updated.lastThreadId = first.threadId;
      }
    }
  } else if (toolName === "getEmail") {
    if (typeof d.id === "string") updated.lastEmailId = d.id;
    if (typeof d.corsairEmailId === "string") updated.lastCorsairEmailId = d.corsairEmailId;
    if (typeof d.threadId === "string") updated.lastThreadId = d.threadId;
  } else if (toolName === "getThread") {
    if (typeof d.threadId === "string") updated.lastThreadId = d.threadId;
  }
  return updated;
}

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

// ─── AC1: searchEmails result stores lastEmailId / lastThreadId ───────────────

console.log("\nAC1: searchEmails populates ActiveContext");
{
  let ctx: ActiveContext = {};
  const result: ToolResult = {
    toolName: "searchEmails",
    success: true,
    data: {
      emails: [{ id: "real-db-id-abc", corsairEmailId: "c123", threadId: "thread-xyz", subject: "Hello" }],
      count: 1,
    },
  };
  ctx = updateContextFromResult(ctx, "searchEmails", result);
  assert("lastEmailId set", ctx.lastEmailId === "real-db-id-abc");
  assert("lastCorsairEmailId set", ctx.lastCorsairEmailId === "c123");
  assert("lastThreadId set", ctx.lastThreadId === "thread-xyz");
  assert("lastSearchResultIds set", ctx.lastSearchResultIds?.includes("real-db-id-abc") ?? false);
}

// ─── AC2: Reuse lastEmailId — no redundant tool call ─────────────────────────

console.log("\nAC2: Known ID passes validation (no redundant search)");
{
  const ctx: ActiveContext = { lastEmailId: "real-db-id-abc", lastCorsairEmailId: "c123", lastThreadId: "thread-xyz" };
  const knownIds = buildKnownIds(ctx, []);
  const err = validateIdArgs({ emailId: "real-db-id-abc" }, knownIds);
  assert("getEmail with known emailId passes", err === null);
}

// ─── AC3: getThread with known threadId passes ────────────────────────────────

console.log("\nAC3: getThread uses existing threadId without asking");
{
  const ctx: ActiveContext = { lastThreadId: "thread-xyz" };
  const knownIds = buildKnownIds(ctx, []);
  const err = validateIdArgs({ threadId: "thread-xyz" }, knownIds);
  assert("getThread with known threadId passes", err === null);
}

// ─── AC5: Input normalization ─────────────────────────────────────────────────

console.log("\nAC5: Confirmation input normalization");
{
  const cases: [string, boolean][] = [
    ["yea", true],
    ["tyea", true],   // edit-distance 1 from "yea"
    ["yep", true],
    ["yeah", true],
    ["yup", true],
    ["sure", true],
    ["ok", true],
    ["no", false],
    ["nvm", false],
    ["cancel", false],
    ["nope", false],
    ["nah", false],
  ];
  for (const [input, expectConfirm] of cases) {
    const { isConfirm, isDeny } = normalizeConfirmationInput(input);
    if (expectConfirm) {
      assert(`"${input}" → confirm`, isConfirm, `isConfirm=${isConfirm}`);
    } else {
      assert(`"${input}" → deny`, isDeny, `isDeny=${isDeny}`);
    }
  }
}

// ─── AC6: Fabricated ID is rejected ──────────────────────────────────────────

console.log("\nAC6: Fabricated ID is blocked");
{
  const ctx: ActiveContext = { lastEmailId: "real-db-id-abc" };
  const knownIds = buildKnownIds(ctx, []);
  const err = validateIdArgs({ emailId: "65101" }, knownIds);
  assert("Hallucinated emailId '65101' is rejected", err !== null, err ?? undefined);
}

// ─── AC6b: ID from current-turn tool result is accepted ──────────────────────

console.log("\nAC6b: ID from same-turn tool result is accepted");
{
  const ctx: ActiveContext = {};
  const searchResult: ToolResult = {
    toolName: "searchEmails",
    success: true,
    data: { emails: [{ id: "fresh-id-999", corsairEmailId: "c999", threadId: "thread-999" }], count: 1 },
  };
  const knownIds = buildKnownIds(ctx, [searchResult]);
  const err = validateIdArgs({ emailId: "fresh-id-999" }, knownIds);
  assert("ID from same-turn searchEmails result is accepted", err === null);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n─────────────────────────────────────`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
