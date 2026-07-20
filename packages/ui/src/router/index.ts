import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { beforeRouteSwitch } from './guards'
import ContextSystemWorkspace from '../components/context-mode/ContextSystemWorkspace.vue'
import ContextUserWorkspace from '../components/context-mode/ContextUserWorkspace.vue'

const soon = (path: string, name: string, titleKey: string): RouteRecordRaw => ({
  path, name, meta: { titleKey, comingSoon: true }, component: () => import('../pages/promptops/ComingSoonPage.vue')
})

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/promptops',
    component: () => import('../layouts/PromptOpsLayout.vue'),
    children: [
      { path: '/dashboard', name: 'promptops-dashboard', meta: { titleKey: 'promptops.nav.dashboard' }, component: () => import('../pages/dashboard/DashboardPage.vue') },
      { path: '/prompts', name: 'promptops-prompts', meta: { titleKey: 'promptops.nav.prompts' }, component: () => import('../pages/prompts/PromptLibraryPage.vue') },
      { path: '/prompts/new', name: 'promptops-prompt-new', meta: { titleKey: 'promptops.editor.createPrompt' }, component: () => import('../pages/prompts/PromptEditorPage.vue') },
      { path: '/prompts/:id/edit', name: 'promptops-prompt-edit', meta: { titleKey: 'promptops.editor.editPrompt' }, component: () => import('../pages/prompts/PromptEditorPage.vue') },
      { path: '/prompts/:id/versions', name: 'promptops-prompt-versions', meta: { titleKey: 'promptops.version.history' }, component: () => import('../pages/prompts/PromptVersionHistoryPage.vue') },
      { path: '/prompts/:id/versions/:versionId', name: 'promptops-prompt-version-detail', meta: { titleKey: 'promptops.version.detail' }, component: () => import('../pages/prompts/PromptVersionDetailPage.vue') },
      { path: '/prompts/:id', name: 'promptops-prompt-detail', meta: { titleKey: 'promptops.detail.title' }, component: () => import('../pages/prompts/PromptDetailPage.vue') },
      { path: '/playground', name: 'promptops-playground', meta: { titleKey: 'promptops.nav.playground' }, component: () => import('../pages/playground/PromptPlaygroundPage.vue') },
      { path: '/playground/:promptId', name: 'promptops-playground-prompt', meta: { titleKey: 'promptops.nav.playground' }, component: () => import('../pages/playground/PromptPlaygroundPage.vue') },
      { path: '/playground/:promptId/version/:versionId', name: 'promptops-playground-version', meta: { titleKey: 'promptops.nav.playground' }, component: () => import('../pages/playground/PromptPlaygroundPage.vue') },
      { path: '/invocations', name: 'promptops-invocations', meta: { titleKey: 'promptops.nav.invocations' }, component: () => import('../pages/invocations/InvocationHistoryPage.vue') },
      { path: '/invocations/:invocationId', name: 'promptops-invocation-detail', meta: { titleKey: 'promptops.nav.invocations' }, component: () => import('../pages/invocations/InvocationDetailPage.vue') },
      { path: '/datasets', name: 'promptops-datasets', meta: { titleKey: 'promptops.nav.datasets' }, component: () => import('../pages/datasets/DatasetLibraryPage.vue') },
      { path: '/datasets/new', name: 'promptops-dataset-new', meta: { titleKey: 'promptops.datasets.create' }, component: () => import('../pages/datasets/DatasetLibraryPage.vue') },
      { path: '/datasets/:datasetId', name: 'promptops-dataset-detail', meta: { titleKey: 'promptops.datasets.detail' }, component: () => import('../pages/datasets/DatasetDetailPage.vue') },
      { path: '/evaluations', name: 'promptops-evaluations', meta: { titleKey: 'promptops.nav.evaluations' }, component: () => import('../pages/evaluations/EvaluationHistoryPage.vue') },
      { path: '/evaluations/:evaluationRunId', name: 'promptops-evaluation-run', meta: { titleKey: 'promptops.evaluations.run' }, component: () => import('../pages/evaluations/EvaluationRunPage.vue') },
      soon('/experiments', 'promptops-experiments', 'promptops.nav.experiments'),
      soon('/approvals', 'promptops-approvals', 'promptops.nav.approvals'),
      soon('/models', 'promptops-models', 'promptops.nav.models'),
      soon('/analytics', 'promptops-analytics', 'promptops.nav.analytics'),
      { path: '/settings', name: 'promptops-settings', meta: { titleKey: 'promptops.nav.settings' }, component: () => import('../pages/promptops/SettingsPage.vue') },
    ]
  },
  {
    path: '/legacy',
    component: () => import('../components/app-layout/LegacyOptimizerRoute.vue'),
    children: [
      { path: '/basic/system', name: 'basic-system', component: () => import('../components/basic-mode/BasicSystemWorkspace.vue') },
      { path: '/basic/user', name: 'basic-user', component: () => import('../components/basic-mode/BasicUserWorkspace.vue') },
      { path: '/pro/multi', name: 'pro-multi', component: ContextSystemWorkspace },
      { path: '/pro/variable', name: 'pro-variable', component: ContextUserWorkspace },
      { path: '/image/text2image', name: 'image-text2image', component: () => import('../components/image-mode/ImageText2ImageWorkspace.vue') },
      { path: '/image/image2image', name: 'image-image2image', component: () => import('../components/image-mode/ImageImage2ImageWorkspace.vue') },
      { path: '/image/multiimage', name: 'image-multiimage', component: () => import('../components/image-mode/ImageMultiImageWorkspace.vue') },
      { path: '/favorites', name: 'favorites', component: () => import('../components/favorites/FavoritesPage.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

export const router = createRouter({ history: createWebHashHistory(), routes })
router.beforeEach(beforeRouteSwitch)
export default router
