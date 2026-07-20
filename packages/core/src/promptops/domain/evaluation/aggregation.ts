import type { EvaluationAggregateMetrics, EvaluationResult, EvaluationRunStatus } from './types'

const percentile = (values: number[], fraction: number) => values.length ? [...values].sort((a, b) => a - b)[Math.ceil(values.length * fraction) - 1] : undefined

export function aggregateEvaluationResults(results: EvaluationResult[]): EvaluationAggregateMetrics {
  const succeeded = results.filter(result => result.status === 'succeeded'), invoked = results.filter(result => result.status === 'succeeded' || result.status === 'failed')
  const validated = succeeded.filter(result => result.deterministicValidation?.score !== undefined)
  const latencies = invoked.flatMap(result => result.latencyMs === undefined ? [] : [result.latencyMs])
  const ttfts = succeeded.flatMap(result => result.timeToFirstTokenMs === undefined ? [] : [result.timeToFirstTokenMs])
  const tokenResults = invoked.filter(result => result.tokenUsage.source !== 'unavailable')
  const costResults = invoked.filter(result => result.cost.source !== 'unavailable')
  const currencies = [...new Set(costResults.map(result => result.cost.currency))]
  const costs = costResults.flatMap(result => typeof result.cost.totalCost === 'number' ? [result.cost.totalCost] : [])
  const scores = validated.map(result => result.deterministicValidation!.score!)
  return {
    totalCases: results.length, invocationSucceeded: succeeded.length, invocationFailed: results.filter(result => result.status === 'failed').length,
    skipped: results.filter(result => result.status === 'skipped').length, cancelled: results.filter(result => result.status === 'cancelled').length,
    validationPassed: validated.filter(result => result.deterministicValidation?.passed).length, validationFailed: validated.filter(result => !result.deterministicValidation?.passed).length,
    invocationSuccessRate: invoked.length ? succeeded.length / invoked.length * 100 : undefined, validationPassRate: validated.length ? validated.filter(result => result.deterministicValidation?.passed).length / validated.length * 100 : undefined,
    averageLatencyMs: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : undefined, p50LatencyMs: percentile(latencies, .5), p95LatencyMs: percentile(latencies, .95),
    averageTimeToFirstTokenMs: ttfts.length ? ttfts.reduce((a, b) => a + b, 0) / ttfts.length : undefined,
    totalInputTokens: tokenResults.reduce((sum, result) => sum + (result.tokenUsage.inputTokens ?? 0), 0), totalOutputTokens: tokenResults.reduce((sum, result) => sum + (result.tokenUsage.outputTokens ?? 0), 0), totalTokens: tokenResults.reduce((sum, result) => sum + (result.tokenUsage.totalTokens ?? 0), 0),
    availableTokenCases: tokenResults.length, unavailableTokenCases: invoked.length - tokenResults.length,
    totalCost: currencies.length === 1 && costs.length ? costs.reduce((a, b) => a + b, 0) : undefined, averageCost: currencies.length === 1 && costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : undefined,
    availableCostCases: costResults.length, unavailableCostCases: invoked.length - costResults.length, currency: currencies.length === 1 ? currencies[0] : undefined, mixedCurrencies: currencies.length > 1,
    averageDeterministicScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined, applicableScoredCases: scores.length, unscoredCases: succeeded.length - scores.length
  }
}

export function finalEvaluationRunStatus(results: EvaluationResult[], userCancelled = false): EvaluationRunStatus {
  if (userCancelled && results.every(result => result.status === 'cancelled' || result.status === 'pending')) return 'cancelled'
  return results.some(result => result.status === 'failed' || result.status === 'cancelled') ? 'completed_with_errors' : 'completed'
}

export function progressFromResults(results: EvaluationResult[]) {
  const count = (status: EvaluationResult['status']) => results.filter(result => result.status === status).length
  const completedCases = results.filter(result => !['pending', 'running'].includes(result.status)).length
  return { totalCases: results.length, queuedCases: count('pending'), runningCases: count('running'), succeededCases: count('succeeded'), failedCases: count('failed'), skippedCases: count('skipped'), cancelledCases: count('cancelled'), completedCases, progressPercent: results.length ? Math.round(completedCases / results.length * 100) : 0 }
}
