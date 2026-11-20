<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { cilListRich, cilMagnifyingGlass, cilReload, cilSync } from '@coreui/icons'
import EffiSyncService from '@/services/integration/EffiSyncService'
import { useAlertStore } from '@/stores/alertStore'
import { useAuthStore } from '@/stores/authStore'
import { confirmAction } from '@/utils/swal'
import { errorMessage } from '@/utils/format'
import Button from '@/components/UI/templates/Button.vue'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import JobQueuedNotice from '@/components/UI/templates/JobQueuedNotice.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'

// Sincronización de la bodega WEB de Siigo con Effi: cuadre, plan con las decisiones de la persona, ejecución y avance.
// Misma lógica que la pantalla web (siigo/effi_sync): comparten el job, el bloqueo y el avance.
const alerts = useAlertStore()
const auth = useAuthStore()
const MAX_ROWS = 500

const fmt = (n) => (n === null || n === undefined ? '—' : new Intl.NumberFormat('es-CO').format(n))

// ---- Cuadre ----
const STATUS = {
  igual: ['Igual', 'success'],
  diferencia: ['Diferencia', 'danger'],
  no_existe: ['No existe en Effi', 'secondary'],
  sin_control: ['Effi no controla stock por bodega', 'warning'],
  sin_stock_effi: ['Sin stock de Effi', 'info'],
  repetida: ['Referencia repetida en Effi', 'primary'],
}
const comparing = ref(false)
const comparison = ref(null)
const filter = ref('todos')
const search = ref('')

const compare = async () => {
  comparing.value = true
  try {
    comparison.value = (await EffiSyncService.compare()).data.comparison
    filter.value = 'todos'
  } catch (error) {
    alerts.error(errorMessage(error))
  } finally {
    comparing.value = false
  }
}

const statusTabs = computed(() => {
  if (!comparison.value) return []
  const counts = comparison.value.filas.reduce((acc, f) => ({ ...acc, [f.estado]: (acc[f.estado] || 0) + 1 }), {})
  return [['todos', `Todos (${comparison.value.filas.length})`], ...Object.keys(STATUS).filter((k) => counts[k]).map((k) => [k, `${STATUS[k][0]} (${counts[k]})`])]
})
const filteredRows = computed(() => {
  if (!comparison.value) return []
  const q = search.value.trim().toUpperCase()
  return comparison.value.filas.filter((f) => (filter.value === 'todos' || f.estado === filter.value)
    && (!q || f.codigo.includes(q) || String(f.descripcion).toUpperCase().includes(q) || String(f.effi_referencia || '').toUpperCase().includes(q)))
})
const compareTiles = computed(() => {
  const r = comparison.value.resumen
  const stock = comparison.value.stock_effi_disponible
  return [
    ['Unidades en Siigo', fmt(r.unidades_siigo), `${fmt(r.codigos_siigo)} códigos con saldo`],
    ['Unidades en Effi', stock ? fmt(r.unidades_effi) : 'Sin permiso', 'misma bodega'],
    ['Códigos iguales', stock ? fmt(r.iguales) : '—', ''],
    ['Con diferencia', stock ? fmt(r.con_diferencia) : '—', ''],
    ['No existen en Effi', fmt(r.no_existen), `${fmt(r.unidades_no_existen)} unidades de Siigo`],
    ['Sin control por bodega', fmt(r.sin_control), 'no se pueden ajustar así'],
  ]
})

// ---- Plan y decisiones ----
const CONTROL = { 0: 'sin trazabilidad', 1: 'SIN control de stock', 2: 'control por empresa', 3: 'control por bodega' }
const STEP_TABS = [['todos', 'Todos'], ['referencia', 'Cambiar referencia'], ['descripcion', 'Cambiar nombre'], ['crear', 'Crear artículo'], ['control', 'Cambiar control'], ['ajuste', 'Ajustes'], ['avisos', 'Con avisos']]
const planning = ref(false)
const plan = ref(null)
const planTab = ref('ok')
const stepFilter = ref('todos')
const choices = reactive({ modelos: {}, duplicados: {} })
const confirmText = ref('')
const launching = ref(false)
const launched = ref(null)

