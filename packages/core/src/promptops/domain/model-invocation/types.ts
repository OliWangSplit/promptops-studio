import type {UserSummary} from '../workspace/types'
import type {OutputValidationResult} from '../output-validation/types'
export type InvocationStatus='running'|'succeeded'|'failed'|'cancelled'
export type TokenUsageSource='provider'|'estimated'|'unavailable'
export type CostCalculationSource='configured_price'|'estimated_tokens'|'unavailable'
export interface InvocationTokenUsage{inputTokens?:number;outputTokens?:number;totalTokens?:number;cachedInputTokens?:number;reasoningTokens?:number;source:TokenUsageSource}
export interface InvocationCost{inputCost?:number;outputCost?:number;totalCost?:number;currency:string;source:CostCalculationSource}
export interface ModelInvocation{id:string;workspaceId:string;promptId:string;promptVersionId?:string;promptVersionNumber?:string;promptName:string;businessScenario:string;provider:string;modelName:string;temperature:number;maxTokens:number;streaming:boolean;jsonMode:boolean;variableValues:Record<string,unknown>;renderedSystemPrompt:string;renderedUserPrompt:string;rawOutput:string;parsedOutput?:unknown;status:InvocationStatus;startedAt:string;completedAt?:string;latencyMs?:number;timeToFirstTokenMs?:number;tokenUsage:InvocationTokenUsage;cost:InvocationCost;outputValidation:OutputValidationResult;errorCode?:string;errorType?:string;errorMessage?:string;createdBy:UserSummary;createdAt:string}
