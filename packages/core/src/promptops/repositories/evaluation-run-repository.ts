import type { EvaluationRun, EvaluationRunStatus } from '../domain/evaluation/types'

export interface EvaluationRunListQuery {
  workspaceId?: string
  datasetId?: string
  promptId?: string
  status?: EvaluationRunStatus
  providerId?: string
  modelId?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}
export interface EvaluationRunListResult { items: EvaluationRun[]; total: number; limit: number; offset: number }
export interface EvaluationRunRepository {
  create(value: EvaluationRun): Promise<EvaluationRun>
  update(value: EvaluationRun): Promise<EvaluationRun>
  getById(id: string): Promise<EvaluationRun | undefined>
  list(query?: EvaluationRunListQuery): Promise<EvaluationRunListResult>
  delete(id: string): Promise<void>
  clear(): Promise<void>
}
