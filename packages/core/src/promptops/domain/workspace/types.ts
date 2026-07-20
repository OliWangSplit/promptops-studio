export type UserRole = 'admin' | 'ai_product_manager' | 'editor' | 'reviewer' | 'viewer'

export interface UserSummary {
  id: string
  name: string
  email?: string
  role: UserRole
}

export interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}
