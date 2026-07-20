import type { DatasetTestCase } from '../domain/dataset/types'
import { toPlainSerializable, validateDatasetTestCase } from '../domain/dataset/validation'
import type { DatasetTestCaseRepository } from '../repositories/dataset-test-case-repository'
import type { PromptOpsDatabase } from './promptops-db'

export class DexieDatasetTestCaseRepository implements DatasetTestCaseRepository {
  constructor(private readonly db: PromptOpsDatabase) {}
  async create(value: DatasetTestCase) { this.assert(value); const plain = toPlainSerializable(value); await this.db.datasetTestCases.add(plain); return toPlainSerializable(plain) }
  async update(value: DatasetTestCase) { this.assert(value); const plain = toPlainSerializable(value); await this.db.datasetTestCases.put(plain); return toPlainSerializable(plain) }
  async getById(id: string) { const value = await this.db.datasetTestCases.get(id); return value ? toPlainSerializable(value) : undefined }
  async listByDatasetId(datasetId: string) { const values = await this.db.datasetTestCases.where('datasetId').equals(datasetId).sortBy('createdAt'); return toPlainSerializable(values) }
  async delete(id: string) { await this.db.datasetTestCases.delete(id) }
  async deleteByDatasetId(datasetId: string) { await this.db.datasetTestCases.where('datasetId').equals(datasetId).delete() }
  private assert(value: DatasetTestCase) { const result = validateDatasetTestCase(value); if (!result.valid) throw new Error(`${result.issues[0].path}: ${result.issues[0].message}`) }
}
