import{describe,expect,it}from'vitest'
import{normalizeTokenUsage}from'../../../src/promptops/domain/model-invocation/token-normalizer'
import{calculateInvocationCost}from'../../../src/promptops/domain/model-invocation/pricing'
import{normalizeInvocationError}from'../../../src/promptops/domain/model-invocation/errors'
describe('invocation domain',()=>{
 it('normalizes OpenAI usage details',()=>expect(normalizeTokenUsage({prompt_tokens:10,completion_tokens:5,total_tokens:15,prompt_tokens_details:{cached_tokens:2},completion_tokens_details:{reasoning_tokens:1}})).toEqual({inputTokens:10,outputTokens:5,totalTokens:15,cachedInputTokens:2,reasoningTokens:1,source:'provider'}))
 it('normalizes Anthropic, Gemini and compatible usage',()=>{expect(normalizeTokenUsage({input_tokens:2,output_tokens:3}).totalTokens).toBe(5);expect(normalizeTokenUsage({promptTokenCount:4,candidatesTokenCount:6,totalTokenCount:10}).totalTokens).toBe(10);expect(normalizeTokenUsage({prompt_tokens:1,completion_tokens:2}).source).toBe('provider')})
 it('does not turn missing usage into zero',()=>expect(normalizeTokenUsage(undefined)).toEqual({source:'unavailable'}))
 it('calculates configured prices',()=>expect(calculateInvocationCost('x','m',{inputTokens:100,outputTokens:200,totalTokens:300,source:'provider'},[{provider:'x',modelName:'m',inputPerMillion:1,outputPerMillion:2,currency:'USD'}]).totalCost).toBe(.0005))
 it('marks unknown pricing unavailable',()=>expect(calculateInvocationCost('x','unknown',{inputTokens:1,outputTokens:1,source:'provider'}).source).toBe('unavailable'))
 it('redacts secrets',()=>expect(normalizeInvocationError(new Error('API key: sk-secretvalue invalid')).errorMessage).not.toContain('sk-secretvalue'))
})
