import { describe, expect, it } from 'vitest'
import { BatchEvaluationService } from '../../../src/promptops/application/batch-evaluation-service'
import type { EvaluationResult, EvaluationRun } from '../../../src/promptops/domain/evaluation/types'
import type { DatasetTestCase } from '../../../src/promptops/domain/dataset/types'

const cases: DatasetTestCase[] = [
  { id:'ok',workspaceId:'w',datasetId:'d',name:'OK',variables:{name:'Ada'},expectedValidation:{contains:['hello']},createdAt:'x',updatedAt:'x' },
  { id:'fail',workspaceId:'w',datasetId:'d',name:'Provider failure',variables:{name:'fail'},createdAt:'x',updatedAt:'x' },
  { id:'skip',workspaceId:'w',datasetId:'d',name:'Missing variable',variables:{},createdAt:'x',updatedAt:'x' },
]

function setup() {
  const runs = new Map<string, EvaluationRun>(), results = new Map<string, EvaluationResult>()
  const runRepo = { create: async(value:EvaluationRun)=>{runs.set(value.id,structuredClone(value));return structuredClone(value)}, update:async(value:EvaluationRun)=>{runs.set(value.id,structuredClone(value));return structuredClone(value)}, getById:async(id:string)=>structuredClone(runs.get(id)), list:async(query:{status?:string}={})=>{const items=[...runs.values()].filter(item=>!query.status||item.status===query.status);return{items:structuredClone(items),total:items.length,limit:100,offset:0}}, delete:async(id:string)=>{runs.delete(id)},clear:async()=>runs.clear() }
  const resultRepo = { create:async(value:EvaluationResult)=>{results.set(value.id,structuredClone(value));return structuredClone(value)},update:async(value:EvaluationResult)=>{results.set(value.id,structuredClone(value));return structuredClone(value)},getById:async(id:string)=>structuredClone(results.get(id)),list:async(query:{evaluationRunId?:string;status?:string}={})=>structuredClone([...results.values()].filter(item=>(!query.evaluationRunId||item.evaluationRunId===query.evaluationRunId)&&(!query.status||item.status===query.status))),deleteByRunId:async(id:string)=>{for(const item of results.values())if(item.evaluationRunId===id)results.delete(item.id)},clear:async()=>results.clear() }
  const promptInvocation = { run: async(input:{variableValues:Record<string,unknown>})=>{if(input.variableValues.name==='fail')throw Object.assign(new Error('safe provider failure'),{invocationId:'inv-fail'});return{output:'hello Ada',validation:{valid:true,outputType:'text',diagnostics:[]},invocation:{id:'inv-ok',latencyMs:25,tokenUsage:{source:'provider',inputTokens:2,outputTokens:3,totalTokens:5},cost:{source:'unavailable',currency:'USD'}}}} }
  const service = new BatchEvaluationService(
    {getById:async()=>({id:'d',workspaceId:'w',name:'Dataset',description:'',status:'active',createdAt:'x',updatedAt:'x'})} as never,
    {listByDatasetId:async()=>structuredClone(cases)} as never,
    {getById:async()=>({id:'p',workspaceId:'w',name:'Prompt',status:'published'})} as never,
    {getById:async()=>({id:'v',promptId:'p',versionNumber:'V1.0',variables:[{id:'x',name:'name',displayName:'Name',type:'text',required:true}],outputType:'text'})} as never,
    {getModel:async()=>({id:'cfg',name:'Mock',enabled:true,providerMeta:{id:'mock'},modelMeta:{id:'model'}})} as never,
    promptInvocation as never,
    {getById:async()=>({id:'inv-fail',latencyMs:10,tokenUsage:{source:'unavailable'},cost:{source:'unavailable',currency:'USD'},errorType:'provider',errorMessage:'safe provider failure'})} as never,
    runRepo as never,resultRepo as never
  )
  return {service,runs,results,runRepo,resultRepo}
}

const waitForTerminal = async (runs: Map<string, EvaluationRun>, id: string) => { for(let attempt=0;attempt<100;attempt++){const run=runs.get(id);if(run&& !['queued','running'].includes(run.status))return run;await new Promise(resolve=>setTimeout(resolve,5))}throw new Error('Run did not finish') }

describe('Phase 4 BatchEvaluationService',()=>{
  it('isolates case failures, skips invalid input, persists progress and creates retry runs',async()=>{const{service,runs,results}=setup();const run=await service.start({workspaceId:'w',datasetId:'d',promptId:'p',promptVersionId:'v',modelConfigKey:'cfg',providerId:'mock',modelId:'model',temperature:.2,maxTokens:100,concurrency:2});const completed=await waitForTerminal(runs,run.id);expect(completed.status).toBe('completed_with_errors');expect(completed.progressPercent).toBe(100);expect([...results.values()].map(item=>item.status).sort()).toEqual(['failed','skipped','succeeded']);expect([...results.values()].find(item=>item.status==='skipped')?.invocationId).toBeUndefined();expect(completed.metrics?.invocationSuccessRate).toBe(50);const retry=await service.retry(run.id,'failed');expect(retry.id).not.toBe(run.id);expect(retry.sourceRunId).toBe(run.id);expect(runs.get(run.id)?.status).toBe('completed_with_errors')})
  it('recovers interrupted work idempotently and preserves completed rows',async()=>{const{service,runs,results}=setup();const run=await service.start({workspaceId:'w',datasetId:'d',promptId:'p',promptVersionId:'v',modelConfigKey:'cfg',temperature:.2,maxTokens:100,concurrency:1});await service.cancel(run.id);await waitForTerminal(runs,run.id);const before=[...results.values()].filter(item=>item.evaluationRunId===run.id&&item.status==='succeeded').length;expect(await service.recoverInterruptedEvaluationRuns('w')).toBe(0);expect([...results.values()].filter(item=>item.evaluationRunId===run.id&&item.status==='succeeded')).toHaveLength(before)})
})
