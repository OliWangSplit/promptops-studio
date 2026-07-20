import type { DatasetListQuery, DatasetListResult, DatasetRepository } from '../repositories/dataset-repository'
import type { DatasetTestCaseRepository } from '../repositories/dataset-test-case-repository'

export interface DatasetListItemWithCount extends DatasetListResult { testCaseCounts: Record<string, number> }

export class DatasetQueryService {
  constructor(private readonly datasets: DatasetRepository, private readonly testCases: DatasetTestCaseRepository) {}
  async list(query: DatasetListQuery): Promise<DatasetListItemWithCount> {
    const result = await this.datasets.list(query)
    const counts = await Promise.all(result.items.map(async item => [item.id, (await this.testCases.listByDatasetId(item.id)).length] as const))
    return { ...result, testCaseCounts: Object.fromEntries(counts) }
  }
  async getDetail(id: string) {
    const dataset = await this.datasets.getById(id)
    if (!dataset) return undefined
    return { dataset, testCases: await this.testCases.listByDatasetId(id) }
  }
}
