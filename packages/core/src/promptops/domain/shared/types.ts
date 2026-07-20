import { v4 as uuidv4 } from 'uuid'

export interface EntityMetadata {
  id: string
  workspaceId: string
  createdAt: string
  updatedAt: string
}

export const createPromptOpsId = (): string => uuidv4()
export const toIsoDate = (value: Date = new Date()): string => value.toISOString()
