import type { DatasetExpectedValidation, DatasetImportDocument, DatasetImportIssue, DatasetImportPreview } from './types'
import { isPlainObject, validatePlainSerializable } from './validation'

const stringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')

const validateRules = (value: unknown, path: string, issues: DatasetImportIssue[]): value is DatasetExpectedValidation => {
  if (!isPlainObject(value)) { issues.push({ path, message: 'Expected validation must be an object' }); return false }
  if (value.type !== undefined && !['text', 'markdown', 'json'].includes(String(value.type))) issues.push({ path: `${path}.type`, message: 'Unsupported output type' })
  for (const key of ['contains', 'notContains', 'jsonFieldExists'] as const) {
    if (value[key] !== undefined && !stringArray(value[key])) issues.push({ path: `${path}.${key}`, message: 'Value must be an array of strings' })
  }
  if (value.exactMatch !== undefined && typeof value.exactMatch !== 'string') issues.push({ path: `${path}.exactMatch`, message: 'Exact match must be a string' })
  if (value.exactMatchTrim !== undefined && typeof value.exactMatchTrim !== 'boolean') issues.push({ path: `${path}.exactMatchTrim`, message: 'Exact match trim must be a boolean' })
  return true
}

export const parseDatasetImport = (text: string): DatasetImportPreview => {
  const issues: DatasetImportIssue[] = []
  let value: unknown
  try { value = JSON.parse(text) } catch (error) {
    return { valid: false, strategy: 'atomic', issues: [{ path: '$', message: error instanceof Error ? error.message : 'Invalid JSON' }], acceptedCaseCount: 0 }
  }
  issues.push(...validatePlainSerializable(value).map(issue => {
    const match = /^\$\.testCases\[(\d+)]/.exec(issue.path)
    const caseIndex = match ? Number(match[1]) : undefined
    const candidate = caseIndex !== undefined && isPlainObject(value) && Array.isArray(value.testCases) ? value.testCases[caseIndex] : undefined
    return { ...issue, caseIndex, caseName: isPlainObject(candidate) && typeof candidate.name === 'string' ? candidate.name : undefined }
  }))
  if (!isPlainObject(value)) issues.push({ path: '$', message: 'Import root must be an object' })
  if (issues.length || !isPlainObject(value)) return { valid: false, strategy: 'atomic', issues, acceptedCaseCount: 0 }
  if (value.schemaVersion !== 1) issues.push({ path: 'schemaVersion', message: 'Only schemaVersion 1 is supported' })
  if (!isPlainObject(value.dataset)) issues.push({ path: 'dataset', message: 'Dataset must be an object' })
  else {
    if (typeof value.dataset.name !== 'string' || !value.dataset.name.trim()) issues.push({ path: 'dataset.name', message: 'Dataset name is required' })
    if (value.dataset.description !== undefined && typeof value.dataset.description !== 'string') issues.push({ path: 'dataset.description', message: 'Dataset description must be a string' })
  }
  if (!Array.isArray(value.testCases)) issues.push({ path: 'testCases', message: 'Test cases must be an array' })
  if (Array.isArray(value.testCases)) value.testCases.forEach((item, index) => {
    const base = `testCases[${index}]`; const caseName = isPlainObject(item) && typeof item.name === 'string' ? item.name : undefined
    const add = (path: string, message: string) => issues.push({ path, message, caseIndex: index, caseName })
    if (!isPlainObject(item)) { add(base, 'Test case must be an object'); return }
    if (typeof item.name !== 'string' || !item.name.trim()) add(`${base}.name`, 'Test case name is required')
    if (!isPlainObject(item.variables)) add(`${base}.variables`, 'Variables must be a plain object')
    if (item.description !== undefined && typeof item.description !== 'string') add(`${base}.description`, 'Description must be a string')
    if (item.tags !== undefined && !stringArray(item.tags)) add(`${base}.tags`, 'Tags must be an array of strings')
    if (item.expectedValidation !== undefined) validateRules(item.expectedValidation, `${base}.expectedValidation`, issues)
  })
  if (issues.length) return { valid: false, strategy: 'atomic', issues, acceptedCaseCount: 0 }
  const sourceDataset = value.dataset as Record<string, unknown>
  const sourceCases = value.testCases as Record<string, unknown>[]
  const document: DatasetImportDocument = {
    schemaVersion: 1,
    dataset: { name: String(sourceDataset.name), ...(typeof sourceDataset.description === 'string' ? { description: sourceDataset.description } : {}) },
    testCases: sourceCases.map(item => ({
      name: String(item.name),
      ...(typeof item.description === 'string' ? { description: item.description } : {}),
      variables: item.variables as Record<string, unknown>,
      ...('expectedOutput' in item ? { expectedOutput: item.expectedOutput } : {}),
      ...(isPlainObject(item.expectedValidation) ? { expectedValidation: item.expectedValidation as DatasetExpectedValidation } : {}),
      ...(stringArray(item.tags) ? { tags: item.tags } : {}),
    })),
  }
  return { valid: true, strategy: 'atomic', document, issues: [], acceptedCaseCount: document.testCases.length }
}
