<template>
  <section class="card">
    <div class="title"><h3>{{ t('promptops.editor.variables') }}</h3><button type="button" @click="add">+ {{ t('promptops.editor.addVariable') }}</button></div>
    <VariableDiagnostics :items="diagnostics" />
    <p v-if="!modelValue.length" class="muted">{{ t('promptops.editor.noVariables') }}</p>
    <article v-for="(variable,index) in modelValue" :key="variable.id" :class="['variable',{unused:variable.unused}]">
      <div class="variable-title"><code>&#123;&#123;{{ variable.name }}&#125;&#125;</code><span v-if="variable.unused">{{ t('promptops.editor.unusedVariable') }}</span><button v-if="variable.unused" type="button" @click="remove(index)">{{ t('promptops.editor.removeVariable') }}</button></div>
      <div class="grid">
        <label>Display Name<input v-model="variable.displayName" /></label><label>Type<select v-model="variable.type"><option v-for="type in types" :key="type">{{ type }}</option></select></label><label>Description<input v-model="variable.description" /></label><label>Required<input v-model="variable.required" type="checkbox" /></label><label>Default Value<input v-model="variable.defaultValue" :type="variable.type==='number'?'number':variable.type==='date'?'date':'text'" /></label><label>Example Value<input v-model="variable.exampleValue" /></label><label v-if="variable.type==='select'">Options<input :value="variable.options?.join(', ')" @input="setOptions(variable,($event.target as HTMLInputElement).value)" /></label>
      </div>
      <small v-if="errors[`variables.${index}.name`]" class="error">{{ errors[`variables.${index}.name`] }}</small><small v-if="errors[`variables.${index}.options`]" class="error">{{ errors[`variables.${index}.options`] }}</small>
    </article>
  </section>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { createPromptOpsId, type PromptOpsPromptVariable as PromptVariable, type PromptOpsPromptVariableType as PromptVariableType, type PromptOpsVariableDiagnostic as VariableDiagnostic } from '@prompt-optimizer/core'
import VariableDiagnostics from './VariableDiagnostics.vue'
const props=defineProps<{modelValue:PromptVariable[];diagnostics:VariableDiagnostic[];errors:Record<string,string>}>()
const emit=defineEmits<{(e:'update:modelValue',v:PromptVariable[]):void}>()
const {t}=useI18n();const types:PromptVariableType[]=['text','textarea','number','boolean','date','select']
const add=()=>emit('update:modelValue',[...props.modelValue,{id:createPromptOpsId(),name:`manual_${props.modelValue.length+1}`,displayName:'Manual Variable',type:'text',required:false,unused:true}])
const remove=(index:number)=>emit('update:modelValue',props.modelValue.filter((_,i)=>i!==index))
const setOptions=(variable:PromptVariable,value:string)=>{variable.options=value.split(',').map(item=>item.trim()).filter(Boolean)}
</script>
<style scoped>.card{display:grid;gap:12px}.title,.variable-title{display:flex;align-items:center;justify-content:space-between;gap:10px}.title h3{margin:0}.variable{border:1px solid #e5e7eb;border-radius:8px;padding:13px}.variable.unused{border-color:#f59e0b}.variable-title span{margin-left:auto;color:#b45309}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}.grid label{display:grid;gap:5px;font-size:12px}.grid input,.grid select{padding:7px;border:1px solid #d1d5db;border-radius:6px;background:transparent;color:inherit}.error{color:#dc2626}.muted{color:#64748b}@media(max-width:850px){.grid{grid-template-columns:1fr}}</style>
