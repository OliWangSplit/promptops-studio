import type { EvaluationResult, EvaluationResultStatus } from '../domain/evaluation/types'

export interface EvaluationResultListQuery { evaluationRunId?: string; testCaseId?: string; invocationId?: string; status?: EvaluationResultStatus }
export interface EvaluationResultRepository {
  create(value: EvaluationResult): Promise<EvaluationResult>
  update(value: EvaluationResult): Promise<EvaluationResult>
  getById(id: string): Promise<EvaluationResult | undefined>
  list(query?: EvaluationResultListQuery): Promise<EvaluationResult[]>
  deleteByRunId(evaluationRunId: string): Promise<void>
  clear(): Promise<void>
}
