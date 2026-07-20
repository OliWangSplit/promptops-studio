<template>
  <div class="shell"><PromptOpsSidebar :collapsed="store.sidebarCollapsed" @toggle="store.sidebarCollapsed = !store.sidebarCollapsed"/><div class="body"><WorkspaceHeader :workspace="workspace"/><main><div v-if="error" class="fatal">{{ t('promptops.common.initError') }}: {{ error }}</div><div v-else-if="loading" class="loading">{{ t('promptops.common.loading') }}</div><RouterView v-else/></main></div></div>
</template>
<script setup lang="ts">
import { onMounted, provide, ref } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Workspace } from '@prompt-optimizer/core'
import PromptOpsSidebar from '../components/promptops/PromptOpsSidebar.vue'
import WorkspaceHeader from '../components/promptops/WorkspaceHeader.vue'
import { getPromptOpsServices, promptOpsServicesKey } from '../services/promptops'
import { usePromptOpsUiStore } from '../stores/promptops/usePromptOpsUiStore'
const { t } = useI18n(); const store = usePromptOpsUiStore(); const services = getPromptOpsServices(); provide(promptOpsServicesKey, services)
const loading = ref(true); const error = ref(''); const workspace = ref<Workspace>()
onMounted(async () => { try { await services.initialize(); workspace.value = await services.workspaceRepository.getById(store.currentWorkspaceId) } catch (cause) { error.value = cause instanceof Error ? cause.message : String(cause) } finally { loading.value = false } })
</script>
<style scoped>
.shell{display:flex;min-height:100vh;background:var(--n-body-color,#f4f6f8);color:var(--n-text-color,#111827)}.body{flex:1;min-width:0}.body main{padding:28px;max-width:1500px;margin:auto}.fatal{padding:16px;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;border-radius:8px}.loading{padding:60px;text-align:center;color:#64748b}@media(max-width:800px){.body main{padding:16px}}
</style>
