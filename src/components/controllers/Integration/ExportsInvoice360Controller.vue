<script setup>
import ExportService from '@/services/integration/ExportService'
import ExportForm from '@/components/templates/Integration/Exports/ExportForm.vue'
</script>

<template>
  <ExportForm
    title="Generar reporte de facturación 360"
    subtitle="Elige un mes completo o un rango de fechas manual. El reporte se enviará a los correos indicados."
    permission="integration.exports_invoice_360.send"
    period
    :request="ExportService.invoice360"
  />
</template>
