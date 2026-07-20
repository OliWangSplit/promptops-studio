import { PROMPT_STATUSES, type Prompt, type PromptStatus } from '../domain/prompt/types'
import type { PromptListQuery, PromptRepository } from '../repositories/prompt-repository'
import type { PromptOpsDatabase, PromptOpsPromptRecord } from './promptops-db'

const cloneData = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const toRecord = (prompt: Prompt): PromptOpsPromptRecord => {
  const value = cloneData(prompt)
  return { ...value, ownerId: value.owner.id }
}
const toDomain = ({ ownerId: _ownerId, ...prompt }: PromptOpsPromptRecord): Prompt => prompt

export const applyPromptQuery = (items: Prompt[], query?: PromptListQuery): Prompt[] => {
  let result = items
  if (query) {
    const search = query.search?.trim().toLocaleLowerCase()
    result = result.filter((prompt) =>
      prompt.workspaceId === query.workspaceId &&
      (!search || [prompt.name, prompt.description, prompt.businessScenario].some((value) => value.toLocaleLowerCase().includes(search))) &&
      (!query.status || prompt.status === query.status) &&
      (!query.category || prompt.category === query.category) &&
      (!query.department || prompt.department === query.department) &&
      (!query.ownerId || prompt.owner.id === query.ownerId) &&
      (!query.riskLevel || prompt.riskLevel === query.riskLevel)
    )
  }
  const sortBy = query?.sortBy ?? 'updatedAt'
  const direction = query?.sortDirection === 'asc' ? 1 : -1
  return [...result].sort((left, right) => {
    const a = left[sortBy] ?? -1
    const b = right[sortBy] ?? -1
    return (typeof a === 'string' ? a.localeCompare(String(b)) : Number(a) - Number(b)) * direction
  })
}

export class DexiePromptRepository implements PromptRepository {
  constructor(private readonly db: PromptOpsDatabase) {}
  async getById(id: string): Promise<Prompt | undefined> {
    const record = await this.db.prompts.get(id)
    return record ? toDomain(record) : undefined
  }
  async list(query?: PromptListQuery): Promise<Prompt[]> {
    const records = query?.workspaceId
      ? await this.db.prompts.where('workspaceId').equals(query.workspaceId).toArray()
      : await this.db.prompts.toArray()
    return applyPromptQuery(records.map(toDomain), query)
  }
  async countByStatus(workspaceId: string): Promise<Record<PromptStatus, number>> {
    const counts = Object.fromEntries(PROMPT_STATUSES.map((status) => [status, 0])) as Record<PromptStatus, number>
    const records = await this.db.prompts.where('workspaceId').equals(workspaceId).toArray()
    records.forEach((record) => { counts[record.status] += 1 })
    return counts
  }
  async create(prompt: Prompt): Promise<Prompt> { await this.db.prompts.add(toRecord(prompt)); return prompt }
  async update(prompt: Prompt): Promise<Prompt> { await this.db.prompts.put(toRecord(prompt)); return prompt }
  async archive(id: string): Promise<void> {
    const prompt = await this.getById(id)
    if (!prompt) throw new Error(`Prompt not found: ${id}`)
    const now = new Date().toISOString()
    await this.update({ ...prompt, status: 'archived', archivedAt: now, updatedAt: now })
  }
}
