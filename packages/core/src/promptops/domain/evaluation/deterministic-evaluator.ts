import type { DatasetExpectedValidation } from '../dataset/types'
import type { DeterministicEvaluationResult, RuleEvaluationResult } from './evaluator-types'
import { evaluateJsonSchemaSubset } from './json-schema-subset'

const dangerous = new Set(['__proto__', 'prototype', 'constructor'])
const stable = (value: unknown): string => Array.isArray(value) ? `[${value.map(stable).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}` : JSON.stringify(value)

function parsePath(path: string): Array<string | number> | undefined {
  if (!path || /(?:^|\.)(?:__proto__|prototype|constructor)(?:\.|\[|$)/.test(path)) return undefined
  const parts: Array<string | number> = []; const re = /(?:^|\.)([A-Za-z_$][\w$]*)|\[(\d+)\]/g; let end = 0; let match: RegExpExecArray | null
  while ((match = re.exec(path))) { if (match.index !== end) return undefined; const part = match[1] ?? Number(match[2]); if (typeof part === 'string' && dangerous.has(part)) return undefined; parts.push(part); end = re.lastIndex }
  return end === path.length ? parts : undefined
}

function pathExists(value: unknown, path: string): boolean {
  const parts = parsePath(path); if (!parts) return false; let current = value
  for (const part of parts) { if (current === null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) return false; current = (current as Record<string | number, unknown>)[part] }
  return true
}

export function evaluateDeterministically(output: string, rules?: DatasetExpectedValidation, expectedOutput?: unknown): DeterministicEvaluationResult {
  const results: RuleEvaluationResult[] = []
  for (const expected of rules?.contains ?? []) results.push({ ruleType: 'contains', passed: expected.length > 0 && output.includes(expected), expected, actual: output, diagnostics: expected.length ? [] : ['Empty required keyword is invalid'], applicable: true })
  for (const expected of rules?.notContains ?? []) results.push({ ruleType: 'notContains', passed: expected.length > 0 && !output.includes(expected), expected, actual: output, diagnostics: expected.length ? [] : ['Empty forbidden keyword is invalid'], applicable: true })
  if (rules?.exactMatch !== undefined) { const actual = rules.exactMatchTrim ? output.trim() : output; const expected = rules.exactMatchTrim ? rules.exactMatch.trim() : rules.exactMatch; results.push({ ruleType: 'exactMatch', passed: actual === expected, expected, actual, diagnostics: [], applicable: true }) }
  let parsed: unknown; let jsonValid = false
  if (rules?.type === 'json' || rules?.jsonFieldExists?.length || rules?.jsonSchema || expectedOutput !== undefined) { try { parsed = JSON.parse(output); jsonValid = true } catch { jsonValid = false } }
  if (rules?.type === 'json') results.push({ ruleType: 'json', passed: jsonValid, actual: output, diagnostics: jsonValid ? [] : ['Output is not valid JSON'], applicable: true })
  for (const path of rules?.jsonFieldExists ?? []) results.push({ ruleType: 'jsonFieldExists', passed: jsonValid && pathExists(parsed, path), expected: path, actual: parsed, diagnostics: !parsePath(path) ? ['Unsafe or invalid JSON path'] : jsonValid ? [] : ['Output is not valid JSON'], applicable: true })
  if (rules?.jsonSchema !== undefined) results.push(jsonValid ? evaluateJsonSchemaSubset(parsed, rules.jsonSchema) : { ruleType: 'jsonSchemaSubset', passed: false, expected: rules.jsonSchema, actual: output, diagnostics: ['Output is not valid JSON'], applicable: true })
  if (expectedOutput !== undefined && expectedOutput !== '') { const passed = typeof expectedOutput === 'string' ? output === expectedOutput : jsonValid && stable(parsed) === stable(expectedOutput); results.push({ ruleType: 'expectedOutput', passed, expected: expectedOutput, actual: jsonValid ? parsed : output, diagnostics: [], applicable: true }) }
  const applicable = results.filter(result => result.applicable)
  return { passed: applicable.every(result => result.passed), score: applicable.length ? applicable.filter(result => result.passed).length / applicable.length * 100 : undefined, rules: results }
}
