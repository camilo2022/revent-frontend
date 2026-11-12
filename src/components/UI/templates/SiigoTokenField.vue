<script setup>
import FormField from './FormField.vue'

// Campo opcional para pegar un token o cookie distintos solo por esta vez (por ejemplo, el de otro usuario de Siigo).
// Por defecto las pantallas usan lo guardado en Autorización Siigo y no lo muestran.
const model = defineModel()
defineProps({ label: { type: String, default: 'Token de Siigo' }, error: { type: String, default: '' }, hint: { type: String, default: 'Opcional: si lo dejas vacío se usa el guardado en Autorización Siigo.' } })
</script>

<template>
  <FormField :label="label" :hint="hint" :error="error">
    <CFormTextarea v-model="model" rows="3" spellcheck="false" autocomplete="off" :invalid="!!error" class="font-monospace small" />
  </FormField>
</template>
