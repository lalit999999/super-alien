import { toNextJsHandler } from "corsair";
import { corsairInstance } from "@/modules/corsair";
import { CORSAIR_MANAGEMENT_BASE_PATH } from "@/modules/corsair";

// Corsair's management handler handles:
//   - OAuth redirect callbacks  (GET /api/corsair/oauth/callback)
//   - Tenant provisioning       (POST /api/corsair/tenants)
//   - Plugin connection status  (GET  /api/corsair/connection-status)
//   - Webhook registration      (handled automatically by the plugin)
//
// This route must be PUBLIC (no auth guard) because OAuth callbacks arrive
// before the user session is established in the browser.
const handler = toNextJsHandler(corsairInstance, {
  basePath: CORSAIR_MANAGEMENT_BASE_PATH,
});

export const GET = handler.GET;
export const POST = handler.POST;
