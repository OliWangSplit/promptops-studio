import { describe, expect, it, vi } from 'vitest'
import { applyPromptQuery, PromptQueryService, PROMPT_STATUSES, type Prompt, type PromptRepository } from '../../../src/promptops'

const prompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: 'p1', workspaceId: 'w1', name: 'Complaint Reply', description: 'Customer response', businessScenario: 'Support', category: 'Service', department: 'CX',
  owner: { id: 'u1', name: 'Alex', role: 'editor' }, systemPrompt: '', userPrompt: '', variables: [], modelProvider: 'openai', modelName: 'gpt', temperature: 0.3,
  maxTokens: 500, status: 'draft', riskLevel: 'low', currentVersion: 'V1.0', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', ...overrides,
})

describe('PromptOps prompt querying', () => {
  it('searches, filters and sorts inside the repository boundary', () => {
    const items = [prompt(), prompt({ id: 'p2', name: 'Risk Review', status: 'published', lastEvaluationScore: 92 })]
    expect(applyPromptQuery(items, { workspaceId: 'w1', search: 'risk', status: 'published' })).toHaveLength(1)
    expect(applyPromptQuery(items, { workspaceId: 'w1', sortBy: 'lastEvaluationScore', sortDirection: 'desc' })[0].id).toBe('p2')
  })

  it('aggregates dashboard values from repository data', async () => {
    const items = [prompt({ riskLevel: 'high', lastEvaluationScore: 80 }), prompt({ id: 'p2', status: 'published', lastEvaluationScore: 100 })]
    const counts = Object.fromEntries(PROMPT_STATUSES.map((status) => [status, items.filter((item) => item.status === status).length]))
    const repository = { list: vi.fn().mockResolvedValue(items), countByStatus: vi.fn().mockResolvedValue(counts) } as unknown as PromptRepository
    const result = await new PromptQueryService(repository).getDashboardSummary('w1')
    expect(result).toMatchObject({ total: 2, averageEvaluationScore: 90, highRisk: 1 })
  })
})
