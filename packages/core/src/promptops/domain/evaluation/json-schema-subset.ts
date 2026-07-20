import type { RuleEvaluationResult } from './evaluator-types'

const supported = new Set(['type', 'required', 'properties', 'items', 'enum'])

function typeMatches(value: unknown, type: string): boolean {
  if (type === 'array') return Array.isArray(value)
  if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value)
  if (type === 'integer') return Number.isInteger(value)
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value)
  if (type === 'null') return value === null
  return typeof value === type
}

export function evaluateJsonSchemaSubset(value: unknown, schema: unknown): RuleEvaluationResult {
  const diagnostics: string[] = []
  const visit = (current: unknown, node: unknown, path: string): void => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) { diagnostics.push(`${path}: schema must be an object`); return }
    const record = node as Record<string, unknown>
    for (const key of Object.keys(record)) if (!supported.has(key)) diagnostics.push(`${path}: unsupported schema keyword "${key}"`)
    if (typeof record.type === 'string' && !typeMatches(current, record.type)) { diagnostics.push(`${path}: expected type ${record.type}`); return }
    if (Array.isArray(record.enum) && !record.enum.some(item => JSON.stringify(item) === JSON.stringify(current))) diagnostics.push(`${path}: value is not in enum`)
    if (record.required !== undefined) {
      if (!Array.isArray(record.required) || !record.required.every(item => typeof item === 'string')) diagnostics.push(`${path}: required must be a string array`)
      else if (current && typeof current === 'object' && !Array.isArray(current)) for (const key of record.required) if (!Object.prototype.hasOwnProperty.call(current, key)) diagnostics.push(`${path}.${key}: required property is missing`)
    }
    if (record.properties !== undefined) {
      if (!record.properties || typeof record.properties !== 'object' || Array.isArray(record.properties)) diagnostics.push(`${path}: properties must be an object`)
      else if (current && typeof current === 'object' && !Array.isArray(current)) for (const [key, child] of Object.entries(record.properties)) if (Object.prototype.hasOwnProperty.call(current, key)) visit((current as Record<string, unknown>)[key], child, `${path}.${key}`)
    }
    if (record.items !== undefined && Array.isArray(current)) current.forEach((item, index) => visit(item, record.items, `${path}[${index}]`))
  }
  visit(value, schema, '$')
  return { ruleType: 'jsonSchemaSubset', passed: diagnostics.length === 0, expected: schema, actual: value, diagnostics, applicable: true }
}
