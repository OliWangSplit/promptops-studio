import type { Dataset } from '../domain/dataset/types'
import { toPlainSerializable, validateDataset } from '../domain/dataset/validation'
import type { DatasetListQuery, DatasetListResult, DatasetRepository } from '../repositories/dataset-repository'
import type { PromptOpsDatabase } from './promptops-db'

export class DexieDatasetRepository implements DatasetRepository {
  constructor(private readonly db: PromptOpsDatabase) {}
  async create(value: Dataset) { this.assert(value); const plain = toPlainSerializable(value); await this.db.datasets.add(plain); return toPlainSerializable(plain) }
  async update(value: Dataset) { this.assert(value); const plain = toPlainSerializable(value); await this.db.datasets.put(plain); return toPlainSerializable(plain) }
  async getById(id: string) { const value = await this.db.datasets.get(id); return value ? toPlainSerializable(value) : undefined }
  async list(query: DatasetListQuery): Promise<DatasetListResult> {
    let values = await this.db.datasets.where('workspaceId').equals(query.workspaceId).toArray()
    const search = query.search?.trim().toLocaleLowerCase()
    values = values.filter(item => (!query.status || item.status === query.status) && (!search || `${item.name} ${item.description}`.toLocaleLowerCase().includes(search)))
    const sortBy = query.sortBy ?? 'updatedAt'; const direction = query.sortDirection === 'asc' ? 1 : -1
    values.sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy])) * direction)
    const total = values.length; const limit = Math.min(Math.max(query.limit ?? 20, 1), 100); const offset = Math.max(query.offset ?? 0, 0)
    return { items: toPlainSerializable(values.slice(offset, offset + limit)), total, limit, offset }
  }
  async archive(id: string) { const value = await this.required(id); const now = new Date().toISOString(); await this.update({ ...value, status: 'archived', archivedAt: now, updatedAt: now }) }
  async restore(id: string) { const value = await this.required(id); await this.update({ ...value, status: 'active', archivedAt: undefined, updatedAt: new Date().toISOString() }) }
  async delete(id: string) { await this.db.datasets.delete(id) }
  private assert(value: Dataset) { const result = validateDataset(value); if (!result.valid) throw new Error(`${result.issues[0].path}: ${result.issues[0].message}`) }
  private async required(id: string) { const value = await this.getById(id); if (!value) throw new Error(`Dataset not found: ${id}`); return value }
}
