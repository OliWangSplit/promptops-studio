import type { EvaluationRun, EvaluationRunConfigSnapshot } from '../domain/evaluation/types'
import { createPromptOpsId, toIsoDate } from '../domain/shared/types'
import { toPlainSerializable } from '../domain/dataset/validation'
import type { EvaluationResultRepository } from '../repositories/evaluation-result-repository'
import type { EvaluationRunListQuery, EvaluationRunRepository } from '../repositories/evaluation-run-repository'

export class EvaluationQueryService {
  constructor(private readonly runs: EvaluationRunRepository, private readonly results: EvaluationResultRepository) {}
  list(query: EvaluationRunListQuery = {}) { return this.runs.list(query) }
  async getDetail(id: string) { const run = await this.runs.getById(id); if (!run) return undefined; return { run, results: await this.results.list({ evaluationRunId: id }) } }
  async createRun(workspaceId: string, snapshot: EvaluationRunConfigSnapshot, name?: string): Promise<EvaluationRun> {
    if (!snapshot.model.configKey || !snapshot.model.providerId || !snapshot.model.modelId) throw new Error('Model config key, provider ID and model ID are required')
    if (!Number.isInteger(snapshot.concurrency) || snapshot.concurrency < 1 || snapshot.concurrency > 5) throw new Error('Concurrency must be between 1 and 5')
    const configSnapshot = toPlainSerializable(snapshot); const now = toIsoDate()
    return this.runs.create({ id: createPromptOpsId(), workspaceId, name: name?.trim() || undefined, datasetId: configSnapshot.dataset.id, promptId: configSnapshot.prompt.id, promptVersionId: configSnapshot.promptVersion.id, providerId: configSnapshot.model.providerId, modelId: configSnapshot.model.modelId, modelConfigKey: configSnapshot.model.configKey, status: 'queued', configSnapshot, totalCases: configSnapshot.selection.caseIds.length, createdAt: now })
  }
  async retry(runId: string, failedCaseIds?: string[]): Promise<EvaluationRun> { const source = await this.runs.getById(runId); if (!source) throw new Error(`Evaluation run not found: ${runId}`); const selection = failedCaseIds ? { ...source.configSnapshot.selection, caseIds: [...failedCaseIds] } : source.configSnapshot.selection; return this.createRun(source.workspaceId, { ...source.configSnapshot, selection }, source.name ? `${source.name} (Retry)` : undefined) }
  async deleteRun(id: string): Promise<void> { await this.results.deleteByRunId(id); await this.runs.delete(id) }
}
