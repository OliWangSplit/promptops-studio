import type { PromptVersion } from '../domain/prompt-version/types'
export interface PromptVersionRepository {
  create(version:PromptVersion):Promise<PromptVersion>
  getById(id:string):Promise<PromptVersion|undefined>
  listByPromptId(promptId:string):Promise<PromptVersion[]>
  getLatest(promptId:string):Promise<PromptVersion|undefined>
  getByVersionNumber(promptId:string,versionNumber:string):Promise<PromptVersion|undefined>
}