const loadPlan = async () => {
  planning.value = true
  try {
    plan.value = (await EffiSyncService.plan()).data.plan
    choices.modelos = {}
    choices.duplicados = {}
    confirmText.value = ''
    stepFilter.value = 'todos'
    planTab.value = totalDecisions.value ? 'dec' : 'ok'
  } catch (error) {
    alerts.error(errorMessage(error))
  } finally {
    planning.value = false
  }
}

const totalDecisions = computed(() => (plan.value ? plan.value.decisiones.categorias.length + plan.value.decisiones.duplicados.length : 0))
const pendingDecisions = computed(() => {
  if (!plan.value) return 0
  const d = plan.value.decisiones
  return d.categorias.filter((c) => !choices.modelos[c.modelo]).length + d.duplicados.filter((c) => !choices.duplicados[c.codigo]).length
})
const okItems = computed(() => (plan.value ? plan.value.items.filter((i) => !i.categoria_pendiente) : []))
const shownItems = computed(() => okItems.value.filter((i) => stepFilter.value === 'todos'
  || (stepFilter.value === 'avisos' ? (i.avisos || []).length : i.pasos.some((p) => p.tipo === stepFilter.value))))
const planTiles = computed(() => {
  const r = plan.value.resumen
  return [
    ['Códigos con cambios', fmt(r.codigos_con_cambios), ''],
    ['Referencias a cambiar', fmt(r.referencias_a_cambiar), 'quedan con el código de Siigo'],
    ['Nombres a cambiar', fmt(r.descripciones_a_cambiar), 'quedan con la descripción de Siigo'],
    ['Artículos a crear', fmt(r.articulos_a_crear), 'no existen en Effi'],
    ['Control a cambiar', fmt(r.controles_a_cambiar), `${fmt(r.articulos_a_vaciar)} se vacían antes`],
    ['Ingresos', fmt(r.unidades_ingreso), `${fmt(r.ingresos)} movimientos`],
    ['Egresos', fmt(r.unidades_egreso), `${fmt(r.egresos)} movimientos`],
    ['Con avisos', fmt(r.con_avisos), 'se sincronizan; revisar después'],
    ['No se tocan', fmt(r.manuales), 'requieren decisión tuya'],
  ]
})
const categoryOptions = computed(() => Object.entries(plan.value?.categorias || {}).map(([id, name]) => ({ id: String(id), name })))

