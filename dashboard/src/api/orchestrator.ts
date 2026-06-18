import type {
  ExecutionChunk, OrchestrationPlan, PlanStep, SkillExecution, SkillExecutionRequest,
} from "@/types/pm";

/**
 * The contract every orchestrator backend implements (mock or real).
 * Lives in api/ so both the consumer (OrchestratorConsole) and the
 * implementations (mock / real) depend on it without importing each other.
 */
export interface OrchestratorApi {
  /** Build the multi-skill plan from raw input. */
  planOrchestration: (req: SkillExecutionRequest) => Promise<OrchestrationPlan>;
  /** Execute one step, streaming chunks until the SkillExecution resolves. */
  streamStep: (
    planId: string,
    step: PlanStep,
    onChunk: (chunk: ExecutionChunk) => void,
    signal: AbortSignal,
    context?: string,
  ) => Promise<SkillExecution>;
}
