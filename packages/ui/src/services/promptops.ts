import { inject, type InjectionKey } from 'vue'
import {
  DexiePromptRepository, DexiePromptVersionRepository, DexieWorkspaceRepository, DexieModelInvocationRepository, PromptEditorService, PromptQueryService, PromptInvocationService,
  DexieDatasetRepository, DexieDatasetTestCaseRepository, DatasetService, DatasetQueryService,
  DexieEvaluationRunRepository, DexieEvaluationResultRepository, EvaluationQueryService, BatchEvaluationService,
  LocalStorageProvider, createModelManager, createLLMService,
  getPromptOpsDatabase, seedPromptOpsDatabase,
  type PromptRepository, type PromptVersionRepository, type WorkspaceRepository, type ModelInvocationRepository, type DatasetRepository, type DatasetTestCaseRepository, type EvaluationRunRepository, type EvaluationResultRepository, type IModelManager, type ILLMService, type TextModelConfig,
} from '@prompt-optimizer/core'

export interface PromptOpsServices {
  promptRepository: PromptRepository
  workspaceRepository: WorkspaceRepository
  promptQueryService: PromptQueryService
  promptVersionRepository: PromptVersionRepository
  promptEditorService: PromptEditorService
  invocationRepository: ModelInvocationRepository
  promptInvocationService: PromptInvocationService
  datasetRepository: DatasetRepository
  datasetTestCaseRepository: DatasetTestCaseRepository
  datasetService: DatasetService
  datasetQueryService: DatasetQueryService
  evaluationRunRepository: EvaluationRunRepository
  evaluationResultRepository: EvaluationResultRepository
  evaluationQueryService: EvaluationQueryService
  batchEvaluationService: BatchEvaluationService
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
  const datasetRepository = new DexieDatasetRepository(db)
  const datasetTestCaseRepository = new DexieDatasetTestCaseRepository(db)
  const evaluationRunRepository = new DexieEvaluationRunRepository(db)
  const evaluationResultRepository = new DexieEvaluationResultRepository(db)
  const modelManager = createModelManager(new LocalStorageProvider())
  const mockMode = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('promptops.e2e.mock') : null
  const mockLlm: ILLMService = {
    async sendMessage(){return '{"mock":true}'},
    async sendMessageStructured(messages){const input=messages.map(item=>item.content).join('\n');if(input.includes('MOCK_DELAY'))await new Promise(resolve=>setTimeout(resolve,3000));if(sessionStorage.getItem('promptops.e2e.mock')==='failure'||input.includes('MOCK_PROVIDER_FAILURE'))throw new Error('Mock provider failure: credential [REDACTED]');const content=input.includes('MOCK_INVALID_JSON')?'{invalid':input.includes('MOCK_CONTAINS_FAIL')?'mock response':'{"mock":true}';return{content,metadata:{model:'promptops-mock',...(input.includes('MOCK_TOKEN_UNAVAILABLE')?{}:{tokens:12})}}},
    async sendMessageStream(_messages,_provider,callbacks){if(sessionStorage.getItem('promptops.e2e.mock')==='failure'){const error=new Error('Mock provider failure');callbacks.onError(error);throw error}callbacks.onToken('{"mock":');callbacks.onToken('true}');callbacks.onComplete({content:'{"mock":true}',metadata:{model:'promptops-mock',tokens:12}})},
    async sendMessageStreamWithTools(messages,provider,_tools,callbacks){return this.sendMessageStream(messages,provider,callbacks)},
    async testConnection(){},async fetchModelList(){return[{value:'promptops-mock',label:'PromptOps Mock'}]},
  }
  const llmService = mockMode ? mockLlm : createLLMService(modelManager)
  const mockConfig = { id:'promptops-mock',name:'PromptOps Mock',enabled:true,providerMeta:{id:'mock',name:'Mock'},modelMeta:{id:'promptops-mock',name:'PromptOps Mock',parameterDefinitions:[]},connectionConfig:{},paramOverrides:{temperature:.2,max_tokens:500} } as unknown as TextModelConfig
  const evaluationModelManager: IModelManager = mockMode ? {
    ensureInitialized:()=>modelManager.ensureInitialized(),isInitialized:()=>modelManager.isInitialized(),
    getAllModels:async()=>[mockConfig,...await modelManager.getAllModels()],getModel:async key=>key===mockConfig.id?mockConfig:modelManager.getModel(key),getEnabledModels:async()=>[mockConfig,...await modelManager.getEnabledModels()],
    addModel:(key,config)=>modelManager.addModel(key,config),updateModel:(key,config)=>modelManager.updateModel(key,config),deleteModel:key=>modelManager.deleteModel(key),enableModel:key=>modelManager.enableModel(key),disableModel:key=>modelManager.disableModel(key),
    exportData:()=>modelManager.exportData(),importData:data=>modelManager.importData(data),getDataType:()=>modelManager.getDataType(),validateData:data=>modelManager.validateData(data)
  } : modelManager
  const promptInvocationService = new PromptInvocationService(promptRepository,promptVersionRepository,invocationRepository,llmService,mockMode?undefined:evaluationModelManager)
  const batchPromptInvocationService = mockMode ? new PromptInvocationService(promptRepository,promptVersionRepository,invocationRepository,llmService,evaluationModelManager) : promptInvocationService
  services = {
    promptRepository,
    workspaceRepository,
    promptQueryService: new PromptQueryService(promptRepository),
    promptVersionRepository,
    promptEditorService: new PromptEditorService(db,promptRepository,promptVersionRepository),
    invocationRepository,
    promptInvocationService,
    datasetRepository,
    datasetTestCaseRepository,
    datasetService: new DatasetService(db,datasetRepository,datasetTestCaseRepository),
    datasetQueryService: new DatasetQueryService(datasetRepository,datasetTestCaseRepository),
    evaluationRunRepository,evaluationResultRepository,
    evaluationQueryService:new EvaluationQueryService(evaluationRunRepository,evaluationResultRepository),
    batchEvaluationService:new BatchEvaluationService(datasetRepository,datasetTestCaseRepository,promptRepository,promptVersionRepository,evaluationModelManager,batchPromptInvocationService,invocationRepository,evaluationRunRepository,evaluationResultRepository),
    modelManager:evaluationModelManager,
    initialize: async () => { await Promise.all([seedPromptOpsDatabase(db),evaluationModelManager.ensureInitialized()]); await services?.batchEvaluationService.recoverInterruptedEvaluationRuns() },
  }
  return services
}

export const promptOpsServicesKey: InjectionKey<PromptOpsServices> = Symbol('promptOpsServices')
export const usePromptOpsServices = (): PromptOpsServices => {
  const value = inject(promptOpsServicesKey)
  if (!value) throw new Error('PromptOps services are not available')
  return value
}
