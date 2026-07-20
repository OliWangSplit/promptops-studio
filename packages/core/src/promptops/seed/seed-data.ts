import type { Prompt, PromptRiskLevel, PromptStatus } from '../domain/prompt/types'
import { createPromptOpsId } from '../domain/shared/types'
import type { UserSummary, Workspace } from '../domain/workspace/types'
import type { PromptOpsDatabase } from '../persistence/promptops-db'

export const DEFAULT_WORKSPACE_ID = 'workspace-ai-product-team'
export const DEFAULT_USER: UserSummary = {
  id: 'user-alex-chen', name: 'Alex Chen', email: 'alex@example.local', role: 'ai_product_manager'
}

const workspace: Workspace = {
  id: DEFAULT_WORKSPACE_ID,
  name: 'AI Product Team',
  description: 'Enterprise AI product and enablement workspace',
  createdAt: '2026-01-05T01:00:00.000Z',
  updatedAt: '2026-07-18T06:30:00.000Z',
}

type SeedDefinition = Pick<Prompt, 'name' | 'description' | 'businessScenario' | 'category' | 'department' | 'systemPrompt' | 'userPrompt' | 'modelProvider' | 'modelName'> & {
  status: PromptStatus
  riskLevel: PromptRiskLevel
  score?: number
  updatedAt: string
}

