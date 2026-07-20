<template>
  <section class="page">
    <div class="heading"><div><h2>{{ t('promptops.dashboard.title') }}</h2><p>{{ t('promptops.dashboard.description') }}</p></div><RouterLink to="/prompts" class="primary">{{ t('promptops.dashboard.viewLibrary') }}</RouterLink></div>
    <div v-if="loading" class="state">{{ t('promptops.common.loading') }}</div>
    <div v-else-if="error" class="error"><p>{{ t('promptops.common.loadError') }}</p><button @click="load">{{ t('promptops.common.retry') }}</button></div>
    <template v-else-if="summary">
      <div class="kpis">
        <article v-for="card in cards" :key="card.label" data-testid="kpi"><small>{{ card.label }}</small><strong>{{ card.value }}</strong></article>
      </div>
      <div class="grid">
        <article class="panel"><h3>{{ t('promptops.dashboard.statusDistribution') }}</h3><div v-for="status in PROMPT_STATUSES" :key="status" class="bar-row"><span>{{ t(`promptops.status.${status}`) }}</span><div class="track"><i :style="{ width: `${percentage(status)}%` }"/></div><b>{{ summary.byStatus[status] }}</b></div></article>
        <article class="panel"><h3>{{ t('promptops.dashboard.highRisk') }}</h3><div v-if="!summary.highRiskPrompts.length" class="empty">{{ t('promptops.dashboard.noHighRisk') }}</div><RouterLink v-for="prompt in summary.highRiskPrompts" :key="prompt.id" :to="`/prompts/${prompt.id}`" class="risk-item"><div><strong>{{ prompt.name }}</strong><small>{{ prompt.department }}</small></div><span>{{ t(`promptops.status.${prompt.status}`) }}</span></RouterLink></article>
      </div>
      <article class="panel"><h3>{{ t('promptops.dashboard.recentPrompts') }}</h3><div class="table-wrap"><table><thead><tr><th>{{ t('promptops.table.name') }}</th><th>{{ t('promptops.table.status') }}</th><th>{{ t('promptops.table.owner') }}</th><th>{{ t('promptops.table.model') }}</th><th>{{ t('promptops.table.updatedAt') }}</th></tr></thead><tbody><tr v-for="prompt in summary.recentlyUpdated" :key="prompt.id" @click="router.push(`/prompts/${prompt.id}`)"><td><strong>{{ prompt.name }}</strong></td><td><span class="badge">{{ t(`promptops.status.${prompt.status}`) }}</span></td><td>{{ prompt.owner.name }}</td><td>{{ prompt.modelName }}</td><td>{{ formatDate(prompt.updatedAt) }}</td></tr></tbody></table></div></article>
      <article class="panel"><h3>{{ t('promptops.dashboard.recentActivity') }}</h3><p class="hint">{{ t('promptops.dashboard.activityHint') }}</p><ul class="activity"><li v-for="prompt in summary.recentlyUpdated.slice(0,3)" :key="prompt.id"><span>↻</span><div><strong>{{ prompt.name }}</strong> {{ t('promptops.dashboard.wasUpdated') }}<small>{{ formatDate(prompt.updatedAt) }}</small></div></li></ul></article>
    </template>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PROMPT_STATUSES, type DashboardSummary, type PromptStatus } from '@prompt-optimizer/core'
import { usePromptOpsServices } from '../../services/promptops'
import { usePromptOpsUiStore } from '../../stores/promptops/usePromptOpsUiStore'
const { t } = useI18n(); const router = useRouter(); const services = usePromptOpsServices(); const store = usePromptOpsUiStore()
const loading = ref(true); const error = ref(''); const summary = ref<DashboardSummary>()
const load = async () => { loading.value = true; error.value = ''; try { summary.value = await services.promptQueryService.getDashboardSummary(store.currentWorkspaceId) } catch (cause) { error.value = cause instanceof Error ? cause.message : String(cause) } finally { loading.value = false } }
onMounted(load)
const cards = computed(() => summary.value ? [
  { label: t('promptops.dashboard.total'), value: summary.value.total }, { label: t('promptops.dashboard.published'), value: summary.value.byStatus.published },
  { label: t('promptops.dashboard.drafts'), value: summary.value.byStatus.draft }, { label: t('promptops.dashboard.pending'), value: summary.value.byStatus.pending_approval },
  { label: t('promptops.dashboard.averageScore'), value: summary.value.averageEvaluationScore === undefined ? '—' : summary.value.averageEvaluationScore.toFixed(1) },
  { label: t('promptops.dashboard.highRisk'), value: summary.value.highRisk },
] : [])
const percentage = (status: PromptStatus) => summary.value?.total ? Math.round(summary.value.byStatus[status] / summary.value.total * 100) : 0
const formatDate = (value: string) => new Intl.DateTimeFormat(typeof document === 'undefined' ? 'en' : document.documentElement.lang || 'en', { dateStyle: 'medium' }).format(new Date(value))
</script>
<style scoped>
.page{display:grid;gap:22px}.heading{display:flex;justify-content:space-between;align-items:flex-start}.heading h2{margin:0;font-size:25px}.heading p,.hint{margin:6px 0;color:#64748b}.primary{background:#2563eb;color:white;padding:9px 14px;border-radius:7px;text-decoration:none}.kpis{display:grid;grid-template-columns:repeat(6,minmax(130px,1fr));gap:12px}.kpis article,.panel{background:var(--n-color,#fff);border:1px solid var(--n-border-color,#e5e7eb);border-radius:10px;padding:18px}.kpis small{display:block;color:#64748b}.kpis strong{display:block;font-size:28px;margin-top:12px}.grid{display:grid;grid-template-columns:1.25fr 1fr;gap:18px}.panel h3{margin:0 0 16px}.bar-row{display:grid;grid-template-columns:130px 1fr 30px;gap:10px;align-items:center;margin:13px 0;font-size:12px}.track{height:8px;background:#e5e7eb;border-radius:9px}.track i{display:block;height:100%;background:#2563eb;border-radius:9px}.risk-item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid #e5e7eb;text-decoration:none;color:inherit}.risk-item div{display:flex;flex-direction:column}.risk-item small{color:#64748b}.risk-item span,.badge{padding:3px 7px;border-radius:12px;background:#eef2ff;font-size:11px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:11px;border-bottom:1px solid #e5e7eb;font-size:12px}th{color:#64748b}tbody tr{cursor:pointer}tbody tr:hover{background:#f8fafc}.activity{list-style:none;padding:0}.activity li{display:flex;gap:10px;margin:12px 0}.activity div{display:flex;gap:5px;flex-wrap:wrap}.activity small{width:100%;color:#64748b}.error,.state,.empty{text-align:center;padding:30px;color:#64748b}@media(max-width:1100px){.kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.grid{grid-template-columns:1fr}.kpis{grid-template-columns:repeat(2,1fr)}}
</style>
