import type { Dataset, DatasetStatus } from '../domain/dataset/types'

export interface DatasetListQuery {
  workspaceId: string
  search?: string
  status?: DatasetStatus
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortDirection?: 'asc' | 'desc'
  limit?: number
  offset?: number
}
export interface DatasetListResult { items: Dataset[]; total: number; limit: number; offset: number }
export interface DatasetRepository {
  create(value: Dataset): Promise<Dataset>
  update(value: Dataset): Promise<Dataset>
  getById(id: string): Promise<Dataset | undefined>
  list(query: DatasetListQuery): Promise<DatasetListResult>
  archive(id: string): Promise<void>
  restore(id: string): Promise<void>
  delete(id: string): Promise<void>
}
