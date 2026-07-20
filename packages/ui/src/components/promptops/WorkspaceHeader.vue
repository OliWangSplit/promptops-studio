<template>
  <header class="header">
    <div><small>{{ workspace?.name ?? t('promptops.common.loading') }}</small><h1>{{ pageTitle }}</h1></div>
    <div class="actions"><RouterLink to="/basic/system" class="legacy">{{ t('promptops.nav.legacy') }}</RouterLink><RouterLink to="/settings" class="user"><span>AC</span><div><strong>{{ user.name }}</strong><small>{{ t('promptops.roles.aiProductManager') }}</small></div></RouterLink></div>
  </header>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { DEFAULT_USER, type Workspace } from '@prompt-optimizer/core'
const props = defineProps<{ workspace?: Workspace }>()
const route = useRoute(); const { t } = useI18n(); const user = DEFAULT_USER
const pageTitle = computed(() => t(String(route.meta.titleKey ?? 'promptops.nav.dashboard')))
</script>
<style scoped>
.header{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;border-bottom:1px solid var(--n-border-color,#e5e7eb);background:var(--n-color,#fff)}h1{font-size:20px;margin:2px 0}small{color:#64748b}.actions,.user{display:flex;align-items:center;gap:12px}.legacy,.user{text-decoration:none;color:inherit}.legacy{border:1px solid #d1d5db;border-radius:7px;padding:8px 12px;font-size:12px}.user span{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#dbeafe;color:#1d4ed8;font-weight:700}.user div{display:flex;flex-direction:column;font-size:12px}
</style>
