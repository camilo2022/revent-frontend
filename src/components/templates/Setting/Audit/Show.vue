<script setup>
import { computed, onMounted, ref } from 'vue'
import AuditService from '@/services/AuditService'
import { useServerErrors } from '@/composables/useServerErrors'
import { firstOf } from '@/utils/format'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'

const props = defineProps({ id: [String, Number] })
const emit = defineEmits(['back'])
const { handle } = useServerErrors()
const audit = ref(null)

onMounted(async () => {
  try {
    audit.value = firstOf(await AuditService.find(props.id))
  } catch (error) {
    handle(error)
  }
})

const text = (v) => (v !== null && typeof v === 'object' ? JSON.stringify(v) : v ?? '-')
// Una fila por campo con su valor anterior y el nuevo
const rows = computed(() => {
  const oldV = audit.value?.old_values ?? {}
  const newV = audit.value?.new_values ?? {}
  return [...new Set([...Object.keys(oldV), ...Object.keys(newV)])].map((key) => ({ key, before: oldV[key], after: newV[key] }))
})
</script>

<template>
  <LoadingForm v-if="!audit" />
  <template v-else>
    <CCard class="mb-4">
      <CCardHeader class="d-flex justify-content-between align-items-center">
        <strong>Auditoría #{{ audit.id }}</strong>
        <CButton color="secondary" variant="outline" size="sm" @click="emit('back')">Volver</CButton>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="3"><small class="text-body-secondary d-block">Fecha</small>{{ audit.created_at }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Usuario</small>{{ audit.user?.username ?? '-' }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Evento</small>{{ audit.event }}</CCol>
          <CCol md="3"><small class="text-body-secondary d-block">Modelo</small>{{ audit.auditable_name ?? audit.auditable_type }}</CCol>
          <CCol md="6" class="mt-3"><small class="text-body-secondary d-block">URL</small>{{ audit.url }}</CCol>
          <CCol md="3" class="mt-3"><small class="text-body-secondary d-block">IP</small>{{ audit.ip_address }}</CCol>
        </CRow>
      </CCardBody>
    </CCard>
    <CCard>
      <CCardHeader><strong>Valores antes y después</strong></CCardHeader>
      <CCardBody>
        <p v-if="!rows.length" class="text-body-secondary mb-0">Sin cambios de valores.</p>
        <CTable v-else small responsive class="mb-0">
          <CTableHead>
            <CTableRow><CTableHeaderCell>Campo</CTableHeaderCell><CTableHeaderCell>Antes</CTableHeaderCell><CTableHeaderCell>Después</CTableHeaderCell></CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow v-for="r in rows" :key="r.key">
              <CTableDataCell><code>{{ r.key }}</code></CTableDataCell>
              <CTableDataCell class="text-danger">{{ text(r.before) }}</CTableDataCell>
              <CTableDataCell class="text-success">{{ text(r.after) }}</CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  </template>
</template>
