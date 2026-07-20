import type {InvocationTokenUsage} from './types'
type UsageRecord=Record<string,unknown>
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:undefined
export function normalizeTokenUsage(value:unknown):InvocationTokenUsage{
 if(!value||typeof value!=='object')return{source:'unavailable'}
 const u=value as UsageRecord
 const input=number(u.input_tokens)??number(u.prompt_tokens)??number(u.promptTokenCount)
 const output=number(u.output_tokens)??number(u.completion_tokens)??number(u.candidatesTokenCount)
 const total=number(u.total_tokens)??number(u.totalTokenCount)??(input!==undefined&&output!==undefined?input+output:undefined)
 const cached=number(u.cached_input_tokens)??number((u.prompt_tokens_details as UsageRecord|undefined)?.cached_tokens)
 const reasoning=number(u.reasoning_tokens)??number((u.completion_tokens_details as UsageRecord|undefined)?.reasoning_tokens)
 return input===undefined&&output===undefined&&total===undefined?{source:'unavailable'}:{inputTokens:input,outputTokens:output,totalTokens:total,cachedInputTokens:cached,reasoningTokens:reasoning,source:'provider'}
}
export function normalizeLegacyTotalTokens(total:unknown):InvocationTokenUsage{return typeof total==='number'&&Number.isFinite(total)?{totalTokens:total,source:'provider'}:{source:'unavailable'}}
