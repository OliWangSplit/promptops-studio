import type { Prompt, PromptOutputType, PromptRiskLevel, PromptStatus } from './types'

export const PROMPT_DEFAULTS = Object.freeze({
  outputType: 'text' as PromptOutputType,
  temperature: 0.7,
  maxTokens: 1000,
  status: 'draft' as PromptStatus,
  riskLevel: 'low' as PromptRiskLevel,
  currentVersion: 'V1.0',
  modelProvider: 'openai',
  modelName: 'gpt-4.1-mini',
})

export type PromptEditableFields = Omit<Prompt, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'lastEvaluationScore' | 'lastEvaluatedAt'>
