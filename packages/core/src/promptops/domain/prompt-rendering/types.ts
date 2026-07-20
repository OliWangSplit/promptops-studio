import type { PromptVariable } from '../prompt/types'

export type PromptRenderDiagnosticCode = 'missing_required'|'invalid_type'|'invalid_option'|'unsafe_name'
export interface PromptRenderDiagnostic { code:PromptRenderDiagnosticCode; variable:string; message:string }
export interface PromptRenderInput { systemPrompt:string; userPrompt:string; variables:PromptVariable[]; values:Record<string,unknown> }
export interface PromptRenderResult { renderedSystemPrompt:string; renderedUserPrompt:string; normalizedValues:Record<string,unknown>; missingRequiredVariables:string[]; unusedProvidedVariables:string[]; diagnostics:PromptRenderDiagnostic[]; valid:boolean }
