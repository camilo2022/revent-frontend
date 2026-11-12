<script setup>
import ComboSelect from './ComboSelect.vue'
import { getPath, setPath } from '@/utils/paths'
import { fileUrl } from '@/utils/format'
import FormField from './FormField.vue'
import SearchSelect from './SearchSelect.vue'
import LocationSelect from './LocationSelect.vue'
import FileUpload from './FileUpload.vue'

// Campo de formulario guiado por configuración (ver resources.config.js)
const props = defineProps({
  field: { type: Object, required: true },
  form: { type: Object, required: true },
  entity: Object, // registro cargado al editar (etiquetas de selectores e imagen actual)
  options: { type: Object, default: () => ({}) },
  get: { type: Function, required: true }, // error por campo
  isEdit: Boolean,
  autofocus: Boolean, // primer campo del formulario: recibe el foco al abrir
})

const f = props.field
const required = f.required || (f.requiredOnCreate && !props.isEdit)
const value = () => getPath(props.form, f.key)
const set = (v) => setPath(props.form, f.key, f.upper ? String(v).toUpperCase() : v)
const initialLabel = () => (f.initialLabel && props.entity ? f.initialLabel(props.entity) ?? '' : '')
const errorKey = f.type === 'location' ? f.idKey : f.key
const labelOf = (o) => (f.optionLabel ? f.optionLabel(o) : o.name)
</script>

<template>
  <FormField :label="f.label" :required="required" :hint="f.hint" :error="get(errorKey)">
    <ComboSelect
      v-if="f.type === 'select'"
      :model-value="value()"
      :options="(options[f.optionsKey] ?? []).map((o) => ({ value: o.id, label: labelOf(o) }))"
      :invalid="!!get(f.key)"
      @update:model-value="set"
    />
    <SearchSelect
      v-else-if="f.type === 'remote'"
      :model-value="value()"
      :service="f.service"
      :list-key="f.listKey"
      :label-fn="f.labelFn"
      :params="f.params"
      :searchable="f.searchable !== false"
      :initial-label="initialLabel()"
      :invalid="!!get(f.key)"
      @update:model-value="set"
    />
    <LocationSelect
      v-else-if="f.type === 'location'"
      v-model:type="form[f.typeKey]"
      v-model:id="form[f.idKey]"
      :initial-label="initialLabel()"
      :invalid="!!get(f.idKey)"
    />
    <FileUpload
      v-else-if="f.type === 'file'"
      :model-value="value()"
      :current-url="entity && f.urlFrom ? fileUrl(getPath(entity, f.urlFrom)) : ''"
      :invalid="!!get(f.key)"
      @update:model-value="set"
    />
    <div v-else-if="f.type === 'color'" class="d-flex gap-2">
      <input type="color" class="form-control form-control-color flex-shrink-0" title="Elegir color" :value="value() || '#000000'" @input="set($event.target.value.toUpperCase())" />
      <CFormInput :model-value="value()" placeholder="#RRGGBB" maxlength="7" :invalid="!!get(f.key)" @update:model-value="(v) => set(String(v).toUpperCase())" />
    </div>
    <CFormTextarea v-else-if="f.type === 'textarea'" :model-value="value()" rows="3" :maxlength="f.maxlength" :invalid="!!get(f.key)" :autofocus="autofocus" @update:model-value="set" />
    <CFormInput
      v-else
      :model-value="value()"
      :type="f.type ?? 'text'"
      :maxlength="f.maxlength"
      :autofocus="autofocus"
      :autocomplete="f.type === 'password' ? 'new-password' : undefined"
      :invalid="!!get(f.key)"
      @update:model-value="set"
    />
  </FormField>
</template>
