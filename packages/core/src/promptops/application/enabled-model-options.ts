import type { IModelManager, TextModelConfig } from '../../services/model/types'

export interface EnabledModelOption {
  configKey: string
  providerId: string
  modelId: string
  displayName: string
  enabled: true
  defaultTemperature?: number
  defaultMaxTokens?: number
}

export interface EvaluationModelIdentity {
  modelConfigKey: string
  providerId: string
  modelId: string
  displayName: string
}

function numberOverride(config: TextModelConfig, key: string): number | undefined {
  const value = config.paramOverrides?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export async function listEnabledModelOptions(manager: IModelManager): Promise<EnabledModelOption[]> {
  const models = await manager.getEnabledModels()
  return models.map(config => ({
    configKey: config.id,
    providerId: config.providerMeta.id,
    modelId: config.modelMeta.id,
    displayName: config.name || config.modelMeta.name || config.modelMeta.id,
    enabled: true as const,
    defaultTemperature: numberOverride(config, 'temperature'),
    defaultMaxTokens: numberOverride(config, 'max_tokens')
  })).sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export async function resolveEnabledModelIdentity(
  manager: IModelManager,
  identity: Pick<EvaluationModelIdentity, 'modelConfigKey'> & Partial<Pick<EvaluationModelIdentity, 'providerId' | 'modelId'>>
): Promise<EvaluationModelIdentity> {
  const config = await manager.getModel(identity.modelConfigKey)
  if (!config) throw new Error(`Model configuration not found: ${identity.modelConfigKey}`)
  if (!config.enabled) throw new Error(`Model configuration is disabled: ${identity.modelConfigKey}`)
  if (identity.providerId && identity.providerId !== config.providerMeta.id) throw new Error('Model provider configuration changed')
  if (identity.modelId && identity.modelId !== config.modelMeta.id) throw new Error('Model configuration changed')
  return {
    modelConfigKey: identity.modelConfigKey,
    providerId: config.providerMeta.id,
    modelId: config.modelMeta.id,
    displayName: config.name || config.modelMeta.name || config.modelMeta.id
  }
}
