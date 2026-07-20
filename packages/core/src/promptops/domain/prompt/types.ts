import type { EntityMetadata } from '../shared/types'
import type { UserSummary } from '../workspace/types'

export const PROMPT_STATUSES = ['draft', 'testing', 'pending_approval', 'published', 'archived'] as const
export type PromptStatus = typeof PROMPT_STATUSES[number]
export type PromptRiskLevel = 'low' | 'medium' | 'high'
export type PromptVariableType = 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select'
export type PromptOutputType = 'text' | 'json' | 'markdown'

export interface PromptVariable {
  id: string
  name: string
  displayName: string
  type: PromptVariableType
  description?: string
  required: boolean
  defaultValue?: unknown
  exampleValue?: unknown
  options?: string[]
  unused?: boolean
}

export interface Prompt extends EntityMetadata {
  name: string
  description: string
  businessScenario: string
  category: string
  department: string
  owner: UserSummary
  systemPrompt: string
  userPrompt: string
  variables: PromptVariable[]
  expectedOutputFormat?: string
  outputType: PromptOutputType
  modelProvider: string
  modelName: string
  temperature: number
  maxTokens: number
  status: PromptStatus
  riskLevel: PromptRiskLevel
  currentVersion: string
  lastEvaluationScore?: number
  lastEvaluatedAt?: string
  archivedAt?: string
}
