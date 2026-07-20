import { v4 as uuid } from 'uuid'
import type { IModelManager } from '../../services/model/types'
import type { DatasetRepository } from '../repositories/dataset-repository'
import type { DatasetTestCaseRepository } from '../repositories/dataset-test-case-repository'
import type { PromptRepository } from '../repositories/prompt-repository'
import type { PromptVersionRepository } from '../repositories/prompt-version-repository'
import type { ModelInvocationRepository } from '../repositories/model-invocation-repository'
import type { EvaluationRunRepository } from '../repositories/evaluation-run-repository'
import type { EvaluationResultRepository } from '../repositories/evaluation-result-repository'
import type { EvaluationPricingSnapshot, EvaluationRun } from '../domain/evaluation/types'
import { resolveEnabledModelIdentity } from './enabled-model-options'
import { validateTestCaseVariables, toPlainSerializable } from '../domain/dataset/validation'
import { evaluateDeterministically } from '../domain/evaluation/deterministic-evaluator'
import { aggregateEvaluationResults, finalEvaluationRunStatus, progressFromResults } from '../domain/evaluation/aggregation'
import { ConcurrencyQueue } from '../domain/evaluation/concurrency-queue'
import type { PromptInvocationService } from './prompt-invocation-service'

export interface StartBatchEvaluationInput {
  workspaceId: string; datasetId: string; promptId: string; promptVersionId: string
  modelConfigKey: string; providerId?: string; modelId?: string
  selectedTestCaseIds?: string[]; tag?: string
  temperature: number; maxTokens: number; concurrency: number
  pricing?: EvaluationPricingSnapshot; sourceRunId?: string
}

export class BatchEvaluationService {
  private queues = new Map<string, ConcurrencyQueue>()
  constructor(
    private datasets: DatasetRepository, private testCases: DatasetTestCaseRepository,
    private prompts: PromptRepository, private versions: PromptVersionRepository,
    private modelManager: IModelManager, private promptInvocations: PromptInvocationService,
    private invocations: ModelInvocationRepository, private runs: EvaluationRunRepository,
    private results: EvaluationResultRepository
  ) {}

  async start(input: StartBatchEvaluationInput): Promise<EvaluationRun> {
    if (!Number.isInteger(input.concurrency) || input.concurrency < 1 || input.concurrency > 10) throw new Error('Concurrency must be between 1 and 10')
    const [dataset, prompt, version, identity] = await Promise.all([
      this.datasets.getById(input.datasetId), this.prompts.getById(input.promptId), this.versions.getById(input.promptVersionId),
      resolveEnabledModelIdentity(this.modelManager, { modelConfigKey: input.modelConfigKey, providerId: input.providerId, modelId: input.modelId })
    ])
    if (!dataset || dataset.workspaceId !== input.workspaceId || dataset.status !== 'active') throw new Error('Active dataset not found')
    if (!prompt || prompt.workspaceId !== input.workspaceId || prompt.status === 'archived') throw new Error('Active prompt not found')
    if (!version || version.promptId !== prompt.id) throw new Error('Prompt version not found')
    let cases = await this.testCases.listByDatasetId(dataset.id)
    if (input.selectedTestCaseIds) { const selected = new Set(input.selectedTestCaseIds); cases = cases.filter(item => selected.has(item.id)) }
    if (input.tag) cases = cases.filter(item => item.tags?.includes(input.tag!))
    if (!cases.length) throw new Error('At least one test case is required')
    const now = new Date().toISOString(); const id = uuid()
    const run = await this.runs.create(toPlainSerializable({
      id, workspaceId: input.workspaceId, datasetId: dataset.id, promptId: prompt.id, promptVersionId: version.id,
      providerId: identity.providerId, modelId: identity.modelId, modelConfigKey: identity.modelConfigKey, status: 'queued' as const,
      configSnapshot: { dataset: { id: dataset.id, name: dataset.name }, prompt: { id: prompt.id, name: prompt.name }, promptVersion: { id: version.id, versionNumber: version.versionNumber }, model: { configKey: identity.modelConfigKey, providerId: identity.providerId, modelId: identity.modelId }, temperature: input.temperature, maxTokens: input.maxTokens, concurrency: input.concurrency, selection: { caseIds: cases.map(item => item.id), ...(input.tag ? { tag: input.tag } : {}) }, pricing: input.pricing ?? { status: 'unavailable', providerId: identity.providerId, modelId: identity.modelId, reason: 'No local pricing snapshot' } },
      totalCases: cases.length, queuedCases: cases.length, runningCases: 0, succeededCases: 0, failedCases: 0, skippedCases: 0, cancelledCases: 0, completedCases: 0, progressPercent: 0, sourceRunId: input.sourceRunId, createdAt: now
    }))
    for (const testCase of cases) await this.results.create(toPlainSerializable({ id: uuid(), workspaceId: input.workspaceId, evaluationRunId: id, datasetId: dataset.id, testCaseId: testCase.id, promptId: prompt.id, promptVersionId: version.id, status: 'pending' as const, testCaseSnapshot: { id: testCase.id, name: testCase.name, description: testCase.description, variables: testCase.variables, expectedOutput: testCase.expectedOutput, expectedValidation: testCase.expectedValidation, tags: testCase.tags ?? [] }, validationRulesSnapshot: testCase.expectedValidation, variableValidation: { valid: true, diagnostics: [], extraVariables: [] }, tokenUsage: { source: 'unavailable' as const }, cost: { currency: 'USD', source: 'unavailable' as const }, createdAt: now }))
    void this.executeRun(id).catch(async error => { const current = await this.runs.getById(id); if (current && (current.status === 'queued' || current.status === 'running')) await this.runs.update({ ...current, status: 'failed', completedAt: new Date().toISOString(), interruptionReason: error instanceof Error ? error.message : 'Evaluation failed' }) })
    return run
  }

