import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DatasetQueryService,
  DatasetService,
  exportDatasetDocument,
  DexieDatasetRepository,
  DexieDatasetTestCaseRepository,
  DexieEvaluationResultRepository,
  DexieEvaluationRunRepository,
  EvaluationQueryService,
  PromptOpsDatabase,
  parseDatasetImport,
  validateDatasetTestCase,
  validateTestCaseVariables,
  type Dataset,
  type DatasetTestCase,
  type EvaluationResult,
  type EvaluationRunConfigSnapshot,
  type ModelInvocation,
  type PromptOpsPrompt,
  type PromptOpsPromptVersion,
  type Workspace,
} from '../../../src'

let databases: Dexie[] = []
afterEach(async () => { await Promise.all(databases.map(db => db.delete())); databases = [] })
const openDb = () => { const db = new PromptOpsDatabase(`phase4-${crypto.randomUUID()}`); databases.push(db); return db }
const repositories = (db: PromptOpsDatabase) => {
  const datasets = new DexieDatasetRepository(db); const testCases = new DexieDatasetTestCaseRepository(db)
  return { datasets, testCases, service: new DatasetService(db, datasets, testCases), query: new DatasetQueryService(datasets, testCases) }
}

describe('Phase 4 dataset persistence', () => {
  it('supports dataset and test case CRUD, duplicate, archive, restore, query and sorting', async () => {
    const db = openDb(); const { datasets, testCases, service, query } = repositories(db)
    const first = await service.create({ workspaceId: 'w', name: 'Zulu', description: 'Last' })
    await service.create({ workspaceId: 'w', name: 'Alpha' })
    const updated = await service.update(first.id, { name: 'Zulu updated', description: 'Changed' })
    expect(updated.description).toBe('Changed')
    const testCase = await service.addTestCase(first.id, { name: 'Case 1', variables: { topic: 'AI' }, tags: ['smoke'] })
    await service.updateTestCase({ ...testCase, description: 'Updated' })
    const copy = await service.duplicateTestCase(testCase.id)
    expect(copy.id).not.toBe(testCase.id)
    expect(await testCases.listByDatasetId(first.id)).toHaveLength(2)
    await testCases.delete(copy.id)
    await datasets.archive(first.id); expect((await datasets.getById(first.id))?.status).toBe('archived')
    await datasets.restore(first.id); expect((await datasets.getById(first.id))?.status).toBe('active')
    const listed = await query.list({ workspaceId: 'w', sortBy: 'name', sortDirection: 'asc' })
    expect(listed.items.map(item => item.name)).toEqual(['Alpha', 'Zulu updated'])
    expect(listed.testCaseCounts[first.id]).toBe(1)
    const datasetCopy = await service.duplicate(first.id)
    expect((await testCases.listByDatasetId(datasetCopy.id))[0].variables).toEqual({ topic: 'AI' })
    await service.delete(first.id); expect(await datasets.getById(first.id)).toBeUndefined(); expect(await testCases.listByDatasetId(first.id)).toEqual([])
  })

  it('validates test case variables and rejects dangerous or non-serializable values', () => {
    const testCase: DatasetTestCase = { id: 'c', workspaceId: 'w', datasetId: 'd', name: 'Case', variables: { count: 'bad', extra: true }, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
    const matched = validateTestCaseVariables(testCase, [{ id: 'v', name: 'count', displayName: 'Count', type: 'number', required: true }])
    expect(matched.valid).toBe(false); expect(matched.extraVariables).toEqual(['extra'])
    const unsafe = JSON.parse('{"id":"c","workspaceId":"w","datasetId":"d","name":"Case","variables":{"__proto__":{"polluted":true}},"createdAt":"x","updatedAt":"x"}') as DatasetTestCase
    expect(validateDatasetTestCase(unsafe).issues.some(issue => issue.message.includes('Unsafe key'))).toBe(true)
    expect(validateDatasetTestCase({ ...testCase, variables: { controller: new AbortController() } }).valid).toBe(false)
  })
})

describe('Phase 4 JSON import', () => {
  it('exports a plain schemaVersion 1 document that round-trips including Unicode', () => {
    const dataset: Dataset = { id:'d',workspaceId:'w',name:'中文资料集',description:'回归',status:'active',createdAt:'2026-01-01',updatedAt:'2026-01-01' }
    const testCase: DatasetTestCase = { id:'c',workspaceId:'w',datasetId:'d',name:'案例',variables:{主题:'人工智能'},expectedOutput:'摘要',expectedValidation:{contains:['摘要']},tags:['冒烟'],createdAt:'2026-01-01',updatedAt:'2026-01-01' }
    const exported = exportDatasetDocument(dataset,[testCase])
    expect(exported).toMatchObject({schemaVersion:1,dataset:{name:'中文资料集'},testCases:[{name:'案例',variables:{主题:'人工智能'}}]})
    expect(JSON.stringify(exported)).not.toContain('workspaceId')
    expect(parseDatasetImport(JSON.stringify(exported))).toMatchObject({valid:true,acceptedCaseCount:1})
  })
  it('returns a safe atomic preview with case-specific errors', () => {
    const valid = parseDatasetImport(JSON.stringify({ schemaVersion: 1, dataset: { name: 'Regression' }, testCases: [{ name: 'Case 1', variables: { topic: 'AI' }, expectedValidation: { contains: ['summary'] } }] }))
    expect(valid).toMatchObject({ valid: true, strategy: 'atomic', acceptedCaseCount: 1 })
    const unsafe = parseDatasetImport('{"schemaVersion":1,"dataset":{"name":"Bad"},"testCases":[{"name":"Unsafe","variables":{"constructor":{"x":1}}}]}')
    expect(unsafe.valid).toBe(false); expect(unsafe.acceptedCaseCount).toBe(0); expect(unsafe.issues[0]).toMatchObject({ caseIndex: 0, caseName: 'Unsafe' }); expect(unsafe.issues[0].path).toContain('constructor')
    const mixed = parseDatasetImport(JSON.stringify({ schemaVersion: 1, dataset: { name: 'Mixed' }, testCases: [{ name: 'Good', variables: {} }, { name: '', variables: [] }] }))
    expect(mixed.valid).toBe(false); expect(mixed.acceptedCaseCount).toBe(0); expect(mixed.issues.some(issue => issue.caseIndex === 1)).toBe(true)
  })

  it('imports all cases in one transaction and writes nothing for an invalid preview', async () => {
    const db = openDb(); const { datasets, testCases, service } = repositories(db)
    const invalid = service.previewImport('{"schemaVersion":2,"dataset":{"name":"Bad"},"testCases":[]}')
    await expect(service.importAtomic('w', invalid)).rejects.toThrow('valid import preview')
    expect(await db.datasets.count()).toBe(0); expect(await db.datasetTestCases.count()).toBe(0)
    const preview = service.previewImport(JSON.stringify({ schemaVersion: 1, dataset: { name: 'Imported' }, testCases: [{ name: 'A', variables: {} }, { name: 'B', variables: { n: 2 } }] }))
    const dataset = await service.importAtomic('w', preview)
    expect((await datasets.getById(dataset.id))?.name).toBe('Imported'); expect(await testCases.listByDatasetId(dataset.id)).toHaveLength(2)

    const forged = structuredClone(preview); if (!forged.document) throw new Error('Expected import document')
    forged.document.dataset.name = 'Rollback'; forged.document.testCases[1].name = ''
    await expect(service.importAtomic('w', forged)).rejects.toThrow('Test case name is required')
    expect((await datasets.list({ workspaceId: 'w' })).items.map(item => item.name)).toEqual(['Imported'])
  })
})

const snapshot = (): EvaluationRunConfigSnapshot => ({
  dataset: { id: 'd', name: 'Dataset' }, prompt: { id: 'p', name: 'Prompt' }, promptVersion: { id: 'v', versionNumber: 'V1.0' },
  model: { configKey: 'openai-main', providerId: 'openai', modelId: 'gpt-5-mini' }, temperature: 0.2, maxTokens: 500, concurrency: 1,
  selection: { caseIds: ['c1', 'c2'] }, pricing: { status: 'unavailable', providerId: 'openai', modelId: 'gpt-5-mini', reason: 'No configured price' },
})

describe('Phase 4 evaluation history', () => {
  it('keeps run and result snapshots immutable and retry creates a new run', async () => {
    const db = openDb(); const runs = new DexieEvaluationRunRepository(db); const results = new DexieEvaluationResultRepository(db); const query = new EvaluationQueryService(runs, results)
    const run = await query.createRun('w', snapshot(), 'Regression')
    const changed = structuredClone(run); changed.configSnapshot.model.modelId = 'other'
    await expect(runs.update(changed)).rejects.toThrow('immutable')
    const result: EvaluationResult = { id: 'r', workspaceId: 'w', evaluationRunId: run.id, datasetId: 'd', testCaseId: 'c1', promptId: 'p', promptVersionId: 'v', status: 'pending', testCaseSnapshot: { id: 'c1', name: 'Original', variables: { topic: 'AI' }, tags: [] }, validationRulesSnapshot: { contains: ['AI'] }, variableValidation: { valid: true, diagnostics: [], extraVariables: [] }, tokenUsage: { source: 'unavailable' }, cost: { currency: 'USD', source: 'unavailable' }, createdAt: '2026-01-01' }
    await results.create(result); const changedResult = structuredClone(result); changedResult.testCaseSnapshot.name = 'Changed'
    await expect(results.update(changedResult)).rejects.toThrow('immutable')
    const retry = await query.retry(run.id, ['c2'])
    expect(retry.id).not.toBe(run.id); expect(retry.configSnapshot.selection.caseIds).toEqual(['c2']); expect((await runs.getById(run.id))?.configSnapshot.selection.caseIds).toEqual(['c1', 'c2'])
  })
})

describe('PromptOps database v3 to v4 migration', () => {
  it('preserves all old tables and records while adding Phase 4 tables', async () => {
    const name = `migration-${crypto.randomUUID()}`; const legacy = new Dexie(name); databases.push(legacy)
    legacy.version(3).stores({ workspaces: 'id', prompts: 'id, workspaceId', promptVersions: 'id, promptId', modelInvocations: 'id, promptId' })
    await legacy.open()
    const workspace: Workspace = { id: 'w', name: 'Workspace', description: '', owner: { id: 'u', name: 'User', role: 'admin' }, members: [], createdAt: '2026-01-01', updatedAt: '2026-01-01' }
    const prompt = { id: 'p', workspaceId: 'w', ownerId: 'u', name: 'Prompt' } as unknown as PromptOpsPrompt
    const version = { id: 'v', workspaceId: 'w', promptId: 'p', versionNumber: 'V1.0' } as PromptOpsPromptVersion
    const invocation = { id: 'i', workspaceId: 'w', promptId: 'p', status: 'succeeded' } as ModelInvocation
    await legacy.table('workspaces').add(workspace); await legacy.table('prompts').add(prompt); await legacy.table('promptVersions').add(version); await legacy.table('modelInvocations').add(invocation); legacy.close()
    const upgraded = new PromptOpsDatabase(name); databases.push(upgraded); await upgraded.open()
    expect(upgraded.verno).toBe(4)
    expect(await Promise.all([upgraded.workspaces.count(), upgraded.prompts.count(), upgraded.promptVersions.count(), upgraded.modelInvocations.count()])).toEqual([1, 1, 1, 1])
    expect(await Promise.all([upgraded.datasets.count(), upgraded.datasetTestCases.count(), upgraded.evaluationRuns.count(), upgraded.evaluationResults.count()])).toEqual([0, 0, 0, 0])
  })
})
