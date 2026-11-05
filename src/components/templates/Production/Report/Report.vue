<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { cilArrowLeft, cilBan, cilChartLine, cilCheckAlt, cilColumns, cilCloudDownload, cilFilter, cilX } from '@coreui/icons'
import ReportService from '@/services/ReportService'
import { useOptions } from '@/composables/useOptions'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { errorMessage, listOf } from '@/utils/format'
import ComboSelect from '@/components/UI/templates/ComboSelect.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'

// Reportes (misma lógica que Kanri): filtros dinámicos que se agregan y quitan, columnas por grupo en un modal,
// tallas en horizontal (curva) cuando el reporte lo permite, y generar o exportar a Excel
const auth = useAuthStore()
const alerts = useAlertStore()
const { options, loadOptions } = useOptions()
const { get, handle, clear } = useServerErrors()

const reports = ref([])
const loading = ref(true)
const current = ref(null) // reporte abierto { id, name, description, fields, filters, pivot }
const selected = ref([]) // data_key elegidos
const filters = reactive({}) // clave => lista de valores | { from, to }
const visible = ref([]) // filtros agregados (los de show_by_default arrancan puestos y no se quitan)
const result = ref(null) // { columns, rows }
const busy = ref(false)
const shown = ref(100)
const columnsOpen = ref(false)
const columnSearch = ref('')
const pivot = ref(false)

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

const emptyFilter = (f) => (f.type === 'date_range' ? { from: '', to: '' } : [])

const open = async (report) => {
  clear()
  result.value = null
  current.value = report
  pivot.value = false
  columnSearch.value = ''
  Object.keys(filters).forEach((k) => delete filters[k])
  // Los filtros se preparan antes de cargar las listas para que la pantalla ya tenga con qué dibujarse
  Object.entries(report.filters ?? {}).forEach(([key, f]) => (filters[key] = emptyFilter(f)))
  visible.value = Object.entries(report.filters ?? {}).filter(([, f]) => f.show_by_default).map(([key]) => key)
  // Todos los campos vienen marcados; las listas de cada filtro salen de los catálogos
  selected.value = report.fields.flatMap((g) => g.fields.map((f) => f.data_key))
  const keys = Object.values(report.filters ?? {}).filter((f) => f.type === 'select' && !f.options).map((f) => f.data)
  if (keys.length) await loadOptions([...new Set(keys)])
}
const back = () => {
  current.value = null
  result.value = null
}

// Columnas
const fieldOn = (key) => selected.value.includes(key)
const toggleField = (key) => {
  selected.value = fieldOn(key) ? selected.value.filter((k) => k !== key) : [...selected.value, key]
}
const groupAll = (group) => group.fields.every((f) => fieldOn(f.data_key))
const toggleGroup = (group) => {
  const keys = group.fields.map((f) => f.data_key)
  selected.value = groupAll(group) ? selected.value.filter((k) => !keys.includes(k)) : [...new Set([...selected.value, ...keys])]
}
const selectedFields = computed(() => (current.value?.fields ?? []).flatMap((g) => g.fields).filter((f) => fieldOn(f.data_key)))
const totalFields = computed(() => (current.value?.fields ?? []).reduce((n, g) => n + g.fields.length, 0))
const norm = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const groupFields = (g) => (columnSearch.value ? g.fields.filter((f) => norm(f.label).includes(norm(columnSearch.value))) : g.fields)

// Opciones de un filtro de lista: fijas (options) o del catálogo indicado en `data`
const optionsOf = (f) => f.options ?? (options[f.data] ?? []).map((o) => ({ value: o.id, label: o.name ?? o.trade_name ?? o.legal_name }))
const labelOf = (f, value) => optionsOf(f).find((o) => String(o.value) === String(value))?.label ?? value
const addValue = (key, value) => {
  if (value !== '' && !filters[key].includes(value)) filters[key].push(value)
}
const removeValue = (key, value) => {
  filters[key] = filters[key].filter((v) => v !== value)
}

