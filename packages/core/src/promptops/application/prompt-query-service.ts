import { PROMPT_STATUSES, type Prompt, type PromptStatus } from '../domain/prompt/types'
import type { PromptRepository } from '../repositories/prompt-repository'

export interface DashboardSummary {
  total: number
  byStatus: Record<PromptStatus, number>
  averageEvaluationScore?: number
  highRisk: number
  recentlyUpdated: Prompt[]
  highRiskPrompts: Prompt[]
}

export class PromptQueryService {
  constructor(private readonly prompts: PromptRepository) {}

  async getDashboardSummary(workspaceId: string): Promise<DashboardSummary> {
    const [items, byStatus] = await Promise.all([
      this.prompts.list({ workspaceId, sortBy: 'updatedAt', sortDirection: 'desc' }),
      this.prompts.countByStatus(workspaceId),
    ])
    const scored = items.filter((item) => item.lastEvaluationScore !== undefined)
    return {
      total: PROMPT_STATUSES.reduce((sum, status) => sum + byStatus[status], 0),
      byStatus,
      averageEvaluationScore: scored.length
        ? scored.reduce((sum, item) => sum + (item.lastEvaluationScore ?? 0), 0) / scored.length
        : undefined,
      highRisk: items.filter((item) => item.riskLevel === 'high').length,
      recentlyUpdated: items.slice(0, 5),
      highRiskPrompts: items.filter((item) => item.riskLevel === 'high'),
    }
  }
}
