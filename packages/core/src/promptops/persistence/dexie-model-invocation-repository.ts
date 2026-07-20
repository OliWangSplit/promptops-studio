import type{ModelInvocation}from'../domain/model-invocation/types'
import type{InvocationListQuery,InvocationListResult,ModelInvocationRepository}from'../repositories/model-invocation-repository'
import type{PromptOpsDatabase}from'./promptops-db'
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T
export class DexieModelInvocationRepository implements ModelInvocationRepository{
 constructor(private readonly db:PromptOpsDatabase){}
 async create(value:ModelInvocation){const plain=clone(value);await this.db.modelInvocations.add(plain);return clone(plain)}
 async update(value:ModelInvocation){const plain=clone(value);await this.db.modelInvocations.put(plain);return clone(plain)}
 async getById(id:string){const value=await this.db.modelInvocations.get(id);return value?clone(value):undefined}
 async list(query:InvocationListQuery={}):Promise<InvocationListResult>{let values=await this.db.modelInvocations.orderBy('createdAt').reverse().toArray();values=values.filter(item=>(!query.workspaceId||item.workspaceId===query.workspaceId)&&(!query.promptId||item.promptId===query.promptId)&&(!query.promptVersionId||item.promptVersionId===query.promptVersionId)&&(!query.provider||item.provider===query.provider)&&(!query.status||item.status===query.status)&&(!query.from||item.createdAt>=query.from)&&(!query.to||item.createdAt<=query.to));const total=values.length,limit=Math.min(Math.max(query.limit??20,1),100),offset=Math.max(query.offset??0,0);return{items:clone(values.slice(offset,offset+limit)),total,limit,offset}}
 async clear(){await this.db.modelInvocations.clear()}
}
