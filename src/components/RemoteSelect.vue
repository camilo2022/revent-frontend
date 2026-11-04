<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { listOf } from '@/utils/format'

// Selector con búsqueda remota (debounce) y paginación: sirve para listas enormes como ciudades
const model = defineModel()
const props = defineProps({
  service: { type: Object, required: true },
  listKey: String,
  labelFn: { type: Function, default: (item) => item.name },
  params: { type: Object, default: () => ({}) },
  initialLabel: { type: String, default: '' }, // texto del valor ya guardado (al editar)
  placeholder: { type: String, default: 'Escribe para buscar...' },
  invalid: Boolean,
  searchable: { type: Boolean, default: true },
})
const emit = defineEmits(['select'])

const perPage = 20
const open = ref(false)
const query = ref('')
const label = ref(props.initialLabel)
const items = ref([])
const page = ref(1)
const loading = ref(false)
const hasMore = ref(false)
const failed = ref('')
let timer = null
let closeTimer = null

watch(() => props.initialLabel, (v) => (label.value = v))
watch(model, (v) => {
  if (!v) label.value = ''
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  clearTimeout(closeTimer)
})

const load = async (reset) => {
  if (reset) page.value = 1
  loading.value = true
  failed.value = ''
  try {
    const params = { ...props.params, per_page: perPage, page: page.value }
    if (props.searchable && query.value) params.search = query.value
    const found = listOf(await props.service.all(params), props.listKey)
    items.value = reset ? found : [...items.value, ...found]
    hasMore.value = found.length >= perPage
  } catch (error) {
    failed.value = error?.error?.message || error?.message || 'No se pudo buscar'
  } finally {
    loading.value = false
  }
}

const onFocus = () => {
  clearTimeout(closeTimer)
  open.value = true
  query.value = ''
  load(true)
}
const onInput = (value) => {
  query.value = value
  clearTimeout(timer)
  timer = setTimeout(() => load(true), 350)
}
const onBlur = () => {
  closeTimer = setTimeout(() => (open.value = false), 150)
}
const choose = (item) => {
  model.value = item.id
  label.value = props.labelFn(item)
  open.value = false
  emit('select', item)
}
const clear = () => {
  model.value = ''
  label.value = ''
}
const more = () => {
  page.value++
  load(false)
}
</script>

<template>
  <div class="position-relative">
    <div class="input-group">
      <input
        class="form-control"
        :class="{ 'is-invalid': invalid }"
        :value="open ? query : label"
        :placeholder="label && !open ? '' : placeholder"
        @focus="onFocus"
        @blur="onBlur"
        @input="onInput($event.target.value)"
      />
      <button v-if="model" type="button" class="btn btn-outline-secondary" title="Quitar" @click="clear">&times;</button>
    </div>
    <ul v-if="open" class="list-group position-absolute w-100 shadow-sm" style="z-index: 1050; max-height: 260px; overflow-y: auto">
      <li v-if="loading && !items.length" class="list-group-item text-body-secondary">Buscando...</li>
      <li v-else-if="failed" class="list-group-item text-danger">{{ failed }}</li>
      <li v-else-if="!items.length" class="list-group-item text-body-secondary">Sin resultados</li>
      <li
        v-for="item in items"
        :key="item.id"
        class="list-group-item list-group-item-action"
        role="button"
        @mousedown.prevent="choose(item)"
      >{{ labelFn(item) }}</li>
      <li v-if="hasMore && !loading" class="list-group-item list-group-item-action text-center text-primary" role="button" @mousedown.prevent="more">Cargar más...</li>
    </ul>
  </div>
</template>
