import type{InvocationStatus,ModelInvocation}from'../domain/model-invocation/types'
export interface InvocationListQuery{workspaceId?:string;promptId?:string;promptVersionId?:string;provider?:string;status?:InvocationStatus;from?:string;to?:string;limit?:number;offset?:number}
export interface InvocationListResult{items:ModelInvocation[];total:number;limit:number;offset:number}
export interface ModelInvocationRepository{create(invocation:ModelInvocation):Promise<ModelInvocation>;update(invocation:ModelInvocation):Promise<ModelInvocation>;getById(id:string):Promise<ModelInvocation|undefined>;list(query?:InvocationListQuery):Promise<InvocationListResult>;clear():Promise<void>}
