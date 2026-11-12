<script setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'

// Resultado de la trazabilidad con auditoría de traslados: resumen, filtros y, por código, sus movimientos con saldo acumulado
const props = defineProps({ audit: { type: Object, required: true } })
defineEmits(['back'])

const labels = {
  transito: 'Por tránsito',
  directo: 'Traslado directo',
  parcial: 'Parcial',
  sin_bodega_transito: 'Bodega sin tránsito',
  salida_transito: 'Sale a tránsito',
  salida_directa: 'Salida directa a otra bodega',
  sin_origen: 'Sin dato de origen',
}
const badgeColor = {
  transito: 'success', directo: 'danger', parcial: 'warning', sin_bodega_transito: 'secondary',
  salida_transito: 'info', salida_directa: 'danger', sin_origen: 'secondary', otro: 'secondary', sin_movimientos: 'secondary',
}
// Estados que se resaltan: salió o llegó directo, sin pasar por la bodega de tránsito
const alerts = ['directo', 'parcial', 'salida_directa']

const summary = computed(() => props.audit.summary ?? {})
const alertCount = computed(() => alerts.reduce((n, s) => n + (summary.value[s] ?? 0), 0))
const fmt = (n) => (n === null || n === undefined ? '' : new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n))

const filter = ref('all')
const query = ref('')
const norm = (v) => String(v ?? '').toLowerCase()

const statusesOf = (product) => [...new Set(product.rows.map((r) => r.status).filter(Boolean))]
const isIrregular = (product) => statusesOf(product).some((s) => alerts.includes(s))
const badgeOf = (product) => {
  const statuses = statusesOf(product)
  if (statuses.includes('salida_directa')) return 'salida_directa'
  if (statuses.includes('directo')) return 'directo'
  if (statuses.includes('parcial')) return 'parcial'
  if (statuses.length) return statuses[0]
  return product.rows.length ? 'otro' : 'sin_movimientos'
}
const badgeLabel = (product) => {
  const badge = badgeOf(product)
  if (labels[badge]) return labels[badge]
  if (!product.rows.length) return 'Sin movimientos'
  return product.rows.some((r) => r.entry > 0) ? 'Otros ingresos' : 'Solo salidas'
}

const products = computed(() =>
  props.audit.products.filter((p) => {
    const okGroup = filter.value === 'all' || (filter.value === 'irregular') === isIrregular(p)
    const okText = !query.value.trim() || norm(`${p.code} ${p.name}`).includes(norm(query.value.trim()))
    return okGroup && okText
  }),
)
</script>

