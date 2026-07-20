export interface ParsedVersionNumber { major:number; minor:number }
const pattern=/^V(0|[1-9]\d*)\.(0|[1-9]\d*)$/
export function parseVersionNumber(value:string):ParsedVersionNumber { const match=pattern.exec(value); if(!match) throw new Error(`Invalid version number: ${value}`); return {major:Number(match[1]),minor:Number(match[2])} }
export const isValidVersionNumber=(value:string):boolean=>pattern.test(value)
export const incrementMinorVersion=(value:string):string=>{const {major,minor}=parseVersionNumber(value);return `V${major}.${minor+1}`}
export const incrementMajorVersion=(value:string):string=>{const {major}=parseVersionNumber(value);return `V${major+1}.0`}
export const compareVersionNumbers=(a:string,b:string):number=>{const left=parseVersionNumber(a),right=parseVersionNumber(b);return left.major-right.major||left.minor-right.minor}