  async executeRun(runId: string): Promise<EvaluationRun> {
    let run = await this.runs.getById(runId); if (!run) throw new Error('Evaluation run not found')
    if (run.status !== 'queued') return run
    run = await this.runs.update({ ...run, status: 'running', startedAt: new Date().toISOString() })
    const version = await this.versions.getById(run.promptVersionId); if (!version) throw new Error('Prompt version not found')
    const pending = await this.results.list({ evaluationRunId: runId, status: 'pending' }); const queue = new ConcurrencyQueue(run.configSnapshot.concurrency); this.queues.set(runId, queue)
    const refresh = async () => { const all = await this.results.list({ evaluationRunId: runId }); const current = await this.runs.getById(runId); if (current) await this.runs.update({ ...current, ...progressFromResults(all), metrics: aggregateEvaluationResults(all) }) }
    await queue.run(pending.map(result => ({ id: result.id, run: async () => {
      const variableValidation = validateTestCaseVariables(result.testCaseSnapshot as never, version.variables)
      if (!variableValidation.valid) { await this.results.update({ ...result, status: 'skipped', variableValidation, completedAt: new Date().toISOString() }); await refresh(); return }
      let running = await this.results.update({ ...result, status: 'running', variableValidation, startedAt: new Date().toISOString() }); await refresh()
      try {
        const outcome = await this.promptInvocations.run({ workspaceId: run!.workspaceId, promptId: run!.promptId, promptVersionId: run!.promptVersionId, variableValues: result.testCaseSnapshot.variables, modelOverride: { modelConfigKey: run!.modelConfigKey, providerId: run!.providerId, modelId: run!.modelId, temperature: run!.configSnapshot.temperature, maxTokens: run!.configSnapshot.maxTokens, jsonMode: version.outputType === 'json', streaming: false } })
        running = await this.results.update({ ...running, invocationId: outcome.invocation.id, status: 'succeeded', rawOutput: outcome.output, outputValidation: outcome.validation, deterministicValidation: evaluateDeterministically(outcome.output, result.validationRulesSnapshot, result.testCaseSnapshot.expectedOutput), latencyMs: outcome.invocation.latencyMs, timeToFirstTokenMs: outcome.invocation.timeToFirstTokenMs, tokenUsage: outcome.invocation.tokenUsage, cost: outcome.invocation.cost, completedAt: new Date().toISOString() })
      } catch (error) {
        const invocationId = error && typeof error === 'object' && 'invocationId' in error ? String(error.invocationId) : undefined; const invocation = invocationId ? await this.invocations.getById(invocationId) : undefined
        await this.results.update({ ...running, invocationId, status: 'failed', latencyMs: invocation?.latencyMs, timeToFirstTokenMs: invocation?.timeToFirstTokenMs, tokenUsage: invocation?.tokenUsage ?? { source: 'unavailable' }, cost: invocation?.cost ?? { currency: 'USD', source: 'unavailable' }, errorCode: invocation?.errorCode, errorType: invocation?.errorType ?? 'provider', errorMessage: invocation?.errorMessage ?? (error instanceof Error ? error.message : 'Provider request failed'), completedAt: new Date().toISOString() })
      }
      await refresh()
    } })))
    this.queues.delete(runId); const all = await this.results.list({ evaluationRunId: runId }); const current = (await this.runs.getById(runId))!; return this.runs.update({ ...current, ...progressFromResults(all), metrics: aggregateEvaluationResults(all), status: finalEvaluationRunStatus(all, current.status === 'cancelled'), completedAt: new Date().toISOString() })
  }

