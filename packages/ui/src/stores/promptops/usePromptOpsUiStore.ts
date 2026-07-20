import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEFAULT_WORKSPACE_ID, type PromptListQuery } from '@prompt-optimizer/core'

export const usePromptOpsUiStore = defineStore('promptOpsUi', () => {
  const currentWorkspaceId = ref(DEFAULT_WORKSPACE_ID)
  const sidebarCollapsed = ref(false)
  const selectedPromptId = ref<string>()
  const promptFilters = ref<Omit<PromptListQuery, 'workspaceId'>>({ sortBy: 'updatedAt', sortDirection: 'desc' })
  const clearPromptFilters = () => { promptFilters.value = { sortBy: 'updatedAt', sortDirection: 'desc' } }
  return { currentWorkspaceId, sidebarCollapsed, selectedPromptId, promptFilters, clearPromptFilters }
})
