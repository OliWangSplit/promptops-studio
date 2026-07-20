import type { Workspace } from '../domain/workspace/types'

export interface WorkspaceRepository {
  getById(id: string): Promise<Workspace | undefined>
  getAll(): Promise<Workspace[]>
  create(workspace: Workspace): Promise<Workspace>
}
