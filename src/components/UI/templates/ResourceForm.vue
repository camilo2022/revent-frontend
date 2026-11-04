<script setup>
import { computed } from 'vue'
import Button from './Button.vue'
import ErrorSummary from './ErrorSummary.vue'
import FieldInput from './FieldInput.vue'
import RequiredNote from './RequiredNote.vue'

// Formulario genérico (modal o página) alimentado por config.fields y el modelo del controlador.
// Enter en un campo guarda (el <form> envía solo).
const props = defineProps({ ctrl: { type: Object, required: true }, config: { type: Object, required: true } })
const isEdit = computed(() => props.ctrl.mode === 'edit')
const heading = computed(() => `${isEdit.value ? 'Editar' : 'Nuevo'} ${props.config.singular}`)
const cols = (f) => (['textarea', 'location'].includes(f.type) ? 12 : 6)
</script>

<template>
  <form novalidate @submit.prevent="ctrl.save()">
    <ErrorSummary :message="ctrl.message" :errors="ctrl.errors" />
    <CRow>
      <CCol v-for="f in config.fields" :key="f.key" :md="config.formMode === 'modal' ? 12 : cols(f)">
        <FieldInput :field="f" :form="ctrl.form" :entity="ctrl.current" :options="ctrl.options" :get="ctrl.getError" :is-edit="isEdit" :autofocus="f === config.fields[0]" />
      </CCol>
    </CRow>
    <RequiredNote />
    <div class="d-flex justify-content-end gap-2 mt-3">
      <Button color="secondary" variant="outline" type="button" @click="ctrl.goIndex()">Cancelar</Button>
      <Button type="submit" :loading="ctrl.saving">Guardar</Button>
    </div>
    <span class="visually-hidden">{{ heading }}</span>
  </form>
</template>
