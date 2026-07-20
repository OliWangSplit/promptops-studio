import {describe,expect,it} from 'vitest'
import {renderPrompt} from '../../../src/promptops/domain/prompt-rendering/renderer'
import type {PromptVariable} from '../../../src/promptops/domain/prompt/types'
const variable=(name:string,extra:Partial<PromptVariable>={}):PromptVariable=>({id:name,name,displayName:name,type:'text',required:true,...extra})
describe('renderPrompt',()=>{
 it('renders both prompts and repeated variables',()=>{const r=renderPrompt({systemPrompt:'Hi {{name}}',userPrompt:'{{name}}!',variables:[variable('name')],values:{name:'Ada'}});expect(r.renderedSystemPrompt).toBe('Hi Ada');expect(r.renderedUserPrompt).toBe('Ada!')})
 it('reports missing required values',()=>expect(renderPrompt({systemPrompt:'{{x}}',userPrompt:'',variables:[variable('x')],values:{}}).missingRequiredVariables).toEqual(['x']))
 it('normalizes defaults, number, boolean, date and textarea',()=>{const vars=[variable('n',{type:'number'}),variable('b',{type:'boolean'}),variable('d',{type:'date'}),variable('t',{type:'textarea'}),variable('x',{required:false,defaultValue:'fallback'})];const r=renderPrompt({systemPrompt:'{{n}} {{b}} {{d}} {{t}} {{x}}',userPrompt:'',variables:vars,values:{n:'2',b:'false',d:'2026-07-20',t:'a\nb'}});expect(r.renderedSystemPrompt).toBe('2 false 2026-07-20 a\nb fallback')})
 it('rejects illegal select values',()=>expect(renderPrompt({systemPrompt:'{{x}}',userPrompt:'',variables:[variable('x',{type:'select',options:['a']})],values:{x:'b'}}).valid).toBe(false))
 it('blocks prototype keys and reports extras',()=>{const r=renderPrompt({systemPrompt:'{{constructor}} {plain}',userPrompt:'',variables:[variable('constructor')],values:{extra:1}});expect(r.renderedSystemPrompt).toBe('{{constructor}} {plain}');expect(r.unusedProvidedVariables).toContain('extra');expect(r.valid).toBe(false)})
 it('never evaluates template content',()=>expect(renderPrompt({systemPrompt:'{{x}}',userPrompt:'',variables:[variable('x')],values:{x:'${globalThis.alert(1)}'}}).renderedSystemPrompt).toContain('${globalThis.alert(1)}'))
})
