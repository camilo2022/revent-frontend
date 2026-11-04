<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { cilArrowLeft, cilBan, cilChartLine, cilCheckAlt, cilCloudDownload, cilX } from '@coreui/icons'
import ReportService from '@/services/ReportService'
import { useOptions } from '@/composables/useOptions'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { errorMessage, listOf } from '@/utils/format'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'

// Reportes (misma lógica que Kanri): se elige un reporte, sus campos (agrupados), los filtros, y se genera o exporta a Excel
const auth = useAuthStore()
const alerts = useAlertStore()
const { options, loadOptions } = useOptions()
const { get, handle, clear } = useServerErrors()

const reports = ref([])
const loading = ref(true)
const current = ref(null) // reporte abierto { id, name, description, fields, filters }
const selected = ref([]) // data_key elegidos
const filters = reactive({}) // clave => lista de valores | { from, to }
const result = ref(null) // { columns, rows }
const busy = ref(false)
const shown = ref(100)

const canGenerate = computed(() => auth.can('reports.generate'))
const canExport = computed(() => auth.can('reports.export'))

onMounted(async () => {
  try {
    reports.value = listOf(await ReportService.all(), 'reports')
  } catch (error) {
    alerts.error(errorMessage(error))
  }
  loading.value = false
})

const open = async (report) => {
  clear()
  result.value = null
  current.value = report
  Object.keys(filters).forEach((k) => delete filters[k])
  // Los filtros se preparan antes de cargar las listas para que la pantalla ya tenga con qué dibujarse
  Object.entries(report.filters ?? {}).forEach(([key, f]) => {
    filters[key] = f.type === 'date_range' ? { from: '', to: '' } : []
  })
  // Todos los campos vienen marcados; las listas de cada filtro salen de los catálogos
  selected.value = report.fields.flatMap((g) => g.fields.map((f) => f.data_key))
  const keys = Object.values(report.filters ?? {}).filter((f) => f.type === 'select' && !f.options).map((f) => f.data)
  if (keys.length) await loadOptions([...new Set(keys)])
}
const back = () => {
  current.value = null
  result.value = null
}

const fieldOn = (key) => selected.value.includes(key)
const toggleField = (key) => {
  selected.value = fieldOn(key) ? selected.value.filter((k) => k !== key) : [...selected.value, key]
}
const groupAll = (group) => group.fields.every((f) => fieldOn(f.data_key))
const toggleGroup = (group) => {
  const keys = group.fields.map((f) => f.data_key)
  selected.value = groupAll(group) ? selected.value.filter((k) => !keys.includes(k)) : [...new Set([...selected.value, ...keys])]
}

// Opciones de un filtro de lista: fijas (options) o del catálogo indicado en `data`
const optionsOf = (f) => (f.options ?? (options[f.data] ?? []).map((o) => ({ value: o.id, label: o.name ?? o.trade_name ?? o.legal_name })))
const labelOf = (f, value) => optionsOf(f).find((o) => String(o.value) === String(value))?.label ?? value
const addValue = (key, value) => {
  if (value !== '' && !filters[key].includes(value)) filters[key].push(value)
}
const removeValue = (key, value) => {
  filters[key] = filters[key].filter((v) => v !== value)
}
const clearFilters = () => {
  Object.entries(current.value.filters ?? {}).forEach(([key, f]) => {
    filters[key] = f.type === 'date_range' ? { from: '', to: '' } : []
  })
}

// Solo se envían los filtros con valor (como los espera el backend)
const body = () => {
  const active = {}
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value) ? value.length : value.from || value.to) active[key] = value
  })
  // Los campos se envían en el orden de la definición del reporte
  const order = current.value.fields.flatMap((g) => g.fields.map((f) => f.data_key))
  return { fields: order.filter(fieldOn), filters: active }
}

const generate = async () => {
  clear()
  busy.value = true
  try {
    result.value = (await ReportService.generate(current.value.id, body())).data
    shown.value = 100
  } catch (error) {
    handle(error)
  } finally {
    busy.value = false
  }
}