// Configurar filtros
const isVisible = (key) => visible.value.includes(key)
const hasValue = (v) => (Array.isArray(v) ? v.length : v.from || v.to)
const toggleFilter = (key) => {
  if (current.value.filters[key].show_by_default) return
  if (isVisible(key)) {
    visible.value = visible.value.filter((k) => k !== key)
    filters[key] = emptyFilter(current.value.filters[key])
  } else {
    visible.value = [...visible.value, key]
  }
}
const clearFilters = () => Object.entries(current.value.filters ?? {}).forEach(([key, f]) => (filters[key] = emptyFilter(f)))
const activeCount = computed(() => Object.entries(filters).filter(([key, v]) => isVisible(key) && hasValue(v)).length)

// Solo se envían los filtros agregados y con valor (como los espera el backend)
const body = () => {
  const active = {}
  Object.entries(filters).forEach(([key, value]) => {
    if (isVisible(key) && hasValue(value)) active[key] = value
  })
  // Los campos se envían en el orden de la definición del reporte
  const order = current.value.fields.flatMap((g) => g.fields.map((f) => f.data_key))
  return { fields: order.filter(fieldOn), filters: active, ...(current.value.pivot && pivot.value ? { pivot: true } : {}) }
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

// Con las tallas en horizontal las columnas "pivot:" son números: van a la derecha y suman al pie
const isPivotCol = (c) => c.data_key.startsWith('pivot:')
const totals = computed(() => Object.fromEntries((result.value?.columns ?? []).filter(isPivotCol).map((c) => [c.data_key, result.value.rows.reduce((n, r) => n + (Number(r[c.data_key]) || 0), 0)])))
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
        <p class="text-body-secondary mb-4">{{ current.description }}</p>

        <!-- Filtros dinámicos -->
        <div class="border rounded-3 p-3 mb-4">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div class="d-flex align-items-center gap-2">
              <strong><CIcon :icon="cilFilter" class="me-1" />Filtros</strong>
              <CBadge v-if="activeCount" color="primary" shape="rounded-pill">{{ activeCount }} activo(s)</CBadge>
            </div>
            <div class="d-flex gap-2">
              <CButton v-if="activeCount" color="secondary" variant="outline" size="sm" @click="clearFilters"><CIcon :icon="cilBan" /> Limpiar</CButton>
              <CDropdown auto-close="outside" placement="bottom-end">
                <CDropdownToggle color="primary" variant="outline" size="sm"><CIcon :icon="cilFilter" /> Configurar filtros</CDropdownToggle>
                <CDropdownMenu style="min-width: 260px">
                  <CDropdownHeader>Elige los filtros que quieres usar</CDropdownHeader>
                  <div v-for="(f, key) in current.filters" :key="key" class="px-3 py-1">
                    <CFormSwitch :id="`flt-${key}`" :label="f.label" :checked="isVisible(key)" :disabled="!!f.show_by_default" @change="toggleFilter(key)" />
                  </div>
                </CDropdownMenu>
              </CDropdown>
            </div>
          </div>

          <p v-if="!visible.length" class="text-body-secondary small mb-0">No hay filtros agregados. Usa «Configurar filtros» para agregarlos.</p>
          <CRow>
            <template v-for="(f, key) in current.filters" :key="key">
              <CCol v-if="isVisible(key)" :md="f.type === 'date_range' ? 6 : 4" class="mb-3 fade-in">
                <div class="d-flex justify-content-between align-items-center">
                  <label class="form-label mb-1">{{ f.label }}</label>
                  <button v-if="!f.show_by_default" type="button" class="btn btn-link btn-sm p-0 text-body-secondary" :title="`Quitar el filtro ${f.label}`" :aria-label="`Quitar el filtro ${f.label}`" @click="toggleFilter(key)"><CIcon :icon="cilX" size="sm" /></button>
                </div>
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
                      <button type="button" class="btn-close btn-close-white" style="font-size: 0.55rem" :aria-label="`Quitar ${labelOf(f, v)}`" @click="removeValue(key, v)"></button>
                    </span>
                  </div>
                </template>
              </CCol>
            </template>
          </CRow>
        </div>

        <!-- Columnas -->
        <div class="border rounded-3 p-3 mb-4">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <div class="d-flex align-items-center gap-2">
              <strong><CIcon :icon="cilColumns" class="me-1" />Columnas</strong>
              <CBadge color="primary" shape="rounded-pill">{{ selected.length }} de {{ totalFields }}</CBadge>
            </div>
            <CButton color="primary" variant="outline" size="sm" @click="columnsOpen = true"><CIcon :icon="cilColumns" /> Configurar columnas</CButton>
          </div>
          <p v-if="get('fields')" class="text-danger small mb-2"><CIcon :icon="cilBan" size="sm" /> {{ get('fields') }}</p>
          <div class="d-flex flex-wrap gap-1">
            <span v-for="f in selectedFields" :key="f.data_key" class="badge text-bg-light border text-body">{{ f.label }}</span>
            <span v-if="!selectedFields.length" class="text-body-secondary small">Ninguna columna elegida.</span>
          </div>
          <CFormSwitch v-if="current.pivot" id="pivot" v-model="pivot" :label="current.pivot.label" class="mt-3" />
        </div>

        <div class="d-flex flex-wrap gap-2">
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
              <CTableRow><CTableHeaderCell v-for="c in result.columns" :key="c.data_key" :class="{ 'text-end': isPivotCol(c) }">{{ c.label }}</CTableHeaderCell></CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="(row, i) in result.rows.slice(0, shown)" :key="i">
                <CTableDataCell v-for="c in result.columns" :key="c.data_key" :class="{ 'text-end': isPivotCol(c), 'fw-semibold': c.data_key === 'pivot:__total' }">{{ row[c.data_key] }}</CTableDataCell>
              </CTableRow>
              <CTableRow v-if="Object.keys(totals).length && shown >= result.rows.length" class="table-light fw-bold">
                <CTableDataCell v-for="(c, i) in result.columns" :key="c.data_key" :class="{ 'text-end': isPivotCol(c) }">{{ isPivotCol(c) ? totals[c.data_key] : i === 0 ? 'Total' : '' }}</CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
          <div class="d-flex align-items-center gap-3">
            <small class="text-body-secondary">Mostrando {{ Math.min(shown, result.rows.length) }} de {{ result.rows.length }}</small>
            <CButton v-if="shown < result.rows.length" color="secondary" variant="outline" size="sm" @click="shown += 200">Ver más</CButton>
          </div>
        </template>
      </CCardBody>
    </CCard>

    <!-- Configurar columnas: campos por grupo -->
    <CModal teleport :visible="columnsOpen" size="lg" scrollable alignment="center" @close="columnsOpen = false">
      <CModalHeader><CModalTitle>Configurar columnas</CModalTitle></CModalHeader>
      <CModalBody>
        <CFormInput v-model="columnSearch" type="search" placeholder="Buscar campo..." aria-label="Buscar campo" class="mb-3" />
        <template v-for="g in current.fields" :key="g.name">
          <div v-if="groupFields(g).length" class="mb-3">
            <div class="d-flex align-items-center gap-3 border-bottom pb-1 mb-2">
              <strong>{{ g.name }}</strong>
              <CButton color="link" size="sm" class="p-0" @click="toggleGroup(g)">
                <CIcon :icon="groupAll(g) ? cilX : cilCheckAlt" /> {{ groupAll(g) ? 'Quitar todos' : 'Marcar todos' }}
              </CButton>
            </div>
            <CRow>
              <CCol v-for="f in groupFields(g)" :key="f.data_key" md="6">
                <CFormSwitch :id="`f-${f.data_key}`" :label="f.label" :checked="fieldOn(f.data_key)" @change="toggleField(f.data_key)" />
              </CCol>
            </CRow>
          </div>
        </template>
      </CModalBody>
      <CModalFooter>
        <small class="me-auto text-body-secondary">{{ selected.length }} de {{ totalFields }} columnas</small>
        <CButton color="primary" @click="columnsOpen = false">Listo</CButton>
      </CModalFooter>
    </CModal>
  </template>
</template>
