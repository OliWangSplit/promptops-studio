import { PROMPT_STATUSES, type Prompt, type PromptVariable } from './types'
import { isValidPromptVariableName, parsePromptVariables } from './variable-parser'

export interface PromptValidationIssue { field: string; message: string }
export interface PromptValidationResult { valid: boolean; issues: PromptValidationIssue[] }
const required = (issues: PromptValidationIssue[], field: string, value: unknown) => { if (typeof value !== 'string' || !value.trim()) issues.push({ field, message: 'Required' }) }

const validateVariable = (variable: PromptVariable, index: number, issues: PromptValidationIssue[]) => {
  const field = `variables.${index}`
  if (!isValidPromptVariableName(variable.name)) issues.push({ field: `${field}.name`, message: 'Invalid variable name' })
  if (variable.type === 'select' && !variable.options?.some((item) => item.trim())) issues.push({ field: `${field}.options`, message: 'Select options required' })
  if (variable.defaultValue !== undefined && variable.defaultValue !== '') {
    if (variable.type === 'number' && (typeof variable.defaultValue !== 'number' || !Number.isFinite(variable.defaultValue))) issues.push({ field: `${field}.defaultValue`, message: 'Must be a number' })
    if (variable.type === 'boolean' && typeof variable.defaultValue !== 'boolean') issues.push({ field: `${field}.defaultValue`, message: 'Must be a boolean' })
  }
}

export function validatePrompt(prompt: Pick<Prompt, 'name'|'businessScenario'|'category'|'department'|'owner'|'status'|'riskLevel'|'systemPrompt'|'userPrompt'|'modelProvider'|'modelName'|'temperature'|'maxTokens'|'variables'>): PromptValidationResult {
  const issues: PromptValidationIssue[] = []
  required(issues, 'name', prompt.name); required(issues, 'businessScenario', prompt.businessScenario); required(issues, 'category', prompt.category); required(issues, 'department', prompt.department)
  if (prompt.name.trim().length > 120) issues.push({ field: 'name', message: 'Maximum 120 characters' })
  if (!prompt.owner?.id) issues.push({ field: 'owner', message: 'Required' })
  if (!PROMPT_STATUSES.includes(prompt.status)) issues.push({ field: 'status', message: 'Invalid status' })
  if (!['low','medium','high'].includes(prompt.riskLevel)) issues.push({ field: 'riskLevel', message: 'Invalid risk level' })
  if (!prompt.systemPrompt.trim() && !prompt.userPrompt.trim()) issues.push({ field: 'userPrompt', message: 'System or user prompt is required' })
  if (prompt.systemPrompt.length + prompt.userPrompt.length > 100000) issues.push({ field: 'userPrompt', message: 'Prompt content is too long' })
  required(issues, 'modelProvider', prompt.modelProvider); required(issues, 'modelName', prompt.modelName)
  if (!Number.isFinite(prompt.temperature) || prompt.temperature < 0 || prompt.temperature > 2) issues.push({ field: 'temperature', message: 'Temperature must be between 0 and 2' })
  if (!Number.isInteger(prompt.maxTokens) || prompt.maxTokens < 1 || prompt.maxTokens > 200000) issues.push({ field: 'maxTokens', message: 'Max tokens must be a positive integer up to 200000' })
  const names = new Set<string>()
  prompt.variables.forEach((variable, index) => { validateVariable(variable,index,issues); if(names.has(variable.name)) issues.push({field:`variables.${index}.name`,message:'Duplicate variable name'}); names.add(variable.name) })
  parsePromptVariables(prompt.systemPrompt,prompt.userPrompt).diagnostics.forEach((diagnostic)=>issues.push({field:diagnostic.source==='system'?'systemPrompt':'userPrompt',message:diagnostic.message}))
  return { valid: issues.length === 0, issues }
}
