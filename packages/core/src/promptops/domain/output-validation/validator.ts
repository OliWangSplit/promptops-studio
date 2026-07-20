import type { PromptOutputType } from '../prompt/types'
import type { OutputValidationResult } from './types'
const MAX_JSON_LENGTH=5_000_000
export function validateOutput(rawOutput:string,outputType:PromptOutputType):OutputValidationResult {
  const result:OutputValidationResult={outputType,valid:true,rawOutput,diagnostics:[]}
  if(!rawOutput.trim()){result.diagnostics.push({severity:'warning',code:'empty_output',message:'The model returned an empty output'});return result}
  if(outputType!=='json') return result
  if(rawOutput.length>MAX_JSON_LENGTH){result.valid=false;result.diagnostics.push({severity:'error',code:'too_large',message:'JSON output is too large to parse safely'});return result}
  try{result.parsedOutput=JSON.parse(rawOutput)}catch{result.valid=false;result.diagnostics.push({severity:'error',code:'invalid_json',message:'The output is not valid JSON'})}
  return result
}
