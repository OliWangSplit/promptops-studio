export type PromptVariableSource = 'system' | 'user'
export interface ParsedPromptVariable { name: string; sources: PromptVariableSource[]; occurrences: number }
export interface VariableDiagnostic { rawValue: string; message: string; source: PromptVariableSource; index?: number }
export interface VariableParseResult { variables: ParsedPromptVariable[]; diagnostics: VariableDiagnostic[] }

const validName = /^[A-Za-z_][A-Za-z0-9_]*$/
const tokenPattern = /{{([^{}]*)}}/g

export const isValidPromptVariableName = (name: string): boolean => validName.test(name)

export function parsePromptVariables(systemPrompt: string, userPrompt: string): VariableParseResult {
  const variables = new Map<string, ParsedPromptVariable>()
  const diagnostics: VariableDiagnostic[] = []
  const scan = (text: string, source: PromptVariableSource) => {
    for (const match of text.matchAll(tokenPattern)) {
      const rawValue = match[1]
      const name = rawValue.trim()
      if (!name) continue
      if (name !== rawValue || !isValidPromptVariableName(name)) {
        diagnostics.push({ rawValue, source, index: match.index, message: 'Invalid variable name' })
        continue
      }
      const existing = variables.get(name)
      if (existing) {
        existing.occurrences += 1
        if (!existing.sources.includes(source)) existing.sources.push(source)
      } else variables.set(name, { name, sources: [source], occurrences: 1 })
    }
  }
  scan(systemPrompt, 'system'); scan(userPrompt, 'user')
  return { variables: [...variables.values()], diagnostics }
}
