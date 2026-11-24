<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import RequisitionService from '@/services/RequisitionService'
import FormField from '@/components/UI/templates/FormField.vue'
import SearchSelect from '@/components/UI/templates/SearchSelect.vue'

// Un campo del formulario de una solicitud según su tipo en settings.form (text, textarea, number, date, datetime,
// boolean, select, selectdinamic, file). En los de archivo, modelValue son los nuevos; `existing` los ya subidos.
const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { default: null },
  error: String,
  existing: { type: Array, default: () => [] },
  removed: { type: Array, default: () => [] },
  saved: { default: null }, // valor guardado (al editar): da el nombre de lo ya elegido en un select dinámico
})
const emit = defineEmits(['update:modelValue', 'toggle-remove', 'auto'])
const fileInput = ref(null)

// Mismas extensiones que acepta el backend
const ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip'

const required = computed(() => (props.field.rules ?? []).includes('required'))
const multiple = computed(() => props.field.cardinality === 'multiple')
// Límite de caracteres si el campo lo tiene en sus reglas
const maxLength = computed(() => (props.field.rules ?? []).find((r) => r.startsWith('max:'))?.split(':')[1])
// Opciones del select estático (escritas a mano)
const choices = computed(() => (props.field.options ?? []).map((o) => ({ value: o, label: o })))

// Select dinámico: busca en el servidor; los nombres de lo elegido se recuerdan para mostrarlos
const service = props.field.type === 'selectdinamic' ? RequisitionService.optionsService(props.field.model) : null
const labels = reactive(Object.fromEntries([props.saved ?? []].flat().filter(Boolean).map((r) => [r.id, r.name])))
const adding = ref('')
const remember = (item) => (labels[item.id] = item.name)
const addRecord = (item) => {
  remember(item)
  if (!(props.modelValue ?? []).includes(item.id)) set([...(props.modelValue ?? []), item.id])
  adding.value = ''
}

onMounted(async () => {
  if (props.field.type !== 'selectdinamic' || multiple.value || props.modelValue) return
  try {
    // Si solo hay una opción (ej. una sola tienda asignada) se elige sola
    const found = (await RequisitionService.options(props.field.model, { per_page: 2 })).data.options
    if (found.length === 1) {
      remember(found[0])
      set(found[0].id)
      emit('auto')
    }
  } catch {
    // sin opciones: el buscador lo mostrará vacío
  }
})

const set = (value) => emit('update:modelValue', value)
const toggle = (value, checked) => {
  const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  set(checked ? [...current, value] : current.filter((v) => v !== value))
}
const addFiles = (event) => {
  set([...(props.modelValue ?? []), ...Array.from(event.target.files ?? [])])
  event.target.value = ''
}
const dropFile = (index) => set((props.modelValue ?? []).filter((_, i) => i !== index))
const size = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
const inputType = { text: 'text', number: 'number', date: 'date', datetime: 'datetime-local' }
</script>

<template>
  <FormField :label="field.label" :required="required" :error="error" :hint="field.help">
    <CFormTextarea v-if="field.type === 'textarea'" :model-value="modelValue ?? ''" rows="3" :maxlength="maxLength" :invalid="!!error" @update:model-value="set" />

    <CFormSwitch v-else-if="field.type === 'boolean'" :model-value="!!modelValue" :label="modelValue ? 'Sí' : 'No'" @update:model-value="set" />

    <!-- Select estático de varias opciones: casillas -->
    <div v-else-if="field.type === 'select' && multiple" class="d-flex flex-wrap gap-3">
      <CFormCheck v-for="o in choices" :key="o.value" :label="o.label" :checked="(modelValue ?? []).includes(o.value)" @change="toggle(o.value, $event.target.checked)" />
    </div>

    <!-- Select estático de una opción: botones de opción -->
    <div v-else-if="field.type === 'select'" class="d-flex flex-wrap gap-3">
      <CFormCheck v-for="o in choices" :key="o.value" type="radio" :name="field.field" :label="o.label" :checked="modelValue === o.value" @change="set(o.value)" />
      <CButton v-if="!required && modelValue" size="sm" color="link" class="p-0" @click="set(null)">Quitar selección</CButton>
    </div>

    <!-- Select dinámico de varias opciones: lo elegido como etiquetas y un buscador para agregar -->
    <div v-else-if="field.type === 'selectdinamic' && multiple">
      <div v-if="(modelValue ?? []).length" class="d-flex flex-wrap gap-2 mb-2">
        <CBadge v-for="id in modelValue" :key="id" color="secondary" class="d-inline-flex align-items-center gap-1 py-2">
          {{ labels[id] ?? `#${id}` }}
          <button type="button" class="btn-close btn-close-white" style="font-size: 0.55rem" aria-label="Quitar" @click="toggle(id, false)" />
        </CBadge>
      </div>
      <SearchSelect v-model="adding" :service="service" list-key="options" placeholder="Escribe para buscar y agregar..." :invalid="!!error" @select="addRecord" />
    </div>

    <!-- Select dinámico de una opción: buscador en el servidor -->
    <SearchSelect
      v-else-if="field.type === 'selectdinamic'"
      :model-value="modelValue"
      :service="service"
      list-key="options"
      :initial-label="labels[modelValue] ?? ''"
      :invalid="!!error"
      @update:model-value="set"
      @select="remember"
    />

    <div v-else-if="field.type === 'file'">
      <!-- Ya subidos (al editar): se pueden quitar -->
      <ul v-if="existing.length" class="list-unstyled mb-2">
        <li v-for="f in existing" :key="f.path" class="d-flex align-items-center gap-2 small">
          <a :href="f.url" target="_blank" rel="noopener" :class="{ 'text-decoration-line-through text-body-secondary': removed.includes(f.path) }">{{ f.name }}</a>
          <span class="text-body-secondary">{{ size(f.size) }}</span>
          <CButton size="sm" color="link" class="p-0" @click="emit('toggle-remove', f.path)">{{ removed.includes(f.path) ? 'Deshacer' : 'Quitar' }}</CButton>
        </li>
      </ul>
      <!-- Nuevos -->
      <ul v-if="(modelValue ?? []).length" class="list-unstyled mb-2">
        <li v-for="(f, i) in modelValue" :key="`${f.name}-${i}`" class="d-flex align-items-center gap-2 small">
          <span>{{ f.name }}</span><span class="text-body-secondary">{{ size(f.size) }}</span>
          <CButton size="sm" color="link" class="p-0 text-danger" @click="dropFile(i)">Quitar</CButton>
        </li>
      </ul>
      <input ref="fileInput" type="file" multiple :accept="ACCEPT" class="d-none" @change="addFiles" />
      <CButton size="sm" color="secondary" variant="outline" :class="{ 'border-danger': !!error }" @click="fileInput.click()">Adjuntar archivos</CButton>
      <div class="small text-body-secondary mt-1">Hasta 10 archivos de 10 MB (imágenes, PDF, Office o ZIP).</div>
    </div>

    <CFormInput v-else :type="inputType[field.type] ?? 'text'" :model-value="modelValue ?? ''" :maxlength="field.type === 'text' ? maxLength : undefined" :invalid="!!error" @update:model-value="set" />
  </FormField>
</template>
