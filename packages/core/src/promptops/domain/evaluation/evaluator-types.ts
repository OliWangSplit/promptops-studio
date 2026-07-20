export interface RuleEvaluationResult {
  ruleType: string
  passed: boolean
  score?: number
  expected?: unknown
  actual?: unknown
  message?: string
  diagnostics: string[]
  applicable: boolean
}

export interface DeterministicEvaluationResult {
  passed: boolean
  score?: number
  rules: RuleEvaluationResult[]
}
