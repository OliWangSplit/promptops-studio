import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { applyPromptQuery, PromptQueryService, PROMPT_STATUSES, type PromptOpsPrompt as Prompt, type PromptRepository } from '@prompt-optimizer/core'
import DashboardPage from '../../src/pages/dashboard/DashboardPage.vue'
import PromptLibraryPage from '../../src/pages/prompts/PromptLibraryPage.vue'
import { promptOpsServicesKey, type PromptOpsServices } from '../../src/services/promptops'

const LinkStub = defineComponent({ props: ['to'], setup: (_, { slots }) => () => h('a', slots.default?.()) })
const makePrompt = (overrides: Partial<Prompt> = {}): Prompt => ({ id:'p1',workspaceId:'workspace-ai-product-team',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-07-01T00:00:00Z',name:'Complaint Reply',description:'Customer complaint',businessScenario:'Support',category:'Service',department:'CX',owner:{id:'u1',name:'Alex',role:'editor'},systemPrompt:'',userPrompt:'',variables:[],modelProvider:'openai',modelName:'gpt',temperature:.3,maxTokens:500,status:'draft',riskLevel:'high',currentVersion:'V1.0',lastEvaluationScore:80,...overrides })

const setup = () => {
  const items = [makePrompt(), makePrompt({ id:'p2',name:'Risk Analysis',description:'Delivery risk',status:'published',riskLevel:'low',lastEvaluationScore:100 })]
  const repository: PromptRepository = {
    getById: vi.fn(async id => items.find(item => item.id === id)),
    list: vi.fn(async query => applyPromptQuery(items, query)),
    countByStatus: vi.fn(async () => Object.fromEntries(PROMPT_STATUSES.map(status => [status, items.filter(item => item.status === status).length])) as Record<typeof PROMPT_STATUSES[number],number>),
    create: vi.fn(async prompt => { items.push(prompt); return prompt }), update: vi.fn(async prompt => prompt),
    archive: vi.fn(async id => { const item=items.find(value=>value.id===id); if(item)item.status='archived' }),
  }
  const services = { promptRepository:repository,workspaceRepository:{} as PromptOpsServices['workspaceRepository'],promptQueryService:new PromptQueryService(repository),initialize:vi.fn() } satisfies PromptOpsServices
  const testRouter = createRouter({ history:createMemoryHistory(), routes:[{path:'/:pathMatch(.*)*',component:defineComponent({render:()=>h('div')})}] })
  const global = { plugins:[createPinia(),testRouter],provide:{[promptOpsServicesKey as symbol]:services},stubs:{RouterLink:LinkStub} }
  return { repository, global }
}

describe('PromptOps pages', () => {
  it('renders Dashboard KPI values from repository aggregation', async () => {
    const { global } = setup(); const wrapper=mount(DashboardPage,{global}); await flushPromises()
    expect(wrapper.findAll('[data-testid="kpi"]').map(node=>node.text())).toEqual(expect.arrayContaining([expect.stringContaining('2'),expect.stringContaining('90.0')]))
  })
  it('searches, shows empty state and archives through the repository', async () => {
    const { global, repository }=setup(); const wrapper=mount(PromptLibraryPage,{global}); await flushPromises()
    expect(wrapper.findAll('[data-testid="prompt-row"]')).toHaveLength(2)
    await wrapper.get('[data-testid="prompt-search"]').setValue('missing'); await flushPromises(); expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    await wrapper.get('[data-testid="prompt-search"]').setValue('Complaint'); await flushPromises(); await wrapper.get('[data-testid="archive-action"]').trigger('click'); await wrapper.get('[data-testid="confirm-archive"]').trigger('click'); await flushPromises()
    expect(repository.archive).toHaveBeenCalledWith('p1')
  })
})
