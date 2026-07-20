import { createPromptOpsId } from '../shared/types'
import type { PromptVariable } from './types'
import type { VariableParseResult } from './variable-parser'

const displayName = (name: string) => name.split('_').filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')

export function syncPromptVariables(existing: PromptVariable[], parsed: VariableParseResult): PromptVariable[] {
  const active = new Set(parsed.variables.map(({ name }) => name))
  const byName = new Map(existing.map((item) => [item.name, item]))
  const result = parsed.variables.map(({ name }) => {
    const current = byName.get(name)
    return current ? { ...current, unused: false } : { id: createPromptOpsId(), name, displayName: displayName(name), type: 'text' as const, required: true, unused: false }
  })
  for (const item of existing) if (!active.has(item.name)) result.push({ ...item, unused: true })
  return result
}
