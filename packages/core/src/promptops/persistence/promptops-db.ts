import Dexie, { type Table } from 'dexie'
import type { Prompt } from '../domain/prompt/types'
import type { Workspace } from '../domain/workspace/types'
import type { PromptVersion } from '../domain/prompt-version/types'
import type { ModelInvocation } from '../domain/model-invocation/types'
import type { Dataset, DatasetTestCase } from '../domain/dataset/types'
import type { EvaluationResult, EvaluationRun } from '../domain/evaluation/types'

export interface PromptOpsPromptRecord extends Omit<Prompt, 'owner'> {
  owner: Prompt['owner']
  ownerId: string
}

export class PromptOpsDatabase extends Dexie {
  workspaces!: Table<Workspace, string>
  prompts!: Table<PromptOpsPromptRecord, string>
  promptVersions!: Table<PromptVersion, string>
  modelInvocations!: Table<ModelInvocation, string>
  datasets!: Table<Dataset, string>
  datasetTestCases!: Table<DatasetTestCase, string>
  evaluationRuns!: Table<EvaluationRun, string>
  evaluationResults!: Table<EvaluationResult, string>

  constructor(name = 'PromptOpsStudioDB') {
    super(name)
    this.version(1).stores({
      workspaces: 'id, name, createdAt, updatedAt',
      prompts: 'id, workspaceId, name, status, category, department, ownerId, riskLevel, modelProvider, modelName, createdAt, updatedAt, lastEvaluatedAt, [workspaceId+status], [workspaceId+updatedAt]'
    })
    this.version(2).stores({
      workspaces: 'id, name, createdAt, updatedAt',
      prompts: 'id, workspaceId, name, status, category, department, ownerId, riskLevel, modelProvider, modelName, createdAt, updatedAt, lastEvaluatedAt, [workspaceId+status], [workspaceId+updatedAt]',
      promptVersions: 'id, workspaceId, promptId, versionNumber, status, createdAt, [promptId+versionNumber], [promptId+createdAt]'
    }).upgrade(async (transaction) => {
      const prompts = transaction.table<PromptOpsPromptRecord, string>('prompts')
      const versions = transaction.table<PromptVersion, string>('promptVersions')
      await prompts.toCollection().modify((prompt) => { prompt.outputType ??= 'text' })
      const existing = await prompts.toArray()
      const versionRecords: PromptVersion[] = existing.map((prompt) => ({
        id:`version-migrated-${prompt.id}-v1-0`, workspaceId:prompt.workspaceId, promptId:prompt.id, versionNumber:prompt.currentVersion || 'V1.0',
        name:prompt.name,description:prompt.description,businessScenario:prompt.businessScenario,category:prompt.category,department:prompt.department,owner:prompt.owner,
        systemPrompt:prompt.systemPrompt,userPrompt:prompt.userPrompt,variables:prompt.variables,expectedOutputFormat:prompt.expectedOutputFormat,outputType:prompt.outputType ?? 'text',
        modelProvider:prompt.modelProvider,modelName:prompt.modelName,temperature:prompt.temperature,maxTokens:prompt.maxTokens,
        status:prompt.status==='pending_approval'?'testing':prompt.status,riskLevel:prompt.riskLevel,changeSummary:'Migrated initial version',createdBy:prompt.owner,createdAt:prompt.createdAt,evaluationScore:prompt.lastEvaluationScore
      }))
      if (versionRecords.length) await versions.bulkAdd(versionRecords)
    })
    this.version(3).stores({
      workspaces: 'id, name, createdAt, updatedAt',
      prompts: 'id, workspaceId, name, status, category, department, ownerId, riskLevel, modelProvider, modelName, createdAt, updatedAt, lastEvaluatedAt, [workspaceId+status], [workspaceId+updatedAt]',
      promptVersions: 'id, workspaceId, promptId, versionNumber, status, createdAt, [promptId+versionNumber], [promptId+createdAt]',
      modelInvocations: 'id, workspaceId, promptId, promptVersionId, provider, modelName, status, startedAt, createdAt, [workspaceId+createdAt], [promptId+createdAt], [status+createdAt]'
    })
    this.version(4).stores({
      workspaces: 'id, name, createdAt, updatedAt',
      prompts: 'id, workspaceId, name, status, category, department, ownerId, riskLevel, modelProvider, modelName, createdAt, updatedAt, lastEvaluatedAt, [workspaceId+status], [workspaceId+updatedAt]',
      promptVersions: 'id, workspaceId, promptId, versionNumber, status, createdAt, [promptId+versionNumber], [promptId+createdAt]',
      modelInvocations: 'id, workspaceId, promptId, promptVersionId, provider, modelName, status, startedAt, createdAt, [workspaceId+createdAt], [promptId+createdAt], [status+createdAt]',
      datasets: 'id, workspaceId, name, status, createdAt, updatedAt, [workspaceId+status], [workspaceId+updatedAt]',
      datasetTestCases: 'id, workspaceId, datasetId, name, createdAt, updatedAt, [datasetId+createdAt], [datasetId+updatedAt]',
      evaluationRuns: 'id, workspaceId, datasetId, promptId, promptVersionId, providerId, modelId, modelConfigKey, status, createdAt, startedAt, completedAt, [workspaceId+createdAt], [datasetId+createdAt], [promptId+createdAt], [status+createdAt]',
      evaluationResults: 'id, workspaceId, evaluationRunId, datasetId, testCaseId, promptId, promptVersionId, invocationId, status, createdAt, [evaluationRunId+createdAt], [testCaseId+createdAt], [invocationId+createdAt], [status+createdAt]'
    })
  }
}

let database: PromptOpsDatabase | undefined
export const getPromptOpsDatabase = (): PromptOpsDatabase => {
  database ??= new PromptOpsDatabase()
  return database
}