  async cancel(runId: string): Promise<void> { this.queues.get(runId)?.cancelPending(); const pending = await this.results.list({ evaluationRunId: runId, status: 'pending' }); for (const result of pending) await this.results.update({ ...result, status: 'cancelled', errorType: 'cancelled', errorMessage: 'Cancelled by user', completedAt: new Date().toISOString() }); const run = await this.runs.getById(runId); if (run) { const all = await this.results.list({ evaluationRunId: runId }); await this.runs.update({ ...run, ...progressFromResults(all), status: all.some(result => result.status === 'running') ? 'running' : 'cancelled', metrics: aggregateEvaluationResults(all), ...(all.some(result => result.status === 'running') ? {} : { completedAt: new Date().toISOString() }) }) } }

  async retry(runId: string, mode: 'entire' | 'failed' | 'case', caseId?: string): Promise<EvaluationRun> { const source = await this.runs.getById(runId); if (!source) throw new Error('Evaluation run not found'); const results = await this.results.list({ evaluationRunId: runId }); const ids = mode === 'entire' ? source.configSnapshot.selection.caseIds : mode === 'case' ? [caseId!].filter(Boolean) : results.filter(result => result.status === 'failed' || result.status === 'cancelled').map(result => result.testCaseId); return this.start({ workspaceId: source.workspaceId, datasetId: source.datasetId, promptId: source.promptId, promptVersionId: source.promptVersionId, modelConfigKey: source.modelConfigKey, providerId: source.providerId, modelId: source.modelId, selectedTestCaseIds: ids, temperature: source.configSnapshot.temperature, maxTokens: source.configSnapshot.maxTokens, concurrency: source.configSnapshot.concurrency, pricing: source.configSnapshot.pricing, sourceRunId: source.id }) }

  async recoverInterruptedEvaluationRuns(workspaceId?: string): Promise<number> { const active = [...(await this.runs.list({ workspaceId, status: 'queued' })).items, ...(await this.runs.list({ workspaceId, status: 'running' })).items]; let changed = 0; for (const run of active) { const results = await this.results.list({ evaluationRunId: run.id }); for (const result of results) if (result.status === 'pending' || result.status === 'running') await this.results.update({ ...result, status: result.status === 'pending' ? 'cancelled' : 'failed', errorType: 'interrupted', errorMessage: 'Interrupted by page reload', completedAt: new Date().toISOString() }); const latest = await this.results.list({ evaluationRunId: run.id }); await this.runs.update({ ...run, ...progressFromResults(latest), metrics: aggregateEvaluationResults(latest), status: 'completed_with_errors', interruptionReason: 'Interrupted by page reload', completedAt: new Date().toISOString() }); changed++ } return changed }
}
