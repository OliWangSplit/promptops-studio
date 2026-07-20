<template><section class="page"><div v-if="loading" class="state">{{t('promptops.common.loading')}}</div><div v-else-if="error" class="state error">{{error==='notFound'?t('promptops.editor.promptNotFound'):error}}</div><template v-else><header><div><button class="link" @click="leave">← {{t('promptops.common.cancel')}}</button><h2>{{editMode?t('promptops.editor.editPrompt'):t('promptops.editor.createPrompt')}}</h2><p>{{t(`promptops.status.${form.status}`)}} · {{form.currentVersion}} <span v-if="dirty" class="dirty">{{t('promptops.editor.unsavedChanges')}}</span></p></div><div class="actions"><button @click="leave">{{t('promptops.common.cancel')}}</button><button v-if="!editMode" class="primary" :disabled="saving" @click="saveDraft">{{t('promptops.editor.saveDraft')}}</button><button v-if="editMode" :disabled="saving||form.status==='archived'" @click="saveChanges">{{t('promptops.editor.saveChanges')}}</button><button v-if="editMode" class="primary" :disabled="saving||form.status==='archived'" @click="showVersion=true">{{t('promptops.editor.saveNewVersion')}}</button><button v-if="editMode" @click="openPlayground">{{t('promptops.detail.openPlayground')}}</button></div></header><div v-if="form.status==='archived'" class="banner">{{t('promptops.editor.archivedCannotEdit')}}</div><div class="layout"><main><section class="card"><h3>{{t('promptops.editor.basicInformation')}}</h3><div class="fields"><label>Name<input v-model="form.name"/><small>{{fieldError('name')}}</small></label><label>Description<textarea v-model="form.description"/></label><label>Business Scenario<input v-model="form.businessScenario"/><small>{{fieldError('businessScenario')}}</small></label><label>Category<select v-model="form.category"><option value=""/><option v-for="x in options.categories" :key="x">{{x}}</option></select><small>{{fieldError('category')}}</small></label><label>Department<select v-model="form.department"><option value=""/><option v-for="x in options.departments" :key="x">{{x}}</option></select><small>{{fieldError('department')}}</small></label><label>Owner<select v-model="form.owner.id"><option v-for="x in options.users" :key="x.id" :value="x.id">{{x.name}}</option></select></label><label>Status<select v-model="form.status"><option v-for="x in PROMPT_STATUSES" :key="x">{{x}}</option></select></label><label>Risk Level<select v-model="form.riskLevel"><option>low</option><option>medium</option><option>high</option></select></label></div></section><PromptContentEditor v-model:system-prompt="form.systemPrompt" v-model:user-prompt="form.userPrompt" :errors="errorMap"/><PromptVariableList v-model="form.variables" :diagnostics="diagnostics" :errors="errorMap"/></main><aside><section class="card"><h3>{{t('promptops.editor.modelConfig')}}</h3><label>Provider<select v-model="form.modelProvider"><option v-for="(_,provider) in options.models" :key="provider">{{provider}}</option></select></label><label>Model<select v-model="form.modelName"><option v-for="model in models" :key="model">{{model}}</option></select></label><label>Temperature<input v-model.number="form.temperature" type="number" min="0" max="2" step="0.1"/><small>{{fieldError('temperature')}}</small></label><label>Max Tokens<input v-model.number="form.maxTokens" type="number" min="1"/><small>{{fieldError('maxTokens')}}</small></label></section><section class="card"><h3>{{t('promptops.editor.outputConfig')}}</h3><label>{{t('promptops.editor.outputType')}}<select v-model="form.outputType"><option>text</option><option>json</option><option>markdown</option></select></label><label>{{t('promptops.editor.expectedOutput')}}<textarea v-model="form.expectedOutputFormat"/></label></section><section v-if="issues.length" class="card validation"><h3>Validation</h3><div v-for="issue in issues" :key="issue.field+issue.message">{{issue.field}}: {{issue.message}}</div></section></aside></div></template><div v-if="showVersion" class="overlay" @click.self="showVersion=false"><form class="modal" @submit.prevent="submitVersion"><h3>{{t('promptops.editor.saveNewVersion')}}</h3><label>{{t('promptops.editor.versionType')}}<select v-model="versionType"><option value="minor">{{t('promptops.editor.minorVersion')}}</option><option value="major">{{t('promptops.editor.majorVersion')}}</option></select></label><label>{{t('promptops.editor.changeSummary')}}<input v-model.trim="summary" required/></label><label>{{t('promptops.editor.changeReason')}}<textarea v-model.trim="reason"/></label><div class="actions"><button type="button" @click="showVersion=false">{{t('promptops.common.cancel')}}</button><button class="primary">{{t('promptops.editor.saveNewVersion')}}</button></div></form></div></section></template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PROMPT_STATUSES } from '@prompt-optimizer/core'
import { usePromptEditor } from '../../composables/promptops/usePromptEditor'
import { PromptMetadataOptions as options } from '../../services/prompt-metadata-options'
import { PromptPlaygroundBridge } from '../../services/prompt-playground-bridge'
import PromptContentEditor from '../../components/promptops/editor/PromptContentEditor.vue'
import PromptVariableList from '../../components/promptops/editor/PromptVariableList.vue'