<template>
  <div class="d-flex flex-column gap-3 fade-in">
    <CCard>
      <CCardBody class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h5 class="mb-1">Trazabilidad con auditoría de traslados</h5>
          <div class="text-body-secondary">
            Bodega <strong>{{ audit.warehouse }}</strong>
            <template v-if="audit.transit"> · tránsito: <strong>{{ audit.transit }}</strong></template>
            · desde <strong>{{ dayjs(audit.start_date).format('DD/MM/YYYY') }}</strong>
          </div>
        </div>
        <CButton color="secondary" variant="outline" size="sm" @click="$emit('back')"><slot name="back-icon" /> Nueva consulta</CButton>
      </CCardBody>
    </CCard>

    <CAlert v-if="!audit.transit" color="warning" class="mb-0">
      No existe una bodega «TRANSITO {{ audit.warehouse }}» en Siigo, así que todo ingreso por traslado se muestra sin clasificar.
    </CAlert>

    <CRow class="g-3">
      <CCol sm="6" lg="2"><CCard class="h-100 border-start border-4 border-success"><CCardBody><div class="fs-4 fw-bold">{{ summary.transito ?? 0 }}</div><div class="small text-body-secondary">Ingresos por tránsito</div></CCardBody></CCard></CCol>
      <CCol sm="6" lg="2"><CCard class="h-100 border-start border-4 border-danger"><CCardBody><div class="fs-4 fw-bold">{{ summary.directo ?? 0 }}</div><div class="small text-body-secondary">Ingresos directos desde otra bodega</div></CCardBody></CCard></CCol>
      <CCol sm="6" lg="2"><CCard class="h-100 border-start border-4 border-danger"><CCardBody><div class="fs-4 fw-bold">{{ summary.salida_directa ?? 0 }}</div><div class="small text-body-secondary">Salidas directas a otra bodega</div></CCardBody></CCard></CCol>
      <CCol sm="6" lg="2"><CCard class="h-100 border-start border-4 border-warning"><CCardBody><div class="fs-4 fw-bold">{{ summary.parcial ?? 0 }}</div><div class="small text-body-secondary">Parciales (parte directa)</div></CCardBody></CCard></CCol>
      <CCol sm="6" lg="2"><CCard class="h-100 border-start border-4 border-secondary"><CCardBody><div class="fs-4 fw-bold">{{ summary.otros ?? 0 }}</div><div class="small text-body-secondary">Otros ingresos (compra, ajuste…)</div></CCardBody></CCard></CCol>
      <CCol sm="6" lg="2"><CCard class="h-100 border-start border-4 border-secondary"><CCardBody><div class="fs-4 fw-bold">{{ summary.sin_movimientos ?? 0 }}</div><div class="small text-body-secondary">Códigos sin movimientos</div></CCardBody></CCard></CCol>
    </CRow>

    <div class="d-flex flex-wrap align-items-center gap-2">
      <button type="button" class="btn btn-sm" :class="filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'" @click="filter = 'all'">Todos</button>
      <button type="button" class="btn btn-sm" :class="filter === 'irregular' ? 'btn-primary' : 'btn-outline-secondary'" @click="filter = 'irregular'">Con traslado directo ({{ alertCount }})</button>
      <button type="button" class="btn btn-sm" :class="filter === 'ok' ? 'btn-primary' : 'btn-outline-secondary'" @click="filter = 'ok'">Sin traslados directos</button>
      <input v-model="query" type="search" class="form-control form-control-sm ms-md-auto" style="max-width: 280px" placeholder="Buscar código o nombre…" aria-label="Buscar código o nombre" />
    </div>

    <p v-if="!products.length" class="text-body-secondary text-center py-4 mb-0">Ningún código coincide con el filtro.</p>

    <details v-for="p in products" :key="p.code" class="card" :open="isIrregular(p)">
      <summary class="card-body d-flex flex-wrap align-items-center gap-2" style="cursor: pointer">
        <span class="fw-bold">{{ p.code }}</span>
        <span class="text-body-secondary flex-grow-1">{{ p.name ?? 'Sin movimientos en el periodo' }}</span>
        <span v-if="p.rows.length" class="small">Saldo final <strong>{{ fmt(p.rows[p.rows.length - 1].balance) }}</strong></span>
        <CBadge :color="badgeColor[badgeOf(p)]" shape="rounded-pill">{{ badgeLabel(p) }}</CBadge>
      </summary>
      <div v-if="p.rows.length" class="table-responsive border-top">
        <table class="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Comprobante</th>
              <th class="text-end">Entrada</th>
              <th class="text-end">Salida</th>
              <th class="text-end">Saldo</th>
              <th>Resultado</th>
              <th>Origen → destino</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in p.rows" :key="i" :class="{ 'table-danger': alerts.includes(r.status) }">
              <td class="text-nowrap">{{ r.date }}<small class="d-block text-body-secondary">{{ r.time }}</small></td>
              <td><a v-if="r.url" :href="r.url" target="_blank" rel="noopener">{{ r.voucher }}</a><template v-else>{{ r.voucher }}</template></td>
              <td class="text-end text-success">{{ r.entry > 0 ? fmt(r.entry) : '' }}</td>
              <td class="text-end text-danger">{{ r.output > 0 ? fmt(r.output) : '' }}</td>
              <td class="text-end fw-semibold">{{ fmt(r.balance) }}</td>
              <td>
                <template v-if="r.status">
                  <CBadge :color="badgeColor[r.status]" shape="rounded-pill">{{ labels[r.status] }}</CBadge>
                  <small v-if="r.status === 'parcial'" class="d-block text-body-secondary">{{ fmt(r.via_transit) }} por tránsito · {{ fmt(r.direct) }} directas</small>
                  <small v-else-if="r.status === 'directo'" class="d-block text-body-secondary">Llegó sin pasar por el tránsito</small>
                  <small v-else-if="r.status === 'salida_directa'" class="d-block text-body-secondary">Salió a una bodega que no es tránsito</small>
                </template>
                <CBadge v-else-if="r.entry > 0" color="secondary" shape="rounded-pill">No es traslado</CBadge>
              </td>
              <td><template v-if="r.origin && r.destination"><strong>{{ r.origin }}</strong> → <strong>{{ r.destination }}</strong></template></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="card-body border-top text-body-secondary small">Este código no tuvo movimientos en la bodega en el periodo consultado.</div>
    </details>
  </div>
</template>
