import type { PromptVariable } from '../prompt/types'
import { renderPrompt } from '../prompt-rendering/renderer'
import type { Dataset, DatasetTestCase } from './types'

const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype'])

export interface DomainValidationIssue { path: string; message: string }
export interface DomainValidationResult { valid: boolean; issues: DomainValidationIssue[] }

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export const validatePlainSerializable = (value: unknown, path = '$', depth = 0): DomainValidationIssue[] => {
  if (depth > 50) return [{ path, message: 'Maximum nesting depth exceeded' }]
  if (value === undefined) return []
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return []
  if (typeof value === 'number') return Number.isFinite(value) ? [] : [{ path, message: 'Numbers must be finite' }]
  if (Array.isArray(value)) return value.flatMap((item, index) => validatePlainSerializable(item, `${path}[${index}]`, depth + 1))
  if (!isPlainObject(value)) return [{ path, message: 'Value must be plain serializable data' }]
  return Object.entries(value).flatMap(([key, item]) => unsafeKeys.has(key)
    ? [{ path: `${path}.${key}`, message: `Unsafe key is not allowed: ${key}` }]
    : validatePlainSerializable(item, `${path}.${key}`, depth + 1))
}

export const toPlainSerializable = <T>(value: T): T => {
  const issues = validatePlainSerializable(value)
  if (issues.length) throw new Error(`${issues[0].path}: ${issues[0].message}`)
  return JSON.parse(JSON.stringify(value)) as T
}

export const validateDataset = (dataset: Dataset): DomainValidationResult => {
  const issues: DomainValidationIssue[] = []
  if (!dataset.name.trim()) issues.push({ path: 'name', message: 'Dataset name is required' })
  if (!dataset.workspaceId.trim()) issues.push({ path: 'workspaceId', message: 'Workspace is required' })
  issues.push(...validatePlainSerializable(dataset))
  return { valid: issues.length === 0, issues }
}

export const validateDatasetTestCase = (testCase: DatasetTestCase): DomainValidationResult => {
  const issues: DomainValidationIssue[] = []
  if (!testCase.name.trim()) issues.push({ path: 'name', message: 'Test case name is required' })
  if (!testCase.datasetId.trim()) issues.push({ path: 'datasetId', message: 'Dataset is required' })
  if (!isPlainObject(testCase.variables)) issues.push({ path: 'variables', message: 'Variables must be a plain object' })
  issues.push(...validatePlainSerializable(testCase))
  return { valid: issues.length === 0, issues }
}

export const validateTestCaseVariables = (testCase: DatasetTestCase, variables: PromptVariable[]) => {
  const result = renderPrompt({ systemPrompt: '', userPrompt: '', variables, values: testCase.variables })
  return {
    valid: result.valid,
    diagnostics: result.diagnostics,
    extraVariables: result.unusedProvidedVariables,
    normalizedValues: result.normalizedValues,
  }
}
