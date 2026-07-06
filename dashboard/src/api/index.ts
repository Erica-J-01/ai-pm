import type { OrchestratorApi } from "@/api/orchestrator";
import { mockApi } from "@/api/mockOrchestrator";
import { realApi } from "@/api/realOrchestrator";
import { claudeApi, getClaudeApiKey, liveClaudeAvailable } from "@/api/claudeOrchestrator";

export { mockApi, realApi, claudeApi, getClaudeApiKey, liveClaudeAvailable };
export type { OrchestratorApi };

/** Flip to the real backend with VITE_USE_REAL_API=true; mock is the default. */
const USE_REAL = import.meta.env.VITE_USE_REAL_API === "true";

/**
 * Returns the active orchestrator. Priority order:
 *   1. Claude (only when live mode is actually available - a key AND the dev
 *      proxy; a production build has no proxy, so the key must never be used there)
 *   2. Real backend (if VITE_USE_REAL_API=true)
 *   3. Mock (default - no setup needed)
 */
export function getOrchestratorApi(): OrchestratorApi {
  if (liveClaudeAvailable()) return claudeApi;
  if (USE_REAL) return realApi;
  return mockApi;
}

/** Static singleton - used for module-level imports. Resolved at import time. */
export const orchestratorApi: OrchestratorApi = getOrchestratorApi();
