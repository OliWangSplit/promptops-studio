import { inject, type InjectionKey } from 'vue'
import {
  DexiePromptRepository, DexiePromptVersionRepository, DexieWorkspaceRepository, DexieModelInvocationRepository, PromptEditorService, PromptQueryService, PromptInvocationService,
  LocalStorageProvider, createModelManager, createLLMService,
  getPromptOpsDatabase, seedPromptOpsDatabase,
  type PromptRepository, type PromptVersionRepository, type WorkspaceRepository, type ModelInvocationRepository, type IModelManager, type ILLMService,
} from '@prompt-optimizer/core'

export interface PromptOpsServices {
  promptRepository: PromptRepository
  workspaceRepository: WorkspaceRepository
  promptQueryService: PromptQueryService
  promptVersionRepository: PromptVersionRepository
  promptEditorService: PromptEditorService
  invocationRepository: ModelInvocationRepository
  promptInvocationService: PromptInvocationService
  modelManager: IModelManager
  initialize(): Promise<void>
}

let services: PromptOpsServices | undefined
export const getPromptOpsServices = (): PromptOpsServices => {
  if (services) return services
  const db = getPromptOpsDatabase()
  const promptRepository = new DexiePromptRepository(db)
  const workspaceRepository = new DexieWorkspaceRepository(db)
  const promptVersionRepository = new DexiePromptVersionRepository(db)
  const invocationRepository = new DexieModelInvocationRepository(db)
  const modelManager = createModelManager(new LocalStorageProvider())
  const mockMode = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('promptops.e2e.mock') : null
  const mockLlm: ILLMService = {
    async sendMessage(){return '{"mock":true}'},
    async sendMessageStructured(){if(sessionStorage.getItem('promptops.e2e.mock')==='failure')throw new Error('Mock provider failure');return{content:'{"mock":true}',metadata:{model:'promptops-mock',tokens:12}}},
    async sendMessageStream(_messages,_provider,callbacks){if(sessionStorage.getItem('promptops.e2e.mock')==='failure'){const error=new Error('Mock provider failure');callbacks.onError(error);throw error}callbacks.onToken('{"mock":');callbacks.onToken('true}');callbacks.onComplete({content:'{"mock":true}',metadata:{model:'promptops-mock',tokens:12}})},
    async sendMessageStreamWithTools(messages,provider,_tools,callbacks){return this.sendMessageStream(messages,provider,callbacks)},
    async testConnection(){},async fetchModelList(){return[{value:'promptops-mock',label:'PromptOps Mock'}]},
  }
  const llmService = mockMode ? mockLlm : createLLMService(modelManager)
  services = {
    promptRepository,
    workspaceRepository,
    promptQueryService: new PromptQueryService(promptRepository),
    promptVersionRepository,
    promptEditorService: new PromptEditorService(db,promptRepository,promptVersionRepository),
    invocationRepository,
    promptInvocationService: new PromptInvocationService(promptRepository,promptVersionRepository,invocationRepository,llmService,mockMode?undefined:modelManager),
    modelManager,
    initialize: async () => { await Promise.all([seedPromptOpsDatabase(db),modelManager.ensureInitialized()]) },
  }
  return services
}

export const promptOpsServicesKey: InjectionKey<PromptOpsServices> = Symbol('promptOpsServices')
export const usePromptOpsServices = (): PromptOpsServices => {
  const value = inject(promptOpsServicesKey)
  if (!value) throw new Error('PromptOps services are not available')
  return value
}
