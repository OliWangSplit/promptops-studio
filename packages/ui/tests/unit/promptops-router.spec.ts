import { describe, expect, it } from 'vitest'
import { router } from '../../src/router'

describe('PromptOps routes', () => {
  it('resolves implemented and legacy routes without changing hash history', () => {
    expect(router.resolve('/dashboard').name).toBe('promptops-dashboard')
    expect(router.resolve('/prompts/prompt-seed-1').name).toBe('promptops-prompt-detail')
    expect(router.resolve('/prompts/new').name).toBe('promptops-prompt-new')
    expect(router.resolve('/prompts/prompt-seed-1/edit').name).toBe('promptops-prompt-edit')
    expect(router.resolve('/prompts/prompt-seed-1/versions').name).toBe('promptops-prompt-versions')
    expect(router.resolve('/prompts/prompt-seed-1/versions/version-1').name).toBe('promptops-prompt-version-detail')
    expect(router.resolve('/basic/system').name).toBe('basic-system')
    expect(router.resolve('/datasets').name).toBe('promptops-datasets')
    expect(router.resolve('/datasets/new').name).toBe('promptops-dataset-new')
    expect(router.resolve('/datasets/dataset-1').name).toBe('promptops-dataset-detail')
    expect(router.resolve('/datasets').meta.comingSoon).toBeUndefined()
    expect(router.resolve('/evaluations').name).toBe('promptops-evaluations')
    expect(router.resolve('/evaluations/run-1').name).toBe('promptops-evaluation-run')
    expect(router.resolve('/evaluations').meta.comingSoon).toBeUndefined()
  })
})
