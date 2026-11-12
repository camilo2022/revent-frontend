<script setup>
import ExportService from '@/services/integration/ExportService'
import ExportForm from '@/components/templates/Integration/Exports/ExportForm.vue'
</script>

<template>
  <ExportForm
    title="Generar reporte de facturación"
    subtitle="Elige un mes completo o un rango de fechas manual. El reporte se enviará a los correos indicados."
    permission="integration.exports_invoice.send"
    period
    :request="ExportService.invoice"
  />
</template>
