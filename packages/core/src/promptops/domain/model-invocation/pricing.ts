import type {InvocationCost,InvocationTokenUsage} from './types'
export interface ModelPrice{provider:string;modelName:string;inputPerMillion:number;outputPerMillion:number;currency:string}
export const DEFAULT_MODEL_PRICES:readonly ModelPrice[]=[
 {provider:'openai',modelName:'gpt-4.1-mini',inputPerMillion:.4,outputPerMillion:1.6,currency:'USD'},
 {provider:'anthropic',modelName:'claude-3-5-haiku-latest',inputPerMillion:.8,outputPerMillion:4,currency:'USD'},
 {provider:'gemini',modelName:'gemini-2.0-flash',inputPerMillion:.1,outputPerMillion:.4,currency:'USD'},
]
export function calculateInvocationCost(provider:string,modelName:string,usage:InvocationTokenUsage,prices:readonly ModelPrice[]=DEFAULT_MODEL_PRICES):InvocationCost{
 const price=prices.find(item=>item.provider===provider&&item.modelName===modelName)
 if(!price||usage.inputTokens===undefined||usage.outputTokens===undefined)return{currency:price?.currency??'USD',source:'unavailable'}
 const inputCost=usage.inputTokens/1_000_000*price.inputPerMillion,outputCost=usage.outputTokens/1_000_000*price.outputPerMillion
 return{inputCost,outputCost,totalCost:inputCost+outputCost,currency:price.currency,source:usage.source==='estimated'?'estimated_tokens':'configured_price'}
}
