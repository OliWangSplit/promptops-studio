import type { EntityMetadata } from '../shared/types'
import type { PromptOutputType } from '../prompt/types'

export const DATASET_STATUSES = ['active', 'archived'] as const
export type DatasetStatus = typeof DATASET_STATUSES[number]

export interface Dataset extends EntityMetadata {
  name: string
  description: string
  status: DatasetStatus
  archivedAt?: string
}

export interface DatasetExpectedValidation {
  type?: PromptOutputType
  contains?: string[]
  notContains?: string[]
  exactMatch?: string
  exactMatchTrim?: boolean
  jsonFieldExists?: string[]
  jsonSchema?: unknown
}

export interface DatasetTestCase {
  id: string
  workspaceId: string
  datasetId: string
  name: string
  description?: string
  variables: Record<string, unknown>
  expectedOutput?: unknown
  expectedValidation?: DatasetExpectedValidation
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface DatasetImportDocument {
  schemaVersion: 1
  dataset: { name: string; description?: string }
  testCases: Array<{
    name: string
    description?: string
    variables: Record<string, unknown>
    expectedOutput?: unknown
    expectedValidation?: DatasetExpectedValidation
    tags?: string[]
  }>
}

export interface DatasetImportIssue {
  path: string
  message: string
  caseIndex?: number
  caseName?: string
}

export interface DatasetImportPreview {
  valid: boolean
  strategy: 'atomic'
  document?: DatasetImportDocument
  issues: DatasetImportIssue[]
  acceptedCaseCount: number
}
