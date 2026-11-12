<script setup>
import { ref } from 'vue'
import { cilChevronBottom, cilChevronRight, cilFile } from '@coreui/icons'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import { cop, day } from './helpers'

// Pagos de un proveedor agrupados por mes: al abrir un mes se ven sus recibos y el detalle de cada uno
defineProps({ payments: { type: Array, default: () => [] }, canView: Boolean })
const emit = defineEmits(['view'])

const open = ref(new Set())
const toggle = (index) => {
  const next = new Set(open.value)
  next.has(index) ? next.delete(index) : next.add(index)
  open.value = next
}
</script>

<template>
  <EmptyState v-if="!payments.length" text="Este proveedor no tiene pagos registrados." />
  <CTable v-else small hover responsive>
    <CTableHead>
      <CTableRow>
        <CTableHeaderCell style="width: 44px" />
        <CTableHeaderCell>Mes</CTableHeaderCell>
        <CTableHeaderCell>Pagos</CTableHeaderCell>
        <CTableHeaderCell class="text-end">Total</CTableHeaderCell>
      </CTableRow>
    </CTableHead>
    <CTableBody>
      <template v-for="(period, index) in payments" :key="period.mes">
        <CTableRow class="fw-semibold">
          <CTableDataCell>
            <CButton color="secondary" variant="ghost" size="sm" :aria-label="open.has(index) ? 'Ocultar pagos' : 'Mostrar pagos'" @click="toggle(index)">
              <CIcon :icon="open.has(index) ? cilChevronBottom : cilChevronRight" />
            </CButton>
          </CTableDataCell>
          <CTableDataCell>{{ period.mes }}</CTableDataCell>
          <CTableDataCell>{{ period.detalles.length }}</CTableDataCell>
          <CTableDataCell class="text-end">{{ cop(period.total) }}</CTableDataCell>
        </CTableRow>
        <CTableRow v-if="open.has(index)">
          <CTableDataCell colspan="4" class="bg-body-tertiary">
            <CTable small class="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Tipo</CTableHeaderCell>
                  <CTableHeaderCell>Documento</CTableHeaderCell>
                  <CTableHeaderCell>Fecha</CTableHeaderCell>
                  <CTableHeaderCell class="text-end">Valor</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell class="text-center">Ver</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow v-for="payment in period.detalles" :key="payment.ACEntryID" :class="{ 'table-danger': payment.IsAnnulled }">
                  <CTableDataCell><span class="badge text-bg-light border">{{ payment.DocClass }}</span></CTableDataCell>
                  <CTableDataCell>
                    <a v-if="payment.Link" :href="payment.Link" target="_blank" rel="noopener noreferrer">{{ payment.DocName || '-' }}</a>
                    <span v-else>{{ payment.DocName || '-' }}</span>
                  </CTableDataCell>
                  <CTableDataCell>{{ day(payment.DocDate) }}</CTableDataCell>
                  <CTableDataCell class="text-end">{{ cop(payment.TotalValue) }}</CTableDataCell>
                  <CTableDataCell><CBadge :color="payment.IsAnnulled ? 'secondary' : 'success'">{{ payment.IsAnnulled ? 'Anulado' : 'Activo' }}</CBadge></CTableDataCell>
                  <CTableDataCell class="text-center">
                    <CButton color="primary" variant="ghost" size="sm" :disabled="!canView" :title="canView ? 'Ver detalle' : 'No tienes permiso para esta acción'" aria-label="Ver detalle del pago" @click="emit('view', payment)">
                      <CIcon :icon="cilFile" />
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CTableDataCell>
        </CTableRow>
      </template>
    </CTableBody>
  </CTable>
</template>
