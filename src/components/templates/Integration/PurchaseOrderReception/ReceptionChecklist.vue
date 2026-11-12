<script setup>
import FormField from '@/components/UI/templates/FormField.vue'
import MultiFileInput from '@/components/UI/templates/MultiFileInput.vue'
import { CHECKLIST } from './helpers'

// Lista de verificación de la recepción, datos de quien recibe, observaciones y fotos de evidencia.
const checklist = defineModel('checklist', { required: true })
const images = defineModel('images', { required: true })
defineProps({ get: { type: Function, required: true } })
const emit = defineEmits(['rejected'])
</script>

<template>
  <div class="d-flex flex-column gap-4">
    <div v-for="section in CHECKLIST" :key="section.title">
      <h6 class="text-body-secondary mb-3">{{ section.title }}</h6>
      <div class="d-flex flex-column gap-2">
        <label v-for="item in section.items" :key="item.key" class="d-flex align-items-start gap-2 border rounded-3 p-2 px-3" style="cursor: pointer">
          <input v-model="checklist[item.key]" type="checkbox" class="form-check-input mt-1" />
          <span><strong>{{ item.label }}:</strong> {{ item.text }}</span>
        </label>
      </div>
    </div>

    <div>
      <h6 class="text-body-secondary mb-3">Datos de quien realiza la recepción</h6>
      <CRow class="g-3">
        <CCol md="6">
          <FormField label="Nombre completo" required :error="get('receiving.Checklist.responsable.nombre')">
            <input v-model="checklist.responsable.nombre" type="text" class="form-control" maxlength="150" placeholder="Nombre completo" />
          </FormField>
        </CCol>
        <CCol md="6">
          <FormField label="Cargo" required :error="get('receiving.Checklist.responsable.cargo')">
            <input v-model="checklist.responsable.cargo" type="text" class="form-control" maxlength="150" placeholder="Cargo" />
          </FormField>
        </CCol>
        <CCol md="6">
          <FormField label="Departamento" required :error="get('receiving.Checklist.responsable.departamento')">
            <input v-model="checklist.responsable.departamento" type="text" class="form-control" maxlength="150" placeholder="Departamento" />
          </FormField>
        </CCol>
        <CCol md="6">
          <FormField label="Celular" :error="get('receiving.Checklist.responsable.celular')">
            <input v-model="checklist.responsable.celular" type="text" class="form-control" maxlength="30" placeholder="Celular" />
          </FormField>
        </CCol>
      </CRow>
    </div>

    <FormField label="Referencias recibidas" :error="get('receiving.Checklist.referencias_recibidas')">
      <textarea v-model="checklist.referencias_recibidas" class="form-control" rows="2" placeholder="Escribe las referencias recibidas..." />
    </FormField>

    <FormField label="Observaciones" required :error="get('receiving.Checklist.observaciones')">
      <textarea v-model="checklist.observaciones" class="form-control" rows="3" placeholder="Escribe las observaciones de la recepción..." />
    </FormField>

    <FormField label="Evidencia fotográfica" required :error="get('imagenes') || get('imagenes.0')" hint="Fotos JPG o PNG de hasta 8 MB cada una. Adjunta al menos una.">
      <MultiFileInput v-model="images" accept="image/png,image/jpeg" :max-mb="8" :invalid="!!(get('imagenes') || get('imagenes.0'))" @rejected="emit('rejected', $event)" />
    </FormField>
  </div>
</template>
