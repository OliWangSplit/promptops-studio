import { describe, expect, it } from 'vitest'
import { evaluateDeterministically } from '../../../src/promptops/domain/evaluation/deterministic-evaluator'
import { ConcurrencyQueue } from '../../../src/promptops/domain/evaluation/concurrency-queue'
import { aggregateEvaluationResults, finalEvaluationRunStatus, progressFromResults } from '../../../src/promptops/domain/evaluation/aggregation'
import type { EvaluationResult } from '../../../src/promptops/domain/evaluation/types'

const result = (status: EvaluationResult['status'], extra: Partial<EvaluationResult> = {}): EvaluationResult => ({
  id: crypto.randomUUID(), workspaceId: 'w', evaluationRunId: 'r', datasetId: 'd', testCaseId: crypto.randomUUID(), promptId: 'p', promptVersionId: 'v', status,
  testCaseSnapshot: { id: 'c', name: 'case', variables: {}, tags: [] }, variableValidation: { valid: true, diagnostics: [], extraVariables: [] }, tokenUsage: { source: 'unavailable' }, cost: { source: 'unavailable', currency: 'USD' }, createdAt: new Date().toISOString(), ...extra
})

describe('Phase 4 deterministic evaluation engine', () => {
  it('evaluates keyword rules independently and rejects empty keywords', () => {
    const outcome = evaluateDeterministically('Hello safe world', { contains: ['Hello', 'missing', ''], notContains: ['forbidden'] })
    expect(outcome.passed).toBe(false)
    expect(outcome.score).toBe(50)
    expect(outcome.rules).toHaveLength(4)
  })

  it('parses original JSON, safe paths, order-independent objects and schema subset', () => {
    const outcome = evaluateDeterministically('{"customer":{"name":"Ada"},"items":[{"id":1}],"ok":true}', {
      type: 'json', jsonFieldExists: ['customer.name', 'items[0].id'], jsonSchema: { type: 'object', required: ['ok'], properties: { ok: { enum: [true] } } }
    }, { ok: true, items: [{ id: 1 }], customer: { name: 'Ada' } })
    expect(outcome.passed).toBe(true)
    expect(evaluateDeterministically('{}', { jsonFieldExists: ['__proto__.polluted'] }).passed).toBe(false)
  })

  it('reports unsupported schema keywords instead of ignoring them', () => {
    const outcome = evaluateDeterministically('{"x":1}', { jsonSchema: { type: 'object', additionalProperties: false } })
    expect(outcome.passed).toBe(false)
    expect(outcome.rules[0].diagnostics.join(' ')).toContain('unsupported')
  })

  it('does not fabricate a perfect score when no rules apply', () => {
    expect(evaluateDeterministically('anything')).toEqual({ passed: true, score: undefined, rules: [] })
  })
})

describe('Phase 4 limited concurrency queue', () => {
  it('never exceeds concurrency and continues after a task failure', async () => {
    let active = 0; let maximum = 0
    const queue = new ConcurrencyQueue(2)
    const outcomes = await queue.run(Array.from({ length: 5 }, (_, index) => ({ id: String(index), run: async () => { active++; maximum = Math.max(maximum, active); await new Promise(resolve => setTimeout(resolve, 5)); active--; if (index === 2) throw new Error('case failed'); return index } })))
    expect(maximum).toBe(2); expect(outcomes.filter(item => item.status === 'completed')).toHaveLength(4); expect(outcomes[2].status).toBe('failed')
  })

  it('marks pending tasks cancelled without unhandled rejection', async () => {
    const queue = new ConcurrencyQueue(1); queue.cancelPending()
    await expect(queue.run([{ id: 'a', run: async () => 1 }])).resolves.toEqual([{ id: 'a', status: 'cancelled' }])
    await expect(new ConcurrencyQueue(1).run([])).resolves.toEqual([])
  })
})

describe('Phase 4 aggregation', () => {
  it('separates invocation and validation rates and preserves unavailable coverage', () => {
    const rows = [
      result('succeeded', { deterministicValidation: { passed: false, score: 50, rules: [] }, latencyMs: 100, tokenUsage: { source: 'provider', inputTokens: 2, outputTokens: 3, totalTokens: 5 }, cost: { source: 'configured_price', currency: 'USD', totalCost: .01 } }),
      result('failed'), result('skipped')
    ]
    const metrics = aggregateEvaluationResults(rows)
    expect(metrics.invocationSuccessRate).toBe(50); expect(metrics.validationPassRate).toBe(0)
    expect(metrics.totalTokens).toBe(5); expect(metrics.unavailableTokenCases).toBe(1); expect(metrics.unavailableCostCases).toBe(1)
    expect(progressFromResults(rows).progressPercent).toBe(100); expect(finalEvaluationRunStatus(rows)).toBe('completed_with_errors')
  })

  it('does not sum mixed currencies', () => {
    const metrics = aggregateEvaluationResults([result('succeeded', { cost: { source: 'configured_price', currency: 'USD', totalCost: 1 } }), result('succeeded', { cost: { source: 'configured_price', currency: 'AUD', totalCost: 2 } })])
    expect(metrics.mixedCurrencies).toBe(true); expect(metrics.totalCost).toBeUndefined()
  })
})
