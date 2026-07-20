import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DatasetStatus } from '@prompt-optimizer/core'

export const useDatasetUiStore = defineStore('datasetUi', () => {
  const search = ref(''); const status = ref<DatasetStatus | ''>(''); const sortBy = ref<'name'|'createdAt'|'updatedAt'>('updatedAt'); const sortDirection = ref<'asc'|'desc'>('desc'); const page = ref(1); const selectedTestCaseIds = ref<string[]>([])
  const clear = () => { search.value=''; status.value=''; sortBy.value='updatedAt'; sortDirection.value='desc'; page.value=1 }
  return { search,status,sortBy,sortDirection,page,selectedTestCaseIds,clear }
})
