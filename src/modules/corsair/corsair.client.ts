import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { Pool } from "pg";
import { env } from "@/config/env";

// Singleton pg Pool — reused across the process lifetime.
// Next.js hot-reload in dev would otherwise leak connections on every re-import.
declare global {
  // eslint-disable-next-line no-var
  var __corsairPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __corsairInstance:
    | ReturnType<typeof buildCorsairInstance>
    | undefined;
}

function buildCorsairInstance() {
  const pool =
    globalThis.__corsairPool ??
    new Pool({ connectionString: env.DATABASE_URL });
  globalThis.__corsairPool = pool;

  return createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: pool,
    kek: env.CORSAIR_KEK,
    multiTenancy: true,
  });
}

// Singleton — build once, reuse everywhere.
export const corsairInstance =
  globalThis.__corsairInstance ?? buildCorsairInstance();

if (process.env.NODE_ENV !== "production") {
  globalThis.__corsairInstance = corsairInstance;
}
