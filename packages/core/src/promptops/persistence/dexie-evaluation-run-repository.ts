import type { EvaluationRun } from '../domain/evaluation/types'
import { toPlainSerializable } from '../domain/dataset/validation'
import type { EvaluationRunListQuery, EvaluationRunListResult, EvaluationRunRepository } from '../repositories/evaluation-run-repository'
import type { PromptOpsDatabase } from './promptops-db'

export class DexieEvaluationRunRepository implements EvaluationRunRepository {
  constructor(private readonly db: PromptOpsDatabase) {}
  async create(value: EvaluationRun) { const plain = toPlainSerializable(value); await this.db.evaluationRuns.add(plain); return toPlainSerializable(plain) }
  async update(value: EvaluationRun) { const existing = await this.db.evaluationRuns.get(value.id); if (!existing) throw new Error(`Evaluation run not found: ${value.id}`); const immutable = ['workspaceId', 'datasetId', 'promptId', 'promptVersionId', 'providerId', 'modelId', 'modelConfigKey', 'createdAt', 'totalCases'] as const; if (immutable.some(key => existing[key] !== value[key]) || JSON.stringify(existing.configSnapshot) !== JSON.stringify(value.configSnapshot)) throw new Error('Evaluation run configuration snapshot is immutable'); const plain = toPlainSerializable(value); await this.db.evaluationRuns.put(plain); return toPlainSerializable(plain) }
  async getById(id: string) { const value = await this.db.evaluationRuns.get(id); return value ? toPlainSerializable(value) : undefined }
  async list(query: EvaluationRunListQuery = {}): Promise<EvaluationRunListResult> { let values = await this.db.evaluationRuns.orderBy('createdAt').reverse().toArray(); values = values.filter(item => (!query.workspaceId || item.workspaceId === query.workspaceId) && (!query.datasetId || item.datasetId === query.datasetId) && (!query.promptId || item.promptId === query.promptId) && (!query.status || item.status === query.status) && (!query.providerId || item.providerId === query.providerId) && (!query.modelId || item.modelId === query.modelId) && (!query.from || item.createdAt >= query.from) && (!query.to || item.createdAt <= query.to)); const total = values.length; const limit = Math.min(Math.max(query.limit ?? 20, 1), 100); const offset = Math.max(query.offset ?? 0, 0); return { items: toPlainSerializable(values.slice(offset, offset + limit)), total, limit, offset } }
  async delete(id: string) { await this.db.evaluationRuns.delete(id) }
  async clear() { await this.db.evaluationRuns.clear() }
}
