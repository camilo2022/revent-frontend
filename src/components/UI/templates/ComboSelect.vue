<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

// Selector con lista fija que se filtra escribiendo (sin acentos ni mayúsculas). Reemplaza al <select> nativo.
const model = defineModel()
const props = defineProps({
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: 'Selecciona...' },
  emptyText: { type: String, default: 'Sin resultados' },
  invalid: Boolean,
  disabled: Boolean,
})
const emit = defineEmits(['change'])

const open = ref(false)
const query = ref('')
let closeTimer = null
onBeforeUnmount(() => clearTimeout(closeTimer))

const norm = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const selected = computed(() => props.options.find((o) => String(o.value) === String(model.value)))
const filtered = computed(() => {
  const q = norm(query.value).trim()
  return q ? props.options.filter((o) => norm(o.label).includes(q)) : props.options
})

const onFocus = () => {
  if (props.disabled) return
  clearTimeout(closeTimer)
  query.value = ''
  open.value = true
}
const onBlur = () => {
  closeTimer = setTimeout(() => (open.value = false), 150)
}
const choose = (o) => {
  model.value = o.value
  open.value = false
  emit('change', o.value)
}
const clear = () => {
  model.value = ''
  emit('change', '')
}
const onEnter = () => {
  if (filtered.value.length) choose(filtered.value[0])
}
</script>

<template>
  <div class="position-relative">
    <div class="input-group">
      <input
        class="form-control"
        :class="{ 'is-invalid': invalid }"
        :value="open ? query : selected?.label ?? ''"
        :placeholder="open && selected ? selected.label : placeholder"
        :disabled="disabled"
        autocomplete="off"
        @focus="onFocus"
        @click="onFocus"
        @blur="onBlur"
        @input="query = $event.target.value"
        @keydown.enter.prevent="onEnter"
        @keydown.esc="open = false"
      />
      <button v-if="model !== '' && model !== null && model !== undefined && !disabled" type="button" class="btn btn-outline-secondary" title="Quitar selección" @mousedown.prevent @click="clear">&times;</button>
    </div>
    <ul v-if="open" class="list-group position-absolute w-100 shadow-sm" style="z-index: 1050; max-height: 260px; overflow-y: auto">
      <li v-if="!filtered.length" class="list-group-item text-body-secondary">{{ emptyText }}</li>
      <li
        v-for="o in filtered"
        :key="o.value"
        class="list-group-item list-group-item-action"
        :class="{ active: String(o.value) === String(model) }"
        role="button"
        @mousedown.prevent
        @click="choose(o)"
      >{{ o.label }}</li>
    </ul>
  </div>
</template>
