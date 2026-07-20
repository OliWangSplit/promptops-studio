import type { DatasetTestCase } from '../domain/dataset/types'

export interface DatasetTestCaseRepository {
  create(value: DatasetTestCase): Promise<DatasetTestCase>
  update(value: DatasetTestCase): Promise<DatasetTestCase>
  getById(id: string): Promise<DatasetTestCase | undefined>
  listByDatasetId(datasetId: string): Promise<DatasetTestCase[]>
  delete(id: string): Promise<void>
  deleteByDatasetId(datasetId: string): Promise<void>
}
