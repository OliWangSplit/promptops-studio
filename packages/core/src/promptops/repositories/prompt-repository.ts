import type { Prompt, PromptRiskLevel, PromptStatus } from '../domain/prompt/types'

export interface PromptListQuery {
  workspaceId: string
  search?: string
  status?: PromptStatus
  category?: string
  department?: string
  ownerId?: string
  riskLevel?: PromptRiskLevel
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastEvaluationScore'
  sortDirection?: 'asc' | 'desc'
}

export interface PromptRepository {
  getById(id: string): Promise<Prompt | undefined>
  list(query?: PromptListQuery): Promise<Prompt[]>
  countByStatus(workspaceId: string): Promise<Record<PromptStatus, number>>
  create(prompt: Prompt): Promise<Prompt>
  update(prompt: Prompt): Promise<Prompt>
  archive(id: string): Promise<void>
}
