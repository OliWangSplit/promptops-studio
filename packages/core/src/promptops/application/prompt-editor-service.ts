import type { Prompt, PromptOutputType } from '../domain/prompt/types'
import { PROMPT_DEFAULTS } from '../domain/prompt/defaults'
import { validatePrompt } from '../domain/prompt/validation'
import type { PromptVersion } from '../domain/prompt-version/types'
import { incrementMajorVersion, incrementMinorVersion } from '../domain/prompt-version/version-number'
import { createPromptOpsId } from '../domain/shared/types'
import type { UserSummary } from '../domain/workspace/types'
import type { PromptOpsDatabase } from '../persistence/promptops-db'
import type { PromptRepository } from '../repositories/prompt-repository'
import type { PromptVersionRepository } from '../repositories/prompt-version-repository'

export type VersionIncrement='minor'|'major'
export type PromptDraftInput=Omit<Prompt,'id'|'createdAt'|'updatedAt'|'currentVersion'> & {id?:string}
export interface VersionMetadata {changeSummary:string;changeReason?:string;increment?:VersionIncrement;createdBy?:UserSummary}

const cloneData=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T
const assertValid=(prompt:Prompt)=>{const result=validatePrompt(prompt);if(!result.valid)throw new Error(`Prompt validation failed: ${result.issues[0]?.field} ${result.issues[0]?.message}`)}
const snapshot=(prompt:Prompt,versionNumber:string,metadata:VersionMetadata):PromptVersion=>({
  id:createPromptOpsId(),workspaceId:prompt.workspaceId,promptId:prompt.id,versionNumber,name:prompt.name,description:prompt.description,businessScenario:prompt.businessScenario,category:prompt.category,department:prompt.department,owner:cloneData(prompt.owner),systemPrompt:prompt.systemPrompt,userPrompt:prompt.userPrompt,variables:cloneData(prompt.variables),expectedOutputFormat:prompt.expectedOutputFormat,outputType:prompt.outputType,modelProvider:prompt.modelProvider,modelName:prompt.modelName,temperature:prompt.temperature,maxTokens:prompt.maxTokens,status:prompt.status==='pending_approval'?'testing':prompt.status,riskLevel:prompt.riskLevel,changeSummary:metadata.changeSummary,changeReason:metadata.changeReason,createdBy:cloneData(metadata.createdBy??prompt.owner),createdAt:new Date().toISOString(),evaluationScore:prompt.lastEvaluationScore
})

export class PromptEditorService {
  constructor(private db:PromptOpsDatabase,private prompts:PromptRepository,private versions:PromptVersionRepository){}
  async create(input:PromptDraftInput,metadata:VersionMetadata={changeSummary:'Initial version'}):Promise<Prompt>{
    const now=new Date().toISOString();const prompt:Prompt=cloneData({...input,id:input.id??createPromptOpsId(),outputType:input.outputType??PROMPT_DEFAULTS.outputType,currentVersion:'V1.0',createdAt:now,updatedAt:now});assertValid(prompt)
    return this.db.transaction('rw',this.db.prompts,this.db.promptVersions,async()=>{await this.prompts.create(prompt);await this.versions.create(snapshot(prompt,'V1.0',metadata));return prompt})
  }
  async saveChanges(prompt:Prompt):Promise<Prompt>{if(prompt.status==='archived')throw new Error('Archived prompts cannot be edited');const updated=cloneData({...prompt,updatedAt:new Date().toISOString()});assertValid(updated);return this.prompts.update(updated)}
  async saveNewVersion(prompt:Prompt,metadata:VersionMetadata):Promise<PromptVersion>{if(!metadata.changeSummary.trim())throw new Error('Change summary is required');if(prompt.status==='archived')throw new Error('Archived prompts cannot be edited');assertValid(prompt);const next=(metadata.increment??'minor')==='major'?incrementMajorVersion(prompt.currentVersion):incrementMinorVersion(prompt.currentVersion);const updated={...prompt,currentVersion:next,updatedAt:new Date().toISOString()};const version=snapshot(updated,next,metadata);return this.db.transaction('rw',this.db.prompts,this.db.promptVersions,async()=>{await this.versions.create(version);await this.prompts.update(updated);return version})}
  async restoreAsNew(promptId:string,versionId:string,metadata:VersionMetadata):Promise<PromptVersion>{const [prompt,source]=await Promise.all([this.prompts.getById(promptId),this.versions.getById(versionId)]);if(!prompt||!source||source.promptId!==promptId)throw new Error('Prompt version not found');const restored:Prompt={...prompt,name:source.name,description:source.description,businessScenario:source.businessScenario,category:source.category,department:source.department,owner:source.owner,systemPrompt:source.systemPrompt,userPrompt:source.userPrompt,variables:structuredClone(source.variables),expectedOutputFormat:source.expectedOutputFormat,outputType:source.outputType as PromptOutputType,modelProvider:source.modelProvider,modelName:source.modelName,temperature:source.temperature,maxTokens:source.maxTokens,status:source.status,riskLevel:source.riskLevel};return this.saveNewVersion(restored,metadata)}
  async duplicate(promptId:string,name?:string):Promise<Prompt>{const source=await this.prompts.getById(promptId);if(!source)throw new Error('Prompt not found');const {id:_id,createdAt:_created,updatedAt:_updated,currentVersion:_version,archivedAt:_archived,...input}=source;return this.create({...input,name:name??`${source.name} (Copy)`,status:'draft'},{changeSummary:'Duplicated from existing prompt'})}
  async restorePrompt(promptId:string):Promise<Prompt>{const prompt=await this.prompts.getById(promptId);if(!prompt)throw new Error('Prompt not found');return this.prompts.update({...prompt,status:'draft',archivedAt:undefined,updatedAt:new Date().toISOString()})}
}
