import type { PromptOutputType } from '../prompt/types'
export interface OutputValidationDiagnostic { severity:'warning'|'error'; code:'empty_output'|'invalid_json'|'too_large'; message:string }
export interface OutputValidationResult { outputType:PromptOutputType; valid:boolean; rawOutput:string; parsedOutput?:unknown; diagnostics:OutputValidationDiagnostic[] }
