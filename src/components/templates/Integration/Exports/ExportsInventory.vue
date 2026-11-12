<script setup>
import ExportService from '@/services/integration/ExportService'
import FormField from '@/components/UI/templates/FormField.vue'
import ExportForm from './ExportForm.vue'

// Reporte de inventario: por defecto incluye inventario positivo y negativo (dos archivos)
const request = (body) => ExportService.inventory(body)
</script>

<template>
  <ExportForm
    title="Generar reporte de inventario"
    subtitle="Configura los filtros y el reporte se enviará a los correos indicados."
    permission="integration.exports_inventory.send"
    :request="request"
    :initial="{ inventory_type: '' }"
  >
    <template #fields="{ fields, get }">
      <h6 class="text-body-secondary mb-2">Tipo de inventario</h6>
      <CRow>
        <CCol md="6">
          <FormField label="Selecciona el tipo" :error="get('inventory_type')" hint="Si no seleccionas ninguno, el reporte incluirá ambos tipos.">
            <select v-model="fields.inventory_type" class="form-select">
              <option value="">Ambos (positivo y negativo)</option>
              <option value="positivo">Solo inventario positivo</option>
              <option value="negativo">Solo inventario negativo</option>
            </select>
          </FormField>
        </CCol>
      </CRow>
    </template>
  </ExportForm>
</template>
