<script setup>
import { computed, onMounted, ref } from 'vue'
import { cilClock, cilHistory, cilPencil, cilPlus, cilReload, cilTrash, cilLink, cilGlobeAlt, cilX } from '@coreui/icons'
import AuditService from '@/services/AuditService'
import { errorMessage } from '@/utils/format'
import { useAlertStore } from '@/stores/alertStore'
import Skeleton from './Skeleton.vue'

// Historial de un registro como línea de tiempo (estilo AdminLTE): quién hizo cada cosa, cuándo y desde dónde.
// Incluye los movimientos de lo que depende del registro (por ejemplo, colores y tallas de un producto).
const props = defineProps({ base: { type: String, required: true }, id: { type: [Number, String], required: true }, title: { type: String, default: '' } })
const emit = defineEmits(['close'])
const alerts = useAlertStore()

const audits = ref([])
const loading = ref(true)
const open = ref({})

onMounted(async () => {
  try {
    const res = await AuditService.record(props.base, props.id, { per_page: 100 })
    audits.value = res.data?.audits ?? []
  } catch (error) {
    alerts.error(errorMessage(error))
  }
  loading.value = false
})

// Cada evento tiene su ícono, color y frase
const kinds = {
  created: { icon: cilPlus, color: 'success', text: 'creó' },
  updated: { icon: cilPencil, color: 'primary', text: 'modificó' },
  deleted: { icon: cilTrash, color: 'danger', text: 'eliminó' },
  restored: { icon: cilReload, color: 'info', text: 'restauró' },
  attach: { icon: cilLink, color: 'warning', text: 'asignó elementos a' },
  detach: { icon: cilLink, color: 'warning', text: 'quitó elementos de' },
  sync: { icon: cilLink, color: 'warning', text: 'actualizó asignaciones de' },
}
const kind = (a) => kinds[a.event] ?? { icon: cilHistory, color: 'secondary', text: a.event }

const who = (a) => {
  const person = a.user?.employee?.person
  const name = person ? `${person.names ?? ''} ${person.last_names ?? ''}`.trim() : ''
  return name || a.user?.username || 'El sistema'
}

// Un bloque por día, del más reciente al más antiguo
// 'YYYY-MM-DD HH:mm:ss' del backend a Date
const when = (v) => new Date(String(v).replace(' ', 'T'))
const dayLabel = (v) => when(v).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
const timeLabel = (v) => when(v).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

const days = computed(() => {
  const map = new Map()
  audits.value.forEach((a) => {
    const day = dayLabel(a.created_at)
    if (!map.has(day)) map.set(day, [])
    map.get(day).push(a)
  })
  return [...map].map(([day, list]) => ({ day, list }))
})

const browser = (ua = '') => {
  const b = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  return [b, os].filter(Boolean).join(' en ')
}
const origin = (a) => [a.ip_address && `IP ${a.ip_address}`, browser(a.user_agent)].filter(Boolean).join(' · ')
const path = (url) => {
  try {
    return new URL(url).pathname.replace(/^\/api/, '')
  } catch {
    return url ?? ''
  }
}

const text = (v) => (v !== null && typeof v === 'object' ? JSON.stringify(v) : v === null || v === undefined || v === '' ? '—' : String(v))
const changes = (a) => {
  const oldV = a.old_values ?? {}
  const newV = a.new_values ?? {}
  return [...new Set([...Object.keys(oldV), ...Object.keys(newV)])].map((key) => ({ key, before: oldV[key], after: newV[key] }))
}
</script>

<template>
  <CModal visible size="lg" scrollable alignment="center" @close="emit('close')">
    <CModalHeader><CModalTitle><CIcon :icon="cilHistory" class="me-2" />Auditoría{{ title ? ` · ${title}` : '' }}</CModalTitle></CModalHeader>
    <CModalBody>
      <Skeleton v-if="loading" variant="form" />
      <p v-else-if="!audits.length" class="text-body-secondary mb-0">Este registro todavía no tiene movimientos en la auditoría.</p>
      <div v-else class="timeline">
        <template v-for="d in days" :key="d.day">
          <div class="timeline-day"><span class="badge text-bg-danger">{{ d.day }}</span></div>
          <div v-for="a in d.list" :key="a.id" class="timeline-item">
            <span class="timeline-icon" :class="`text-bg-${kind(a).color}`"><CIcon :icon="kind(a).icon" size="sm" /></span>
            <div class="timeline-card">
              <div class="timeline-head d-flex flex-wrap justify-content-between gap-2">
                <span><strong>{{ who(a) }}</strong> {{ kind(a).text }} <strong>{{ a.auditable_name ?? 'el registro' }}</strong></span>
                <small class="text-body-secondary"><CIcon :icon="cilClock" size="sm" /> {{ timeLabel(a.created_at) }}</small>
              </div>
              <div class="timeline-meta small text-body-secondary">
                <span v-if="a.user?.username">Usuario: {{ a.user.username }}</span>
                <span v-if="origin(a)"><CIcon :icon="cilGlobeAlt" size="sm" /> {{ origin(a) }}</span>
                <span v-if="a.url" class="text-truncate">Desde: {{ path(a.url) }}</span>
              </div>
              <template v-if="changes(a).length">
                <button type="button" class="btn btn-link btn-sm p-0 mt-1" @click="open[a.id] = !open[a.id]">
                  {{ open[a.id] ? 'Ocultar cambios' : `Ver cambios (${changes(a).length})` }}
                </button>
                <CTable v-if="open[a.id]" small responsive class="mt-2 mb-0">
                  <CTableHead><CTableRow><CTableHeaderCell>Campo</CTableHeaderCell><CTableHeaderCell>Antes</CTableHeaderCell><CTableHeaderCell>Después</CTableHeaderCell></CTableRow></CTableHead>
                  <CTableBody>
                    <CTableRow v-for="c in changes(a)" :key="c.key">
                      <CTableDataCell><code>{{ c.key }}</code></CTableDataCell>
                      <CTableDataCell class="text-danger text-break">{{ text(c.before) }}</CTableDataCell>
                      <CTableDataCell class="text-success text-break">{{ text(c.after) }}</CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              </template>
            </div>
          </div>
        </template>
      </div>
    </CModalBody>
    <CModalFooter><CButton color="secondary" variant="outline" @click="emit('close')"><CIcon :icon="cilX" /> Cerrar</CButton></CModalFooter>
  </CModal>
</template>