const definitions: SeedDefinition[] = [
  { name: 'Customer Complaint Response', description: 'Draft an empathetic, policy-aligned response.', businessScenario: 'Customer complaint handling', category: 'Customer Service', department: 'Customer Experience', systemPrompt: 'You are a senior customer care specialist. Be empathetic and do not promise unsupported remedies.', userPrompt: 'Respond to {{customer_name}} about: {{complaint_content}}', modelProvider: 'openai', modelName: 'gpt-4.1-mini', status: 'published', riskLevel: 'medium', score: 91, updatedAt: '2026-07-18T04:20:00.000Z' },
  { name: 'Project Delay Risk Analysis', description: 'Assess delivery risk and recommend mitigations.', businessScenario: 'Project governance', category: 'Analysis', department: 'PMO', systemPrompt: 'Act as an IT delivery risk analyst. Separate evidence, assumptions and recommendations.', userPrompt: 'Assess {{project_status}} against deadline {{deadline}}.', modelProvider: 'deepseek', modelName: 'deepseek-chat', status: 'testing', riskLevel: 'high', score: 86, updatedAt: '2026-07-19T01:15:00.000Z' },
  { name: 'Sales Lead Summary', description: 'Convert discovery notes into a concise opportunity summary.', businessScenario: 'Lead qualification', category: 'Sales Enablement', department: 'Sales', systemPrompt: 'Summarize facts without inventing budget or authority.', userPrompt: 'Summarize these discovery notes: {{notes}}', modelProvider: 'openai', modelName: 'gpt-4.1-mini', status: 'draft', riskLevel: 'low', updatedAt: '2026-07-14T08:10:00.000Z' },
  { name: 'Meeting Action Extractor', description: 'Extract owned, dated action items in JSON.', businessScenario: 'Meeting follow-up', category: 'Productivity', department: 'Operations', systemPrompt: 'Return valid JSON with action, owner and dueDate fields.', userPrompt: 'Extract actions from: {{meeting_notes}}', modelProvider: 'gemini', modelName: 'gemini-2.5-flash', status: 'published', riskLevel: 'low', score: 94, updatedAt: '2026-07-17T11:00:00.000Z' },
  { name: 'Contract Clause Risk Review', description: 'Flag potentially material commercial and privacy clauses.', businessScenario: 'Contract triage', category: 'Risk Review', department: 'Legal', systemPrompt: 'Assist with triage only. Do not present output as legal advice.', userPrompt: 'Review the following clause: {{contract_clause}}', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', status: 'pending_approval', riskLevel: 'high', score: 88, updatedAt: '2026-07-20T00:40:00.000Z' },
  { name: 'Recruitment JD Optimizer', description: 'Improve clarity and inclusiveness of a job description.', businessScenario: 'Recruitment content', category: 'Content', department: 'People & Culture', systemPrompt: 'Preserve role requirements and remove exclusionary language.', userPrompt: 'Improve this job description: {{job_description}}', modelProvider: 'openai', modelName: 'gpt-4.1-mini', status: 'draft', riskLevel: 'medium', updatedAt: '2026-07-12T03:45:00.000Z' },
  { name: 'Weekly Status Report', description: 'Turn delivery updates into an executive weekly report.', businessScenario: 'Executive reporting', category: 'Reporting', department: 'PMO', systemPrompt: 'Use concise headings: Progress, Risks, Decisions, Next Steps.', userPrompt: 'Prepare a report from: {{weekly_updates}}', modelProvider: 'deepseek', modelName: 'deepseek-chat', status: 'testing', riskLevel: 'low', score: 84, updatedAt: '2026-07-16T06:25:00.000Z' },
  { name: 'Marketing Compliance Check', description: 'Review campaign copy for unsupported claims.', businessScenario: 'Campaign compliance', category: 'Compliance', department: 'Marketing', systemPrompt: 'Identify claims requiring substantiation and provide safer alternatives.', userPrompt: 'Review this campaign copy: {{campaign_copy}}', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', status: 'archived', riskLevel: 'high', score: 79, updatedAt: '2026-06-30T02:00:00.000Z' },
]

const variablePattern = /{{\s*([a-zA-Z_][\w]*)\s*}}/g
const buildPrompt = (definition: SeedDefinition, index: number): Prompt => {
  const variableNames = [...new Set([...definition.systemPrompt.matchAll(variablePattern), ...definition.userPrompt.matchAll(variablePattern)].map((match) => match[1]))]
  return {
    id: `prompt-seed-${index + 1}`, workspaceId: workspace.id,
    createdAt: '2026-01-10T01:00:00.000Z',
    ...definition, owner: DEFAULT_USER,
    variables: variableNames.map((name) => ({ id: createPromptOpsId(), name, displayName: name.replace(/_/g, ' '), type: 'text', required: true })),
    temperature: 0.3, maxTokens: 1600, currentVersion: 'V1.0', outputType: definition.name === 'Meeting Action Extractor' ? 'json' : 'text',
    lastEvaluationScore: definition.score,
    lastEvaluatedAt: definition.score ? definition.updatedAt : undefined,
    expectedOutputFormat: definition.name === 'Meeting Action Extractor' ? 'JSON' : undefined,
  }
}

export const seedPromptOpsDatabase = async (db: PromptOpsDatabase): Promise<boolean> => db.transaction('rw', db.workspaces, db.prompts, db.promptVersions, async () => {
  if (await db.workspaces.count() > 0 || await db.prompts.count() > 0) return false
  await db.workspaces.add(workspace)
  const prompts=definitions.map(buildPrompt)
  await db.prompts.bulkAdd(prompts.map((prompt) => ({ ...prompt, ownerId: prompt.owner.id })))
  await db.promptVersions.bulkAdd(prompts.map((prompt)=>({id:`version-seed-${prompt.id}-v1-0`,workspaceId:prompt.workspaceId,promptId:prompt.id,versionNumber:'V1.0',name:prompt.name,description:prompt.description,businessScenario:prompt.businessScenario,category:prompt.category,department:prompt.department,owner:prompt.owner,systemPrompt:prompt.systemPrompt,userPrompt:prompt.userPrompt,variables:prompt.variables,expectedOutputFormat:prompt.expectedOutputFormat,outputType:prompt.outputType,modelProvider:prompt.modelProvider,modelName:prompt.modelName,temperature:prompt.temperature,maxTokens:prompt.maxTokens,status:prompt.status==='pending_approval'?'testing':prompt.status,riskLevel:prompt.riskLevel,changeSummary:'Initial version',createdBy:prompt.owner,createdAt:prompt.createdAt,evaluationScore:prompt.lastEvaluationScore})))
  return true
})
