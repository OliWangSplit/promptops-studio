import type { EvaluationResult } from '../domain/evaluation/types'
import { toPlainSerializable } from '../domain/dataset/validation'
import type { EvaluationResultListQuery, EvaluationResultRepository } from '../repositories/evaluation-result-repository'
import type { PromptOpsDatabase } from './promptops-db'

export class DexieEvaluationResultRepository implements EvaluationResultRepository {
  constructor(private readonly db: PromptOpsDatabase) {}
  async create(value: EvaluationResult) { const plain = toPlainSerializable(value); await this.db.evaluationResults.add(plain); return toPlainSerializable(plain) }
  async update(value: EvaluationResult) { const existing = await this.db.evaluationResults.get(value.id); if (!existing) throw new Error(`Evaluation result not found: ${value.id}`); const immutable = ['workspaceId', 'evaluationRunId', 'datasetId', 'testCaseId', 'promptId', 'promptVersionId', 'createdAt'] as const; if (immutable.some(key => existing[key] !== value[key]) || JSON.stringify(existing.testCaseSnapshot) !== JSON.stringify(value.testCaseSnapshot) || JSON.stringify(existing.validationRulesSnapshot) !== JSON.stringify(value.validationRulesSnapshot)) throw new Error('Evaluation result snapshots are immutable'); const plain = toPlainSerializable(value); await this.db.evaluationResults.put(plain); return toPlainSerializable(plain) }
  async getById(id: string) { const value = await this.db.evaluationResults.get(id); return value ? toPlainSerializable(value) : undefined }
  async list(query: EvaluationResultListQuery = {}) { const values = await this.db.evaluationResults.orderBy('createdAt').toArray(); return toPlainSerializable(values.filter(item => (!query.evaluationRunId || item.evaluationRunId === query.evaluationRunId) && (!query.testCaseId || item.testCaseId === query.testCaseId) && (!query.invocationId || item.invocationId === query.invocationId) && (!query.status || item.status === query.status))) }
  async deleteByRunId(evaluationRunId: string) { await this.db.evaluationResults.where('evaluationRunId').equals(evaluationRunId).delete() }
  async clear() { await this.db.evaluationResults.clear() }
}
