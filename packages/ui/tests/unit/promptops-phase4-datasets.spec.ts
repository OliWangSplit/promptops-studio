import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

describe('PromptOps Phase 4 Dataset UI wiring', () => {
  it('uses injected application services and never accesses Dexie from pages', () => {
    for (const path of ['src/pages/datasets/DatasetLibraryPage.vue', 'src/pages/datasets/DatasetDetailPage.vue']) {
      const source = read(path)
      expect(source).toContain('usePromptOpsServices')
      expect(source).not.toContain('Dexie')
      expect(source).not.toContain('getPromptOpsDatabase')
    }
  })
  it('provides CRUD, archive, import, export and batch-delete interactions', () => {
    const library = read('src/pages/datasets/DatasetLibraryPage.vue')
    const detail = read('src/pages/datasets/DatasetDetailPage.vue')
    expect(library).toContain('datasetService.exportDocument')
    expect(library).toContain('datasetService.duplicate')
    expect(detail).toContain('datasetService.deleteTestCases')
    expect(detail).toContain("dataset.value?.status==='archived'")
    expect(detail).toContain('watch(()=>route.params.datasetId')
  })
  it('keeps import parsing and persistence behind DatasetService', () => {
    const dialog = read('src/components/promptops/datasets/DatasetImportDialog.vue')
    expect(dialog).toContain('datasetService.previewImport')
    expect(dialog).toContain('datasetService.importAtomic')
    expect(dialog).not.toContain('JSON.parse')
  })
})
