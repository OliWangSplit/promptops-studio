import { describe, expect, it, vi } from 'vitest'
import { LLMService } from '../../../src/services/llm/service'
import { listEnabledModelOptions, resolveEnabledModelIdentity } from '../../../src/promptops/application/enabled-model-options'
import type { TextModelConfig } from '../../../src/services/model/types'

const config = (overrides: Partial<TextModelConfig> = {}): TextModelConfig => ({
  id: 'config-a', name: 'Model A', enabled: true,
  providerMeta: { id: 'provider-a', name: 'Provider A', requiresApiKey: false, defaultBaseURL: '', supportsDynamicModels: false },
  modelMeta: { id: 'model-a', name: 'Model A', capabilities: { supportsTools: false, supportsReasoning: false, supportsMultimodal: false }, parameterDefinitions: [] },
  connectionConfig: {}, paramOverrides: { temperature: 0.4, max_tokens: 100 }, ...overrides
})

describe('Phase 4 model identity and request overrides', () => {
  it('lists only enabled configs with all three identity levels', async () => {
    const manager = { getEnabledModels: vi.fn(async () => [config()]) }
    await expect(listEnabledModelOptions(manager as never)).resolves.toEqual([expect.objectContaining({
      configKey: 'config-a', providerId: 'provider-a', modelId: 'model-a', enabled: true
    })])
  })

  it('rejects disabled and changed identities without fuzzy fallback', async () => {
    const disabled = { getModel: vi.fn(async () => config({ enabled: false })) }
    await expect(resolveEnabledModelIdentity(disabled as never, { modelConfigKey: 'config-a' })).rejects.toThrow('disabled')
    const manager = { getModel: vi.fn(async () => config()) }
    await expect(resolveEnabledModelIdentity(manager as never, { modelConfigKey: 'config-a', modelId: 'other' })).rejects.toThrow('changed')
  })

  it('keeps concurrent request overrides isolated and leaves persisted config untouched', () => {
    const persisted = config()
    const service = new LLMService({} as never, {} as never)
    const first = service['prepareRuntimeConfig'](persisted, { temperature: 0.1, maxTokens: 10 })
    const second = service['prepareRuntimeConfig'](persisted, { temperature: 0.9, maxTokens: 900 })
    expect(first.paramOverrides).toMatchObject({ temperature: 0.1, max_tokens: 10 })
    expect(second.paramOverrides).toMatchObject({ temperature: 0.9, max_tokens: 900 })
    expect(persisted.paramOverrides).toEqual({ temperature: 0.4, max_tokens: 100 })
  })
})
