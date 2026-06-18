import type { OrchestratorApi } from "@/api/orchestrator";
import { mockApi } from "@/api/mockOrchestrator";
import { realApi } from "@/api/realOrchestrator";
import { claudeApi, getClaudeApiKey } from "@/api/claudeOrchestrator";

export { mockApi, realApi, claudeApi, getClaudeApiKey };
export type { OrchestratorApi };

/** Flip to the real backend with VITE_USE_REAL_API=true; mock is the default. */
const USE_REAL = import.meta.env.VITE_USE_REAL_API === "true";

/**
 * Returns the active orchestrator. Priority order:
 *   1. Claude (if the user has added an Anthropic API key via Connected Tools)
 *   2. Real backend (if VITE_USE_REAL_API=true)
 *   3. Mock (default - no setup needed)
 */
export function getOrchestratorApi(): OrchestratorApi {
  if (getClaudeApiKey()) return claudeApi;
  if (USE_REAL) return realApi;
  return mockApi;
}

/** Static singleton - used for module-level imports. Resolved at import time. */
export const orchestratorApi: OrchestratorApi = getOrchestratorApi();