const download = async () => {
  clear()
  busy.value = true
  try {
    const { blob, name } = await ReportService.export(current.value.id, body())
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
    alerts.success('Reporte exportado.')
  } catch (error) {
    handle(error)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <!-- Lista de reportes -->
  <CCard v-if="!current" class="fade-in">
    <CCardHeader><strong>Reportes</strong></CCardHeader>
    <CCardBody>
      <Skeleton v-if="loading" variant="cards" />
      <p v-else-if="!reports.length" class="text-body-secondary mb-0">No hay reportes disponibles.</p>
      <CRow v-else>
        <CCol v-for="r in reports" :key="r.id" md="6" xl="4" class="mb-3">
          <CCard class="h-100 border">
            <CCardBody class="d-flex flex-column">
              <h6 class="mb-1">{{ r.name }}</h6>
              <p class="small text-body-secondary flex-grow-1">{{ r.description }}</p>
              <div>
                <CButton color="primary" variant="outline" size="sm" :disabled="!auth.can('reports.find')" :title="auth.can('reports.find') ? 'Abrir el reporte' : 'No tienes permiso para esta acción'" @click="open(r)">
                  <CIcon :icon="cilChartLine" /> Abrir
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>

  <!-- Reporte abierto -->
  <template v-else>
    <CCard class="mb-4 fade-in">
      <CCardHeader class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <strong>{{ current.name }}</strong>
        <CButton color="secondary" variant="outline" size="sm" @click="back"><CIcon :icon="cilArrowLeft" /> Volver</CButton>
      </CCardHeader>
      <CCardBody>
        <p class="text-body-secondary">{{ current.description }}</p>

        <h6 class="mb-2">Filtros</h6>
        <CRow class="mb-2">
          <CCol v-for="(f, key) in current.filters" :key="key" :md="f.type === 'date_range' ? 6 : 4" class="mb-3">
            <label class="form-label">{{ f.label }}</label>
            <template v-if="f.type === 'date_range'">
              <div class="input-group">
                <input v-model="filters[key].from" type="date" class="form-control" :class="{ 'is-invalid': get(`filters.${key}.from`) }" />
                <span class="input-group-text">a</span>
                <input v-model="filters[key].to" type="date" class="form-control" :class="{ 'is-invalid': get(`filters.${key}.to`) }" />
              </div>
              <div v-if="get(`filters.${key}.to`) || get(`filters.${key}.from`)" class="invalid-feedback d-block">{{ get(`filters.${key}.to`) || get(`filters.${key}.from`) }}</div>
            </template>
            <template v-else>
              <ComboSelect
                :model-value="''"
                :options="optionsOf(f).filter((o) => !filters[key].includes(o.value))"
                placeholder="Escribe o selecciona..."
                @change="(v) => addValue(key, v)"
              />
              <div class="d-flex flex-wrap gap-1 mt-2">
                <span v-for="v in filters[key]" :key="v" class="badge text-bg-primary d-inline-flex align-items-center gap-1">
                  {{ labelOf(f, v) }}
                  <button type="button" class="btn-close btn-close-white" style="font-size: .55rem" :aria-label="`Quitar ${labelOf(f, v)}`" @click="removeValue(key, v)"></button>
                </span>
              </div>
            </template>
          </CCol>
        </CRow>
        <CButton color="secondary" variant="outline" size="sm" class="mb-4" @click="clearFilters"><CIcon :icon="cilBan" /> Limpiar filtros</CButton>

        <h6 class="mb-2">Campos del reporte</h6>
        <p v-if="get('fields')" class="text-danger small"><CIcon :icon="cilBan" size="sm" /> {{ get('fields') }}</p>
        <div v-for="g in current.fields" :key="g.name" class="mb-3">
          <div class="d-flex align-items-center gap-3 border-bottom pb-1 mb-2">
            <strong>{{ g.name }}</strong>
            <CButton color="link" size="sm" class="p-0" @click="toggleGroup(g)">
              <CIcon :icon="groupAll(g) ? cilX : cilCheckAlt" /> {{ groupAll(g) ? 'Quitar todos' : 'Marcar todos' }}
            </CButton>
          </div>
          <div class="row">
            <div v-for="f in g.fields" :key="f.data_key" class="col-md-6 col-lg-4">
              <CFormSwitch :id="`f-${f.data_key}`" :label="f.label" :checked="fieldOn(f.data_key)" @change="toggleField(f.data_key)" />
            </div>
          </div>
        </div>

        <div class="d-flex flex-wrap gap-2 mt-4">
          <CButton color="primary" :disabled="busy || !selected.length || !canGenerate" :title="canGenerate ? '' : 'No tienes permiso para esta acción'" @click="generate">
            <CSpinner v-if="busy" size="sm" class="me-1" /><CIcon v-else :icon="cilChartLine" class="me-1" />Generar
          </CButton>
          <CButton color="success" variant="outline" :disabled="busy || !selected.length || !canExport" :title="canExport ? 'Descarga el reporte en Excel' : 'No tienes permiso para esta acción'" @click="download">
            <CIcon :icon="cilCloudDownload" class="me-1" />Exportar a Excel
          </CButton>
        </div>
      </CCardBody>
    </CCard>

    <!-- Resultado -->
    <CCard v-if="result" class="fade-in">
      <CCardHeader class="d-flex justify-content-between align-items-center">
        <strong>Resultado</strong>
        <small class="text-body-secondary">{{ result.rows.length }} fila(s)</small>
      </CCardHeader>
      <CCardBody>
        <p v-if="!result.rows.length" class="text-body-secondary mb-0">No hay datos con los filtros elegidos.</p>
        <template v-else>
          <CTable small hover responsive class="mb-2">
            <CTableHead>
              <CTableRow><CTableHeaderCell v-for="c in result.columns" :key="c.data_key">{{ c.label }}</CTableHeaderCell></CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="(row, i) in result.rows.slice(0, shown)" :key="i">
                <CTableDataCell v-for="c in result.columns" :key="c.data_key">{{ row[c.data_key] }}</CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
          <div class="d-flex align-items-center gap-3">
            <small class="text-body-secondary">Mostrando {{ Math.min(shown, result.rows.length) }} de {{ result.rows.length }}</small>
            <CButton v-if="shown < result.rows.length" color="secondary" variant="outline" size="sm" @click="shown += 200">Ver más</CButton>
            <small v-if="shown >= result.rows.length && result.rows.length" class="text-body-secondary">Exporta a Excel para ver todo en una hoja.</small>
          </div>
        </template>
      </CCardBody>
    </CCard>
  </template>
</template>
