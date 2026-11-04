<script setup>
import { onMounted, onUpdated, ref, useId } from 'vue'
import { cilWarning } from '@coreui/icons'

// Etiqueta + control + error del servidor. Enlaza label/control por id y marca aria-invalid/required.
const props = defineProps({ label: String, error: String, required: Boolean, hint: String })

const id = useId()
const root = ref(null)

const wire = () => {
  const el = root.value?.querySelector('input:not([type=checkbox]),select,textarea')
  if (!el) return
  if (!el.id) el.id = `${id}-control`
  root.value.querySelector('label')?.setAttribute('for', el.id)
  el.setAttribute('aria-required', props.required ? 'true' : 'false')
  if (props.error) {
    el.classList.add('is-invalid') // borde rojo e ícono de error de CoreUI
    el.setAttribute('aria-invalid', 'true')
    el.setAttribute('aria-describedby', `${id}-error`)
  } else {
    el.classList.remove('is-invalid')
    el.removeAttribute('aria-invalid')
    el.removeAttribute('aria-describedby')
  }
}
onMounted(wire)
onUpdated(wire)
</script>

<template>
  <div ref="root" class="mb-3">
    <label v-if="label" class="form-label">{{ label }}<span v-if="required" class="text-danger" aria-label="obligatorio"> *</span></label>
    <slot />
    <div v-if="hint && !error" class="form-text">{{ hint }}</div>
    <div v-if="error" :id="`${id}-error`" class="invalid-feedback d-flex align-items-center gap-1" role="alert"><CIcon :icon="cilWarning" size="sm" /> {{ error }}</div>
  </div>
</template>
