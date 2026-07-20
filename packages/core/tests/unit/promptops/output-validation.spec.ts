import {describe,expect,it} from 'vitest'
import {validateOutput} from '../../../src/promptops/domain/output-validation/validator'
describe('validateOutput',()=>{
 it('preserves text and markdown',()=>{expect(validateOutput('hello','text').rawOutput).toBe('hello');expect(validateOutput('# hi','markdown').valid).toBe(true)})
 it('warns for empty output',()=>expect(validateOutput('','text').diagnostics[0]?.code).toBe('empty_output'))
 it('parses JSON objects, arrays and primitives',()=>{expect(validateOutput('{"a":1}','json').parsedOutput).toEqual({a:1});expect(validateOutput('[1]','json').parsedOutput).toEqual([1]);expect(validateOutput('true','json').parsedOutput).toBe(true)})
 it('retains invalid raw JSON without repair',()=>{const r=validateOutput('{a:1}','json');expect(r.valid).toBe(false);expect(r.rawOutput).toBe('{a:1}');expect(r.parsedOutput).toBeUndefined()})
})
