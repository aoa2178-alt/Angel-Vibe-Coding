import { hasServerKey } from "./_lib/claude.js";
import { checkAccess, json } from "./_lib/http.js";
import { MODEL } from "./_lib/prompts.js";
import { storageKind } from "./_lib/store.js";

// Tells the page how this deployment is set up. Also doubles as the access-code check.
export function GET(request) {
  const denied = checkAccess(request);
  if (denied) return denied;
  return json({
    model: MODEL,
    claude: hasServerKey() ? "server" : "byok",
    storage: storageKind
  });
}
