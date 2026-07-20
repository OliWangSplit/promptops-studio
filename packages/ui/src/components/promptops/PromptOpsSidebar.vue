<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="brand"><span class="brand-mark">PO</span><div v-if="!collapsed"><strong>PromptOps Studio</strong><small>{{ t('promptops.brand.subtitle') }}</small></div></div>
    <nav>
      <section v-for="group in groups" :key="group.label">
        <p v-if="!collapsed" class="group-label">{{ t(group.label) }}</p>
        <RouterLink v-for="item in group.items" :key="item.path" :to="item.path" class="nav-item" :title="t(item.label)">
          <span class="icon">{{ item.icon }}</span><span v-if="!collapsed" class="nav-label">{{ t(item.label) }}</span>
          <span v-if="item.soon && !collapsed" class="soon">{{ t('promptops.common.comingSoon') }}</span>
        </RouterLink>
      </section>
    </nav>
    <button class="collapse" type="button" @click="$emit('toggle')">{{ collapsed ? '›' : '‹' }}</button>
  </aside>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
defineProps<{ collapsed: boolean }>()
defineEmits<{ toggle: [] }>()
const { t } = useI18n()
const groups = [
  { label: 'promptops.nav.overview', items: [{ path: '/dashboard', label: 'promptops.nav.dashboard', icon: '▦' }] },
  { label: 'promptops.nav.promptManagement', items: [
    { path: '/prompts', label: 'promptops.nav.prompts', icon: 'P' }, { path: '/playground', label: 'promptops.nav.playground', icon: '▶' },
    { path: '/invocations', label: 'promptops.nav.invocations', icon: 'H' },
    { path: '/datasets', label: 'promptops.nav.datasets', icon: '▤' }, { path: '/evaluations', label: 'promptops.nav.evaluations', icon: '✓' },
    { path: '/experiments', label: 'promptops.nav.experiments', icon: '⇄', soon: true },
  ]},
  { label: 'promptops.nav.governance', items: [
    { path: '/approvals', label: 'promptops.nav.approvals', icon: '◇', soon: true }, { path: '/models', label: 'promptops.nav.models', icon: '⬡', soon: true },
    { path: '/analytics', label: 'promptops.nav.analytics', icon: '↗', soon: true },
  ]},
  { label: 'promptops.nav.system', items: [
    { path: '/settings', label: 'promptops.nav.settings', icon: '⚙' }, { path: '/basic/system', label: 'promptops.nav.legacy', icon: '↙' },
  ]},
]
</script>
<style scoped>
.sidebar{position:relative;width:252px;min-width:252px;height:100vh;background:#111827;color:#d1d5db;padding:18px 12px;box-sizing:border-box;overflow:auto;transition:width .15s}.sidebar.collapsed{width:72px;min-width:72px}.brand{display:flex;gap:11px;align-items:center;padding:4px 8px 20px;color:white}.brand-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;background:#2563eb;font-weight:700}.brand div{display:flex;flex-direction:column}.brand small{color:#94a3b8;font-size:10px;margin-top:3px}.group-label{font-size:11px;text-transform:uppercase;color:#64748b;padding:14px 10px 6px;margin:0}.nav-item{display:flex;align-items:center;gap:10px;min-height:40px;padding:0 10px;margin:2px 0;border-radius:7px;color:inherit;text-decoration:none;font-size:13px}.nav-item:hover{background:#1f2937;color:white}.nav-item.router-link-active{background:#1d4ed8;color:white}.icon{width:20px;text-align:center}.nav-label{flex:1}.soon{font-size:9px;color:#94a3b8}.collapse{position:fixed;bottom:15px;margin-left:8px;border:1px solid #374151;background:#1f2937;color:white;border-radius:6px;width:30px;height:30px;cursor:pointer}
</style>
