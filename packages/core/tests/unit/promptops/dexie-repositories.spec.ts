import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DexiePromptRepository, DexieWorkspaceRepository, DexieModelInvocationRepository, PromptOpsDatabase,
  DEFAULT_USER, DEFAULT_WORKSPACE_ID, seedPromptOpsDatabase,
  type Prompt,
} from '../../../src/promptops'

let db: PromptOpsDatabase | undefined
afterEach(async () => { if (db) { await db.delete(); db = undefined } })

const makePrompt = (overrides: Partial<Prompt> = {}): Prompt => {
  const now = '2026-07-20T00:00:00.000Z'
  return { id:'p1',workspaceId:'w1',createdAt:now,updatedAt:now,name:'Support Reply',description:'Reply safely',businessScenario:'Support',category:'Service',department:'CX',owner:DEFAULT_USER,systemPrompt:'Be concise',userPrompt:'Reply to {{message}}',variables:[],outputType:'text',modelProvider:'openai',modelName:'gpt-4.1-mini',temperature:.3,maxTokens:500,status:'draft',riskLevel:'low',currentVersion:'V1.0',...overrides }
}

describe('PromptOps Dexie repositories', () => {
  it('creates, queries, filters, sorts and archives prompts', async () => {
    db = new PromptOpsDatabase(`promptops-test-${crypto.randomUUID()}`)
    const repository = new DexiePromptRepository(db)
    await repository.create(makePrompt())
    await repository.create(makePrompt({ id:'p2',name:'Risk Analysis',status:'published',updatedAt:'2026-07-21T00:00:00.000Z' }))
    expect((await repository.getById('p1'))?.name).toBe('Support Reply')
    expect(await repository.list({ workspaceId:'w1',search:'risk',status:'published' })).toHaveLength(1)
    expect((await repository.list({ workspaceId:'w1',sortBy:'updatedAt',sortDirection:'desc' }))[0].id).toBe('p2')
    await repository.archive('p1')
    expect((await repository.getById('p1'))?.status).toBe('archived')
  })

  it('seeds only an empty database and remains idempotent', async () => {
    db = new PromptOpsDatabase(`promptops-seed-${crypto.randomUUID()}`)
    expect(await seedPromptOpsDatabase(db)).toBe(true)
    expect(await seedPromptOpsDatabase(db)).toBe(false)
    expect(await db.prompts.count()).toBe(8)
    expect(await db.promptVersions.count()).toBe(8)
    expect((await new DexieWorkspaceRepository(db).getById(DEFAULT_WORKSPACE_ID))?.name).toBe('AI Product Team')
  })
})

describe('ModelInvocation repository',()=>{
  it('stores records and supports filters and pagination',async()=>{db=new PromptOpsDatabase(`inv-${crypto.randomUUID()}`);const repo=new DexieModelInvocationRepository(db);const base={id:'i1',workspaceId:'w',promptId:'p',promptName:'Prompt',businessScenario:'test',provider:'mock',modelName:'mock-1',temperature:0,maxTokens:10,streaming:false,jsonMode:false,variableValues:{x:'y'},renderedSystemPrompt:'s',renderedUserPrompt:'u',rawOutput:'ok',status:'succeeded' as const,startedAt:'2026-01-01T00:00:00Z',tokenUsage:{source:'unavailable' as const},cost:{currency:'USD',source:'unavailable' as const},outputValidation:{outputType:'text' as const,valid:true,rawOutput:'ok',diagnostics:[]},createdBy:{id:'u',name:'User',role:'admin' as const},createdAt:'2026-01-01T00:00:00Z'};await repo.create(base);await repo.create({...base,id:'i2',status:'failed',createdAt:'2026-01-02T00:00:00Z'});expect((await repo.list({promptId:'p',status:'succeeded',limit:1})).items.map(x=>x.id)).toEqual(['i1']);expect((await repo.getById('i2'))?.status).toBe('failed')})
})
