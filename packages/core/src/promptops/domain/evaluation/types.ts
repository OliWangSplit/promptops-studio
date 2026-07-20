import type { DatasetExpectedValidation } from '../dataset/types'
import type { InvocationCost, InvocationTokenUsage } from '../model-invocation/types'
import type { OutputValidationResult } from '../output-validation/types'
import type { DeterministicEvaluationResult } from './evaluator-types'

export const EVALUATION_RUN_STATUSES = ['queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled'] as const
export type EvaluationRunStatus = typeof EVALUATION_RUN_STATUSES[number]
export const EVALUATION_RESULT_STATUSES = ['pending', 'running', 'succeeded', 'failed', 'cancelled', 'skipped'] as const
export type EvaluationResultStatus = typeof EVALUATION_RESULT_STATUSES[number]

export type EvaluationPricingSnapshot =
  | { status: 'configured'; providerId: string; modelId: string; currency: string; inputPerMillion: number; outputPerMillion: number; version: string }
  | { status: 'unavailable'; providerId: string; modelId: string; reason: string }

export interface EvaluationRunConfigSnapshot {
  dataset: { id: string; name: string }
  prompt: { id: string; name: string }
  promptVersion: { id: string; versionNumber: string }
  model: { configKey: string; providerId: string; modelId: string }
  temperature: number
  maxTokens: number
  concurrency: number
  selection: { caseIds: string[]; tag?: string }
  pricing: EvaluationPricingSnapshot
}

export interface EvaluationRun {
  id: string
  workspaceId: string
  name?: string
  datasetId: string
  promptId: string
  promptVersionId: string
  providerId: string
  modelId: string
  modelConfigKey: string
  status: EvaluationRunStatus
  configSnapshot: EvaluationRunConfigSnapshot
  totalCases: number
  queuedCases?: number
  runningCases?: number
  succeededCases?: number
  failedCases?: number
  skippedCases?: number
  cancelledCases?: number
  completedCases?: number
  progressPercent?: number
  metrics?: EvaluationAggregateMetrics
  sourceRunId?: string
  interruptionReason?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface EvaluationTestCaseSnapshot {
  id: string
  name: string
  description?: string
  variables: Record<string, unknown>
  expectedOutput?: unknown
  expectedValidation?: DatasetExpectedValidation
  tags: string[]
}

export interface EvaluationResult {
  id: string
  workspaceId: string
  evaluationRunId: string
  datasetId: string
  testCaseId: string
  promptId: string
  promptVersionId: string
  invocationId?: string
  status: EvaluationResultStatus
  testCaseSnapshot: EvaluationTestCaseSnapshot
  validationRulesSnapshot?: DatasetExpectedValidation
  variableValidation: { valid: boolean; diagnostics: Array<{ code: string; variable: string; message: string }>; extraVariables: string[] }
  outputValidation?: OutputValidationResult
  deterministicValidation?: DeterministicEvaluationResult
  rawOutput?: string
  latencyMs?: number
  timeToFirstTokenMs?: number
  tokenUsage: InvocationTokenUsage
  cost: InvocationCost
  errorCode?: string
  errorType?: string
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface EvaluationAggregateMetrics {
  totalCases: number
  invocationSucceeded: number
  invocationFailed: number
  skipped: number
  cancelled: number
  validationPassed: number
  validationFailed: number
  invocationSuccessRate?: number
  validationPassRate?: number
  averageLatencyMs?: number
  p50LatencyMs?: number
  p95LatencyMs?: number
  averageTimeToFirstTokenMs?: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  availableTokenCases: number
  unavailableTokenCases: number
  totalCost?: number
  averageCost?: number
  availableCostCases: number
  unavailableCostCases: number
  currency?: string
  mixedCurrencies: boolean
  averageDeterministicScore?: number
  applicableScoredCases: number
  unscoredCases: number
}
