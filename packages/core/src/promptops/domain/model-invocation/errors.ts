export type InvocationErrorType='configuration_error'|'missing_api_key'|'authentication_error'|'rate_limit_error'|'timeout_error'|'network_error'|'provider_error'|'invalid_request'|'render_error'|'validation_error'|'cancelled'|'unknown_error'
export interface NormalizedInvocationError{errorType:InvocationErrorType;errorCode:string;errorMessage:string}
const redact=(text:string)=>text.replace(/(api[-_ ]?key|authorization|bearer)\s*[:=]?\s*[A-Za-z0-9._-]+/gi,'$1 [REDACTED]').replace(/sk-[A-Za-z0-9_-]+/g,'[REDACTED]')
export function normalizeInvocationError(error:unknown):NormalizedInvocationError{
 const message=redact(error instanceof Error?error.message:String(error));const lower=message.toLowerCase()
 const type:InvocationErrorType=lower.includes('api key')||lower.includes('apikey')?'missing_api_key':lower.includes('401')||lower.includes('authentication')?'authentication_error':lower.includes('429')||lower.includes('rate limit')?'rate_limit_error':lower.includes('timeout')?'timeout_error':lower.includes('network')||lower.includes('fetch')?'network_error':lower.includes('abort')||lower.includes('cancel')?'cancelled':lower.includes('not found')||lower.includes('not enabled')?'configuration_error':'provider_error'
 return{errorType:type,errorCode:type.toUpperCase(),errorMessage:message.slice(0,500)}
}
