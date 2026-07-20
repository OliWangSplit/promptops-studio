import{describe,expect,it}from'vitest'
import{readFileSync}from'node:fs'
import{resolve}from'node:path'
const root=resolve(import.meta.dirname,'../..')
const read=(path:string)=>readFileSync(resolve(root,path),'utf8')
describe('PromptOps Phase 3 UI wiring',()=>{
 it('registers all playground and invocation routes',()=>{const router=read('src/router/index.ts');for(const path of ['/playground/:promptId','/playground/:promptId/version/:versionId','/invocations','/invocations/:invocationId'])expect(router).toContain(path)})
 it('uses repositories and invocation service instead of Dexie in pages',()=>{const playground=read('src/pages/playground/PromptPlaygroundPage.vue');expect(playground).toContain('promptInvocationService.run');expect(playground).toContain('invocationRepository.list');expect(playground).not.toContain('Dexie')})
 it('supports route reload, required validation and duplicate-run guard',()=>{const page=read('src/pages/playground/PromptPlaygroundPage.vue');expect(page).toContain('watch(selectedPromptId');expect(page).toContain('rendered.value.valid');expect(page).toContain('running.value)return')})
 it('history supports filters, pagination, clear confirmation and detail',()=>{const history=read('src/pages/invocations/InvocationHistoryPage.vue');expect(history).toContain('status:');expect(history).toContain('offset:items.value.length');expect(history).toContain("confirm('Clear invocation history?");expect(history).toContain('/invocations/${item.id}')})
 it('detail supports not found, snapshots and retry',()=>{const detail=read('src/pages/invocations/InvocationDetailPage.vue');expect(detail).toContain('Invocation not found');expect(detail).toContain('Rendered System Prompt');expect(detail).toContain('const retry=')})
})
