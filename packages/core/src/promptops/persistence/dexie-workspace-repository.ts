import type { Workspace } from '../domain/workspace/types'
import type { WorkspaceRepository } from '../repositories/workspace-repository'
import type { PromptOpsDatabase } from './promptops-db'

export class DexieWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly db: PromptOpsDatabase) {}
  getById(id: string): Promise<Workspace | undefined> { return this.db.workspaces.get(id) }
  getAll(): Promise<Workspace[]> { return this.db.workspaces.orderBy('name').toArray() }
  async create(workspace: Workspace): Promise<Workspace> {
    await this.db.workspaces.add(workspace)
    return workspace
  }
}
