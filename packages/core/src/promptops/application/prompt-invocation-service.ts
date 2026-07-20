import {v4 as uuid} from 'uuid'
import type{ILLMService,LLMResponse,Message}from'../../services/llm/types'
import type{IModelManager}from'../../services/model/types'
import type{Prompt}from'../domain/prompt/types'
import type{PromptVersion}from'../domain/prompt-version/types'
import type{ModelInvocation}from'../domain/model-invocation/types'
import{normalizeLegacyTotalTokens}from'../domain/model-invocation/token-normalizer'
import{calculateInvocationCost}from'../domain/model-invocation/pricing'
import{normalizeInvocationError}from'../domain/model-invocation/errors'
import{renderPrompt}from'../domain/prompt-rendering/renderer'
import{validateOutput}from'../domain/output-validation/validator'
import type{PromptRepository}from'../repositories/prompt-repository'
import type{PromptVersionRepository}from'../repositories/prompt-version-repository'
import type{ModelInvocationRepository}from'../repositories/model-invocation-repository'
import{resolveEnabledModelIdentity}from'./enabled-model-options'

export interface RunPromptInvocationInput{workspaceId:string;promptId:string;promptVersionId?:string;variableValues:Record<string,unknown>;modelOverride?:{modelConfigKey?:string;providerId?:string;modelId?:string;provider?:string;modelName?:string;temperature?:number;maxTokens?:number;jsonMode?:boolean;streaming?:boolean;signal?:AbortSignal}}
export interface RunPromptInvocationResult{invocation:ModelInvocation;output:string;validation:ModelInvocation['outputValidation']}
export interface InvocationProgress{status:'running'|'succeeded'|'failed';output:string}
type Snapshot=Prompt|PromptVersion

export class PromptInvocationService{
 constructor(private prompts:PromptRepository,private versions:PromptVersionRepository,private invocations:ModelInvocationRepository,private llm:ILLMService,private models?:IModelManager){}
 private async snapshot(input:RunPromptInvocationInput):Promise<Snapshot>{if(input.promptVersionId){const version=await this.versions.getById(input.promptVersionId);if(!version||version.promptId!==input.promptId)throw new Error('Prompt version not found');return version}const prompt=await this.prompts.getById(input.promptId);if(!prompt)throw new Error('Prompt not found');return prompt}
 private async modelKey(provider:string,modelName:string){if(!this.models)return modelName||provider;const all=await this.models.getAllModels();const found=all.find(m=>m.enabled&&(m.id===modelName||m.modelMeta.id===modelName)&&(m.providerMeta.id===provider||m.id===provider))??all.find(m=>m.enabled&&(m.id===modelName||m.modelMeta.id===modelName))??all.find(m=>m.enabled&&(m.id===provider||m.providerMeta.id===provider));if(!found)throw new Error(`Model configuration not found or not enabled: ${provider}/${modelName}`);return found.id}
 async run(input:RunPromptInvocationInput,onProgress?:(progress:InvocationProgress)=>void):Promise<RunPromptInvocationResult>{
  const snapshot=await this.snapshot(input),now=new Date().toISOString(),rendered=renderPrompt({systemPrompt:snapshot.systemPrompt,userPrompt:snapshot.userPrompt,variables:snapshot.variables,values:input.variableValues});if(!rendered.valid)throw new Error(`Failed to render prompt: ${rendered.diagnostics.map(x=>x.message).join('; ')}`)
  let provider=input.modelOverride?.providerId??input.modelOverride?.provider??snapshot.modelProvider,modelName=input.modelOverride?.modelId??input.modelOverride?.modelName??snapshot.modelName;const streaming=input.modelOverride?.streaming??true,temperature=input.modelOverride?.temperature??snapshot.temperature,maxTokens=input.modelOverride?.maxTokens??snapshot.maxTokens,jsonMode=input.modelOverride?.jsonMode??snapshot.outputType==='json'
  let explicitKey:string|undefined
  if(input.modelOverride?.modelConfigKey){if(!this.models)throw new Error('Model manager is required for explicit model selection');const identity=await resolveEnabledModelIdentity(this.models,{modelConfigKey:input.modelOverride.modelConfigKey,providerId:input.modelOverride.providerId,modelId:input.modelOverride.modelId});explicitKey=identity.modelConfigKey;provider=identity.providerId;modelName=identity.modelId}
  let invocation:ModelInvocation={id:uuid(),workspaceId:input.workspaceId,promptId:input.promptId,promptVersionId:'versionNumber'in snapshot?snapshot.id:undefined,promptVersionNumber:'versionNumber'in snapshot?snapshot.versionNumber:snapshot.currentVersion,promptName:snapshot.name,businessScenario:snapshot.businessScenario,provider,modelName,temperature,maxTokens,streaming,jsonMode,variableValues:rendered.normalizedValues,renderedSystemPrompt:rendered.renderedSystemPrompt,renderedUserPrompt:rendered.renderedUserPrompt,rawOutput:'',status:'running',startedAt:now,tokenUsage:{source:'unavailable'},cost:{currency:'USD',source:'unavailable'},outputValidation:validateOutput('',snapshot.outputType),createdBy:snapshot.owner,createdAt:now}
  invocation=await this.invocations.create(invocation);onProgress?.({status:'running',output:''});const started=performance.now();let firstToken:number|undefined
  try{const key=explicitKey??await this.modelKey(provider,modelName),messages:Message[]=[...(rendered.renderedSystemPrompt?[{role:'system' as const,content:rendered.renderedSystemPrompt}]:[]),{role:'user',content:rendered.renderedUserPrompt}],requestOptions={temperature,maxTokens,jsonMode,signal:input.modelOverride?.signal}
   let response:LLMResponse|undefined
   if(streaming){let output='';await this.llm.sendMessageStream(messages,key,{onToken:token=>{firstToken??=performance.now();output+=token;invocation.rawOutput=output;onProgress?.({status:'running',output})},onComplete:value=>{response=value},onError:()=>{}},requestOptions);invocation.rawOutput=response?.content??output}else{response=await this.llm.sendMessageStructured(messages,key,requestOptions);invocation.rawOutput=response.content}
   invocation.completedAt=new Date().toISOString();invocation.latencyMs=Math.round(performance.now()-started);invocation.timeToFirstTokenMs=firstToken?Math.round(firstToken-started):undefined;invocation.status='succeeded';invocation.tokenUsage=normalizeLegacyTotalTokens(response?.metadata?.tokens);invocation.cost=calculateInvocationCost(provider,modelName,invocation.tokenUsage);invocation.outputValidation=validateOutput(invocation.rawOutput,snapshot.outputType);invocation.parsedOutput=invocation.outputValidation.parsedOutput;invocation=await this.invocations.update(invocation);onProgress?.({status:'succeeded',output:invocation.rawOutput});return{invocation,output:invocation.rawOutput,validation:invocation.outputValidation}
  }catch(error){const normalized=normalizeInvocationError(error);invocation.status=normalized.errorType==='cancelled'?'cancelled':'failed';invocation.completedAt=new Date().toISOString();invocation.latencyMs=Math.round(performance.now()-started);Object.assign(invocation,normalized);invocation.outputValidation=validateOutput(invocation.rawOutput,snapshot.outputType);await this.invocations.update(invocation);onProgress?.({status:'failed',output:invocation.rawOutput});throw Object.assign(new Error(normalized.errorMessage),{invocationId:invocation.id,errorType:normalized.errorType})}
 }
}
