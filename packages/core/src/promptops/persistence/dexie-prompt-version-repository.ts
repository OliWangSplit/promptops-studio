import type { PromptVersion } from '../domain/prompt-version/types'
import { compareVersionNumbers } from '../domain/prompt-version/version-number'
import type { PromptVersionRepository } from '../repositories/prompt-version-repository'
import type { PromptOpsDatabase } from './promptops-db'

export class DexiePromptVersionRepository implements PromptVersionRepository {
  constructor(private readonly db:PromptOpsDatabase) {}
  async create(version:PromptVersion):Promise<PromptVersion>{
    if(await this.getByVersionNumber(version.promptId,version.versionNumber)) throw new Error(`Version already exists: ${version.versionNumber}`)
    const value=JSON.parse(JSON.stringify(version)) as PromptVersion
    await this.db.promptVersions.add(value); return JSON.parse(JSON.stringify(value)) as PromptVersion
  }
  async getById(id:string){const value=await this.db.promptVersions.get(id);return value?JSON.parse(JSON.stringify(value)) as PromptVersion:undefined}
  async listByPromptId(promptId:string):Promise<PromptVersion[]>{const values=await this.db.promptVersions.where('promptId').equals(promptId).toArray();return values.sort((a,b)=>compareVersionNumbers(b.versionNumber,a.versionNumber)).map((value)=>JSON.parse(JSON.stringify(value)) as PromptVersion)}
  async getLatest(promptId:string){return (await this.listByPromptId(promptId))[0]}
  async getByVersionNumber(promptId:string,versionNumber:string){const value=await this.db.promptVersions.where('[promptId+versionNumber]').equals([promptId,versionNumber]).first();return value?JSON.parse(JSON.stringify(value)) as PromptVersion:undefined}
}
