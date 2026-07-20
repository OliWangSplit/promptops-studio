import type { PromptVariable } from '../prompt/types'
import type { PromptRenderDiagnostic, PromptRenderInput, PromptRenderResult } from './types'

const unsafe = new Set(['__proto__','constructor','prototype'])
const token = /{{\s*([A-Za-z_][A-Za-z0-9_]*)\s*}}/g

function normalize(variable:PromptVariable,value:unknown,diagnostics:PromptRenderDiagnostic[]):unknown {
  if (value === undefined || value === null || value === '') return variable.defaultValue ?? ''
  if (variable.type === 'number') { const result=typeof value==='number'?value:Number(value); if(!Number.isFinite(result)) diagnostics.push({code:'invalid_type',variable:variable.name,message:`${variable.name} must be a number`}); return result }
  if (variable.type === 'boolean') { if(typeof value==='boolean') return value; if(value==='true'||value==='1') return true; if(value==='false'||value==='0') return false; diagnostics.push({code:'invalid_type',variable:variable.name,message:`${variable.name} must be a boolean`}); return value }
  if (variable.type === 'date') { const date=new Date(String(value)); if(Number.isNaN(date.valueOf())) diagnostics.push({code:'invalid_type',variable:variable.name,message:`${variable.name} must be a date`}); else return date.toISOString().slice(0,10) }
  if (variable.type === 'select' && !variable.options?.includes(String(value))) diagnostics.push({code:'invalid_option',variable:variable.name,message:`${variable.name} is not an allowed option`})
  return String(value)
}

export function renderPrompt(input:PromptRenderInput):PromptRenderResult {
  const diagnostics:PromptRenderDiagnostic[]=[]; const normalizedValues:Record<string,unknown>=Object.create(null)
  for(const variable of input.variables.filter(item=>!item.unused)) {
    if(unsafe.has(variable.name)) { diagnostics.push({code:'unsafe_name',variable:variable.name,message:`${variable.name} is not allowed`}); continue }
    const supplied=Object.prototype.hasOwnProperty.call(input.values,variable.name); const value=normalize(variable,supplied?input.values[variable.name]:undefined,diagnostics)
    if(variable.required&&(value===''||value===undefined||value===null)) diagnostics.push({code:'missing_required',variable:variable.name,message:`${variable.name} is required`})
    normalizedValues[variable.name]=value
  }
  const replace=(source:string)=>source.replace(token,(whole:string,name:string)=>unsafe.has(name)?whole:String(normalizedValues[name]??''))
  const names=new Set(input.variables.map(item=>item.name)); const unusedProvidedVariables=Object.keys(input.values).filter(name=>!names.has(name)||unsafe.has(name))
  const missingRequiredVariables=diagnostics.filter(item=>item.code==='missing_required').map(item=>item.variable)
  return {renderedSystemPrompt:replace(input.systemPrompt),renderedUserPrompt:replace(input.userPrompt),normalizedValues:{...normalizedValues},missingRequiredVariables,unusedProvidedVariables,diagnostics,valid:diagnostics.length===0}
}