const { t } = useI18n()
const router = useRouter()
const { form, loading, saving, error, issues, diagnostics, editMode, dirty, load, saveDraft, saveChanges, saveVersion, leave } = usePromptEditor()
const showVersion = ref(false)
const summary = ref('')
const reason = ref('')
const versionType = ref<'minor'|'major'>('minor')
const errorMap = computed(() => Object.fromEntries(issues.value.map(issue => [issue.field, issue.message])))
const fieldError = (field:string) => errorMap.value[field] ?? ''
const models = computed(() => options.models[form.modelProvider as keyof typeof options.models] ?? [])

watch(() => form.modelProvider, () => {
  if (!models.value.includes(form.modelName as never)) form.modelName = models.value[0] ?? ''
})

const submitVersion = async () => {
  const succeeded = await saveVersion(summary.value, reason.value, versionType.value)
  if (!succeeded) return
  showVersion.value = false
  summary.value = ''
  reason.value = ''
}

const openPlayground = async () => {
  PromptPlaygroundBridge.save({ ...form })
  await router.push(form.id ? `/playground/${form.id}` : '/playground')
}

onMounted(load)
</script>
<style scoped>.page{display:grid;gap:18px}header{display:flex;justify-content:space-between;gap:20px}header h2{margin:8px 0 3px}.actions{display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}button,.primary,input,select,textarea{border:1px solid #d1d5db;border-radius:7px;padding:8px;background:var(--n-color,#fff);color:inherit}.primary{background:#2563eb;color:#fff}.link{border:0;padding:0}.dirty{color:#b45309}.banner{padding:12px;background:#fef3c7;border-radius:8px}.layout{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:16px}.layout main,.layout aside{display:grid;gap:16px;align-content:start}.card{padding:17px;border:1px solid #e5e7eb;border-radius:10px;background:var(--n-color,#fff)}.card h3{margin-top:0}.fields{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.fields label,aside label,.modal label{display:grid;gap:5px;font-size:12px}.fields small,aside small{color:#dc2626}.validation{color:#b91c1c}.overlay{position:fixed;inset:0;background:#0008;display:grid;place-items:center;z-index:100}.modal{width:min(500px,90vw);padding:22px;background:var(--n-color,#fff);border-radius:10px;display:grid;gap:13px}.state{text-align:center;padding:60px}.error{color:#b91c1c}@media(max-width:950px){.layout{grid-template-columns:1fr}.fields{grid-template-columns:1fr}header{display:grid}}</style>
