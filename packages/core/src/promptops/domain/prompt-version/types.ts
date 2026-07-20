import type { PromptOutputType, PromptRiskLevel, PromptVariable } from '../prompt/types'
import type { UserSummary } from '../workspace/types'
export type PromptVersionStatus = 'draft'|'testing'|'published'|'archived'
export interface PromptVersion {
  id:string; workspaceId:string; promptId:string; versionNumber:string; name:string; description:string; businessScenario:string; category:string; department:string; owner:UserSummary;
  systemPrompt:string; userPrompt:string; variables:PromptVariable[]; expectedOutputFormat?:string; outputType:PromptOutputType; modelProvider:string; modelName:string; temperature:number; maxTokens:number;
  status:PromptVersionStatus; riskLevel:PromptRiskLevel; changeSummary:string; changeReason?:string; createdBy:UserSummary; createdAt:string; evaluationScore?:number
}
