import type { PromptOpsPrompt as Prompt } from '@prompt-optimizer/core'
const KEY='promptops.playground.snapshot.v1'
export interface PromptPlaygroundSnapshot {promptId:string;promptName:string;systemPrompt:string;userPrompt:string;variables:Prompt['variables'];modelProvider:string;modelName:string;temperature:number;maxTokens:number;createdAt:string}
export const PromptPlaygroundBridge={
  save(prompt:Prompt){const value:PromptPlaygroundSnapshot={promptId:prompt.id,promptName:prompt.name,systemPrompt:prompt.systemPrompt,userPrompt:prompt.userPrompt,variables:structuredClone(prompt.variables),modelProvider:prompt.modelProvider,modelName:prompt.modelName,temperature:prompt.temperature,maxTokens:prompt.maxTokens,createdAt:new Date().toISOString()};sessionStorage.setItem(KEY,JSON.stringify(value));return value},
  load():PromptPlaygroundSnapshot|undefined{const raw=sessionStorage.getItem(KEY);if(!raw)return;try{return JSON.parse(raw) as PromptPlaygroundSnapshot}catch{return}},clear(){sessionStorage.removeItem(KEY)}
}