const stepText = (s) => ({
  referencia: () => `Cambiar referencia ${s.de} → ${s.a}`,
  descripcion: () => `Cambiar nombre «${s.de}» → «${s.a}»`,
  crear: () => `Crear artículo «${s.datos.descripcion}»${s.datos.categoria ? ` (categoría ${s.datos.categoria})` : ' (sin categoría)'}${(s.datos.precios || []).length ? '' : ' (sin precios)'}`,
  vaciar: () => `Vaciar ${fmt(s.cantidad)} u. (sin control por bodega)`,
  control: () => 'Pasar a control por bodega',
  ajuste: () => (s.cantidad > 0 ? `Ingreso de +${fmt(s.cantidad)} u.` : `Egreso de ${fmt(s.cantidad)} u.`),
}[s.tipo]?.() ?? s.tipo)
const stepClass = (s) => (s.tipo === 'ajuste' ? (s.cantidad > 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold') : '')

// Categoría de un modelo: «existente» toma la elegida en el selector (por defecto la recomendada)
const selectedCategory = reactive({})
const categoryFor = (c) => selectedCategory[c.modelo] ?? (c.sugerida ? String(c.sugerida.id) : categoryOptions.value[0]?.id)
const chooseModel = (c, accion) => {
  choices.modelos[c.modelo] = accion === 'existente' ? { accion, categoria: Number(categoryFor(c)) } : { accion }
}
const pickCategory = (c, id) => {
  selectedCategory[c.modelo] = id
  chooseModel(c, 'existente')
}
const chooseDuplicate = (c, value) => {
  choices.duplicados[c.codigo] = value === 'ninguno' ? { ninguno: true } : { inhabilitar: value }
}
const applyRecommended = () => {
  plan.value.decisiones.categorias.forEach((c) => {
    if (!choices.modelos[c.modelo] && c.sugerida) choices.modelos[c.modelo] = { accion: 'existente', categoria: Number(c.sugerida.id) }
  })
  plan.value.decisiones.duplicados.forEach((c) => {
    if (!choices.duplicados[c.codigo] && c.recomendada) choices.duplicados[c.codigo] = { inhabilitar: c.recomendada }
  })
}

const canSync = computed(() => plan.value?.sincronizacion_activa && pendingDecisions.value === 0 && confirmText.value.trim() === 'SINCRONIZAR')

const launch = async (body) => {
  launching.value = true
  try {
    const res = await EffiSyncService.sync({ confirmacion: 'SINCRONIZAR', decisiones: { modelos: choices.modelos, duplicados: choices.duplicados }, ...body })
    launched.value = { message: res.message, emails: res.data.sync.correos || [] }
    confirmText.value = ''
    await pollStatus()
  } catch (error) {
    alerts.error(errorMessage(error))
  } finally {
    launching.value = false
  }
}
const syncAll = () => launch({})
const testOne = async (code) => {
  const ok = await confirmAction({ title: `¿Sincronizar solo ${code}?`, text: 'Se escribe en Effi de verdad, pero únicamente ese código. Sirve para probar antes de sincronizar todo.', confirmText: 'Sí, sincronizar' })
  if (ok) launch({ solo: code })
}

// ---- Avance (última sincronización: web, front o automática) ----
const DONE_LABELS = { referencias: 'Referencias', descripciones: 'Nombres', creados: 'Artículos creados', vaciados: 'Vaciados', controles: 'Controles', ingresos: 'Ingresos', egresos: 'Egresos', anulados: 'Anulados' }
const status = ref(null)
const statusLoading = ref(true)
let timer = null
const running = computed(() => ['planeando', 'ejecutando'].includes(status.value?.estado))

const pollStatus = async () => {
  clearTimeout(timer)
  if (!auth.can('integration.effi_sync.status')) {
    statusLoading.value = false
    return
  }
  try {
    status.value = (await EffiSyncService.status()).data.status
  } catch (error) {
    // El avance es informativo: si falla una consulta se reintenta en la siguiente vuelta
  } finally {
    statusLoading.value = false
  }
  if (running.value) timer = setTimeout(pollStatus, 5000)
}
onMounted(pollStatus)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="d-flex flex-column gap-4 fade-in">
    <CCard>
      <CCardHeader><strong>Sincronizar Effi con Siigo</strong></CCardHeader>
      <CCardBody>
        <p class="text-body-secondary">
          Compara, código por código, el inventario de la bodega <strong>WEB</strong> de Siigo con la bodega de Effi.
          La sincronización deja Effi exactamente igual a Siigo: corrige referencias y nombres, crea los artículos que faltan y hace el ajuste de inventario por la diferencia.
        </p>
        <div class="d-flex flex-wrap gap-2">
          <Button :loading="comparing" permission="integration.effi_sync.compare" :icon="cilMagnifyingGlass" @click="compare">Consultar inventario y diferencias</Button>
          <Button color="secondary" variant="outline" :loading="planning" permission="integration.effi_sync.plan" :icon="cilListRich" @click="loadPlan">Ver plan de sincronización</Button>
        </div>
        <p class="small text-body-secondary mt-3 mb-0">«Consultar» y «Ver plan» solo leen: no escriben nada en Effi. Cada consulta puede tardar unos 30 segundos.</p>
      </CCardBody>
    </CCard>

    <!-- Avance de la última sincronización -->
    <CCard v-if="!statusLoading && status">
      <CCardHeader class="d-flex justify-content-between align-items-center">
        <strong>Última sincronización</strong>
        <Button color="secondary" variant="outline" size="sm" :icon="cilReload" @click="pollStatus">Actualizar</Button>
      </CCardHeader>
      <CCardBody>
        <JobQueuedNotice v-if="launched" :message="launched.message" :emails="launched.emails" class="mb-3" />
        <div class="d-flex align-items-center gap-2 mb-2">
          <CSpinner v-if="running" size="sm" color="primary" />
          <CBadge :color="{ planeando: 'info', ejecutando: 'info', terminado: 'success', error: 'danger' }[status.estado] ?? 'secondary'" shape="rounded-pill">
            {{ { planeando: 'Preparando', ejecutando: 'En proceso', terminado: 'Terminada', error: 'Falló' }[status.estado] ?? status.estado }}
          </CBadge>
          <span>{{ status.fase || status.mensaje || (status.estado === 'terminado' ? 'Terminó la sincronización.' : '') }}</span>
          <small class="text-body-secondary ms-auto">{{ status.actualizado }}</small>
        </div>
        <div v-if="status.hechos" class="d-flex flex-wrap gap-2 mb-2">
          <span v-for="(v, k) in status.hechos" :key="k" class="border rounded-3 px-2 py-1 small">{{ DONE_LABELS[k] ?? k }}: <strong>{{ fmt(v) }}</strong></span>
        </div>
        <div v-if="(status.revision || []).length" class="table-responsive mt-3">
          <h6 class="text-body-secondary">Para revisar después de sincronizar ({{ status.revision.length }})</h6>
          <table class="table table-sm align-middle mb-0">
            <thead><tr><th>Código</th><th>Por qué</th></tr></thead>
            <tbody>
              <tr v-for="r in status.revision" :key="r.codigo">
                <td class="text-nowrap">{{ r.codigo }}</td>
                <td class="small"><div v-for="(m, i) in r.motivos" :key="i">{{ m }}</div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CCardBody>
    </CCard>

    <!-- Plan de sincronización -->
    <CCard v-if="planning || plan">
      <CCardHeader><strong>Plan de sincronización</strong></CCardHeader>
      <CCardBody>
        <Skeleton v-if="planning" variant="table" />
        <template v-else>
          <p class="small text-body-secondary">Plan del {{ plan.fecha }} · Siigo: bodega WEB ({{ plan.bodega_siigo }}) · Effi: {{ plan.bodega_effi }}</p>
          <p v-for="(n, i) in plan.notas || []" :key="i" class="small text-body-secondary mb-1">ℹ {{ n }}</p>

          <CRow class="g-2 my-2">
            <CCol v-for="[l, v, h] in planTiles" :key="l" xs="6" md="4" xl="3">
              <div class="border rounded-3 p-2 h-100">
                <div class="small text-body-secondary text-uppercase">{{ l }}</div>
                <div class="fs-4 fw-bold">{{ v }}</div>
                <div class="small text-body-secondary">{{ h }}</div>
              </div>
            </CCol>
          </CRow>

          <ul class="nav nav-tabs mt-3 mb-3">
            <li class="nav-item">
              <button type="button" class="nav-link" :class="{ active: planTab === 'ok' }" @click="planTab = 'ok'">Listo para sincronizar ({{ fmt(okItems.length) }})</button>
            </li>
            <li class="nav-item">
              <button type="button" class="nav-link" :class="{ active: planTab === 'dec' }" @click="planTab = 'dec'">
                Decisiones que te tocan ({{ totalDecisions }})
                <CBadge v-if="pendingDecisions" color="warning" shape="rounded-pill" class="ms-1">{{ pendingDecisions }} sin responder</CBadge>
                <CBadge v-else color="success" shape="rounded-pill" class="ms-1">todas respondidas</CBadge>
              </button>
            </li>
          </ul>

          <!-- Decisiones de la persona -->
          <div v-if="planTab === 'dec'">
            <EmptyState v-if="!totalDecisions" text="No hay decisiones que tomar: todo se puede sincronizar tal como está." />
            <template v-else>
              <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                <small class="text-body-secondary">El sistema no decide nada por ti: la sincronización no se ejecuta mientras haya decisiones sin responder.</small>
                <Button color="secondary" variant="outline" size="sm" @click="applyRecommended">Aplicar la recomendación donde la hay</Button>
              </div>

              <div v-for="c in plan.decisiones.categorias" :key="`m-${c.modelo}`" class="border rounded-3 p-3 mb-2">
                <div class="fw-semibold">Categoría para {{ c.cantidad }} artículo(s) nuevo(s) con modelo {{ c.modelo === '' ? '(sin modelo en Siigo)' : `«${c.modelo}»` }}</div>
                <small class="text-body-secondary d-block mb-2">Ejemplos: {{ c.ejemplos.join(', ') }}. En Effi no hay una categoría con ese nombre. ¿Qué categoría llevan?</small>
                <label class="d-flex flex-wrap gap-2 align-items-center mb-1" style="cursor: pointer">
                  <input type="radio" class="form-check-input mt-0" :name="`m-${c.modelo}`" :checked="choices.modelos[c.modelo]?.accion === 'existente'" @change="chooseModel(c, 'existente')" />
                  Usar una categoría que ya existe:
                  <select class="form-select form-select-sm w-auto" :value="categoryFor(c)" @change="pickCategory(c, $event.target.value)">
                    <option v-for="o in categoryOptions" :key="o.id" :value="o.id">{{ o.name }}</option>
                  </select>
                  <CBadge v-if="c.sugerida" color="success" shape="rounded-pill">Recomendada: {{ c.sugerida.nombre }}</CBadge>
                  <small v-if="c.sugerida" class="text-body-secondary">{{ c.sugerida.motivo }}</small>
                </label>
                <label v-if="c.modelo !== ''" class="d-flex gap-2 align-items-center mb-1" style="cursor: pointer">
                  <input type="radio" class="form-check-input mt-0" :name="`m-${c.modelo}`" :checked="choices.modelos[c.modelo]?.accion === 'crear'" @change="chooseModel(c, 'crear')" />
                  Crear la categoría «{{ c.modelo }}» en Effi <small class="text-body-secondary">(solo se crea si no existe ya)</small>
                </label>
                <label class="d-flex gap-2 align-items-center" style="cursor: pointer">
                  <input type="radio" class="form-check-input mt-0" :name="`m-${c.modelo}`" :checked="choices.modelos[c.modelo]?.accion === 'ninguna'" @change="chooseModel(c, 'ninguna')" />
                  Crear los artículos sin categoría <small class="text-body-secondary">(la asignas después en Effi)</small>
                </label>
              </div>

              <div v-for="c in plan.decisiones.duplicados" :key="`d-${c.codigo}`" class="border rounded-3 p-3 mb-2">
                <div class="fw-semibold">{{ c.codigo }} está dos veces en Effi · Siigo tiene {{ fmt(c.siigo) }} u.</div>
                <small class="text-body-secondary d-block mb-2">{{ c.descripcion }}. ¿Cuál se inhabilita? El inhabilitado se vacía y se anula (en Effi se puede reactivar); el otro queda con las unidades de Siigo.</small>
                <label v-for="a in c.articulos" :key="a.id" class="d-flex flex-wrap gap-2 align-items-center mb-1" style="cursor: pointer">
                  <input type="radio" class="form-check-input mt-0" :name="`d-${c.codigo}`" :checked="choices.duplicados[c.codigo]?.inhabilitar === a.id" @change="chooseDuplicate(c, a.id)" />
                  Inhabilitar #{{ a.id }} · {{ CONTROL[a.gestion_stock] ?? a.gestion_stock }} · {{ fmt(a.stock) }} u. en la bodega
                  <CBadge v-if="c.recomendada === a.id" color="success" shape="rounded-pill">Recomendado: no controla stock por bodega</CBadge>
                </label>
                <label class="d-flex gap-2 align-items-center" style="cursor: pointer">
                  <input type="radio" class="form-check-input mt-0" :name="`d-${c.codigo}`" :checked="!!choices.duplicados[c.codigo]?.ninguno" @change="chooseDuplicate(c, 'ninguno')" />
                  No tocar ninguna por ahora
                </label>
              </div>
            </template>
          </div>

          <!-- Lo que se sincroniza sin decidir nada -->
          <div v-else>
            <div class="d-flex flex-wrap gap-2 mb-2">
              <button v-for="[k, l] in STEP_TABS" :key="k" type="button" class="btn btn-sm rounded-pill" :class="stepFilter === k ? 'btn-primary' : 'btn-outline-secondary'" @click="stepFilter = k">{{ l }}</button>
            </div>
            <EmptyState v-if="!shownItems.length" text="Sin filas para este filtro." />
            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead><tr><th>Código Siigo</th><th>Descripción Siigo</th><th class="text-end">Siigo</th><th class="text-end">Effi</th><th>Qué se haría en Effi</th><th></th></tr></thead>
                <tbody>
                  <tr v-for="i in shownItems.slice(0, MAX_ROWS)" :key="i.codigo">
                    <td class="text-nowrap">{{ i.codigo }}</td>
                    <td class="small">{{ i.descripcion }}</td>
                    <td class="text-end">{{ fmt(i.siigo) }}</td>
                    <td class="text-end">{{ fmt(i.effi) }}</td>
                    <td class="small">
                      <div v-for="(p, n) in i.pasos" :key="n" :class="stepClass(p)">{{ stepText(p) }}</div>
                      <div v-for="(a, n) in i.avisos || []" :key="`a${n}`" class="text-warning-emphasis">⚠ {{ a }}</div>
                    </td>
                    <td>
                      <Button v-if="plan.sincronizacion_activa" color="secondary" variant="outline" size="sm" permission="integration.effi_sync.sync" :disabled="running || launching" @click="testOne(i.codigo)">Probar solo este</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <small class="text-body-secondary">{{ shownItems.length > MAX_ROWS ? `Mostrando ${MAX_ROWS} de ${shownItems.length}.` : `${shownItems.length} filas.` }}</small>
            </div>
          </div>

          <!-- Ejecutar -->
          <CAlert v-if="!plan.sincronizacion_activa" color="warning" class="mt-3 mb-0">
            La sincronización que escribe en Effi está <strong>desactivada</strong> en el servidor (EFFI_SYNC_ENABLED) hasta que se apruebe el plan. Puedes revisar el cuadre y el plan.
          </CAlert>
          <div v-else class="border-top mt-3 pt-3">
            <p class="small mb-2">
              Para ejecutar el plan escribe <strong>SINCRONIZAR</strong> y pulsa el botón. Esto <strong>escribe en Effi</strong> (referencias, artículos nuevos y ajustes de inventario) en segundo plano.
              <template v-if="(plan.correos || []).length">El resultado llega por correo a <strong>{{ plan.correos.join(', ') }}</strong>.</template>
            </p>
            <div class="d-flex flex-wrap gap-2 align-items-center">
              <input v-model="confirmText" type="text" class="form-control w-auto" placeholder="SINCRONIZAR" />
              <Button :loading="launching" permission="integration.effi_sync.sync" :icon="cilSync" :disabled="!canSync || running" @click="syncAll">Sincronizar con Effi</Button>
              <small v-if="pendingDecisions" class="text-warning-emphasis">Faltan {{ pendingDecisions }} decisiones por responder.</small>
              <small v-if="running" class="text-body-secondary">Hay una sincronización en curso.</small>
            </div>
          </div>
        </template>
      </CCardBody>
    </CCard>

    <!-- Cuadre -->
    <CCard v-if="comparing || comparison">
      <CCardHeader><strong>Inventario y diferencias</strong></CCardHeader>
      <CCardBody>
        <Skeleton v-if="comparing" variant="table" />
        <template v-else>
          <p class="small text-body-secondary">Consulta del {{ comparison.fecha }} · Siigo: bodega WEB ({{ comparison.bodega_siigo }}) · Effi: {{ comparison.bodega_effi }}</p>
          <CAlert v-if="!comparison.stock_effi_disponible" color="warning">
            Effi no está entregando el stock de los artículos: el usuario de la API key necesita permiso de consulta sobre <strong>«Artículos - Stock disponible» (función 156)</strong>.
          </CAlert>

          <CRow class="g-2 mb-3">
            <CCol v-for="[l, v, h] in compareTiles" :key="l" xs="6" md="4" xl="2">
              <div class="border rounded-3 p-2 h-100">
                <div class="small text-body-secondary text-uppercase">{{ l }}</div>
                <div class="fs-4 fw-bold">{{ v }}</div>
                <div class="small text-body-secondary">{{ h }}</div>
              </div>
            </CCol>
          </CRow>

          <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
            <div class="d-flex flex-wrap gap-2">
              <button v-for="[k, l] in statusTabs" :key="k" type="button" class="btn btn-sm rounded-pill" :class="filter === k ? 'btn-primary' : 'btn-outline-secondary'" @click="filter = k">{{ l }}</button>
            </div>
            <input v-model="search" type="search" class="form-control form-control-sm w-auto" placeholder="Buscar código o descripción" />
          </div>

          <EmptyState v-if="!filteredRows.length" text="Sin filas para este filtro." />
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr><th>Código Siigo</th><th>Descripción Siigo</th><th class="text-end">Siigo</th><th class="text-end">Effi</th><th class="text-end">Diferencia</th><th>Artículo en Effi</th><th>Estado</th></tr>
              </thead>
              <tbody>
                <tr v-for="f in filteredRows.slice(0, MAX_ROWS)" :key="`${f.codigo}-${f.effi_id}`">
                  <td class="text-nowrap">{{ f.codigo }}</td>
                  <td class="small">{{ f.descripcion }}</td>
                  <td class="text-end">{{ fmt(f.siigo) }}</td>
                  <td class="text-end">{{ fmt(f.effi) }}</td>
                  <td class="text-end" :class="f.diferencia > 0 ? 'text-success fw-semibold' : (f.diferencia < 0 ? 'text-danger fw-semibold' : '')">
                    {{ f.diferencia === null ? '—' : `${f.diferencia > 0 ? '+' : ''}${fmt(f.diferencia)}` }}
                  </td>
                  <td class="small">
                    <template v-if="f.effi_id">
                      {{ f.effi_referencia }}
                      <div class="text-body-secondary">#{{ f.effi_id }}{{ f.cruce === 'descripcion' ? ' · por descripción' : '' }} · {{ f.effi_descripcion }}</div>
                    </template>
                    <span v-else class="text-body-secondary">—</span>
                  </td>
                  <td><CBadge :color="STATUS[f.estado]?.[1] ?? 'secondary'" shape="rounded-pill">{{ STATUS[f.estado]?.[0] ?? f.estado }}</CBadge></td>
                </tr>
              </tbody>
            </table>
            <small class="text-body-secondary">{{ filteredRows.length > MAX_ROWS ? `Mostrando ${MAX_ROWS} de ${filteredRows.length}; usa el buscador para acotar.` : `${filteredRows.length} filas.` }}</small>
          </div>
        </template>
      </CCardBody>
    </CCard>
  </div>
</template>
