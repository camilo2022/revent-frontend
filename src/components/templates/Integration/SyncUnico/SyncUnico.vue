<script setup>
import { onMounted, ref } from 'vue'
import { cilReload, cilSync } from '@coreui/icons'
import dayjs from 'dayjs'
import SyncUnicoService from '@/services/integration/SyncUnicoService'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { errorMessage } from '@/utils/format'
import Button from '@/components/UI/templates/Button.vue'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import JobQueuedNotice from '@/components/UI/templates/JobQueuedNotice.vue'
import Skeleton from '@/components/UI/templates/Skeleton.vue'

// Sincronizar ventas de Siigo con Único: lanzar a mano (hoy, ayer o un rango) y ver cómo salieron las últimas ejecuciones
const MAX_DAYS = 31
const alerts = useAlertStore()
const { get, handle, clear } = useServerErrors()

const runs = ref([])
const notifyEmail = ref('')
const loading = ref(true)
const refreshing = ref(false)
const busy = ref(false)
const launched = ref('')
const mode = ref('today')
const createdStart = ref('')
const createdEnd = ref('')
const today = dayjs().format('YYYY-MM-DD')

const options = [
  { value: 'today', title: 'Hoy', hint: 'El mismo rango de la sincronización automática.' },
  { value: 'yesterday', title: 'Ayer', hint: 'Para recuperar un día completo que no se envió.' },
  { value: 'range', title: 'Rango de fechas', hint: `Hasta ${MAX_DAYS} días.` },
]
const statusLabels = { running: 'En proceso', stale: 'Sin respuesta', success: 'Completada', failed: 'Falló' }
const statusColor = { running: 'info', stale: 'warning', success: 'success', failed: 'danger' }

const load = async () => {
  refreshing.value = true
  try {
    const res = await SyncUnicoService.runs()
    runs.value = res.data.runs
    notifyEmail.value = res.data.notify_email
  } catch (error) {
    alerts.error(errorMessage(error))
  } finally {
    loading.value = false
    refreshing.value = false
  }
}
onMounted(load)

const run = async () => {
  clear()
  launched.value = ''
  busy.value = true
  try {
    const body = { mode: mode.value }
    if (mode.value === 'range') Object.assign(body, { created_start: createdStart.value, created_end: createdEnd.value })
    const res = await SyncUnicoService.run(body)
    launched.value = res.message
    await load()
  } catch (error) {
    handle(error)
  } finally {
    busy.value = false
  }
}

const fmtDate = (iso) => (iso ? dayjs(iso).format('DD/MM/YYYY hh:mm A') : '—')
const fmtDay = (d) => (d ? dayjs(d).format('DD/MM') : '—')
const fmtNum = (n) => (n === null || n === undefined ? '—' : new Intl.NumberFormat('es-CO').format(n))
</script>

<template>
  <div class="d-flex flex-column gap-4 fade-in">
    <CCard>
      <CCardHeader><strong>Sincronizar ventas con Único</strong></CCardHeader>
      <CCardBody>
        <p class="text-body-secondary">
          Las ventas de Siigo se envían a Único automáticamente <strong>cada hora, de 8:00 a. m. a 10:00 p. m.</strong>
          Si una ejecución automática falla o no llega a correr, lánzala a mano desde aquí.
        </p>

        <JobQueuedNotice v-if="launched" :message="launched" class="mb-3" />

        <form novalidate @submit.prevent="run">
          <h6 class="text-body-secondary mb-2">¿Qué ventas quieres sincronizar?</h6>
          <div class="d-flex flex-column flex-md-row gap-2 mb-3">
            <label v-for="o in options" :key="o.value" class="border rounded-3 p-3 flex-fill d-flex gap-2 align-items-start" :class="{ 'border-primary bg-primary-subtle': mode === o.value }" style="cursor: pointer">
              <input v-model="mode" type="radio" name="mode" class="form-check-input mt-1" :value="o.value" />
              <span>
                <span class="fw-semibold d-block">{{ o.title }}</span>
                <small class="text-body-secondary">{{ o.hint }}</small>
              </span>
            </label>
          </div>
          <div v-if="get('mode')" class="invalid-feedback d-block mb-2">{{ get('mode') }}</div>

          <CRow v-if="mode === 'range'">
            <CCol md="4">
              <FormField label="Fecha inicial" required :error="get('created_start')">
                <input v-model="createdStart" type="date" class="form-control" :max="today" />
              </FormField>
            </CCol>
            <CCol md="4">
              <FormField label="Fecha final" required :error="get('created_end')">
                <input v-model="createdEnd" type="date" class="form-control" :max="today" />
              </FormField>
            </CCol>
          </CRow>

          <p class="small text-body-secondary">
            Único responde cuántas ventas insertó y cuántas rechazó; lo verás en «Enviadas» y «Rechazadas» del historial.
            <template v-if="notifyEmail">El resultado completo llega por correo a <strong>{{ notifyEmail }}</strong>.</template>
          </p>
          <Button type="submit" :loading="busy" permission="integration.sync_unico.run" :icon="cilSync">Sincronizar ahora</Button>
        </form>
      </CCardBody>
    </CCard>

    <CCard>
      <CCardHeader class="d-flex justify-content-between align-items-center">
        <strong>Últimas sincronizaciones</strong>
        <Button color="secondary" variant="outline" size="sm" :loading="refreshing" :icon="cilReload" @click="load">Actualizar</Button>
      </CCardHeader>
      <CCardBody>
        <Skeleton v-if="loading" variant="table" />
        <EmptyState v-else-if="!runs.length" text="Todavía no hay sincronizaciones registradas. Aparecerán aquí desde la próxima ejecución, automática o manual." />
        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Lanzada</th>
                <th>Origen</th>
                <th>Ventas del</th>
                <th>Estado</th>
                <th class="text-end">Facturas</th>
                <th class="text-end">Enviadas</th>
                <th class="text-end">Rechazadas</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in runs" :key="r.run_id">
                <td class="text-nowrap">{{ fmtDate(r.started_at) }}</td>
                <td class="text-capitalize">{{ r.source }}</td>
                <td class="text-nowrap">
                  {{ fmtDay(r.range?.[0]) }}<template v-if="fmtDay(r.range?.[0]) !== fmtDay(r.range?.[1])"> → {{ fmtDay(r.range?.[1]) }}</template>
                </td>
                <td><CBadge :color="statusColor[r.status] ?? 'secondary'" shape="rounded-pill">{{ statusLabels[r.status] ?? r.status }}</CBadge></td>
                <td class="text-end">{{ fmtNum(r.invoices) }}</td>
                <td class="text-end">{{ fmtNum(r.sent) }}</td>
                <td class="text-end">{{ fmtNum(r.rejected) }}</td>
                <td class="small">
                  <span v-if="r.status === 'failed'" class="text-danger" :title="r.error">{{ (r.error ?? '').slice(0, 90) }}</span>
                  <span v-else-if="r.status === 'stale'">Lleva más de 90 minutos sin terminar: revisa que la cola de sincronización esté corriendo.</span>
                  <span v-else-if="r.status === 'running'">Esperando resultado…</span>
                  <span v-else-if="r.finished_at">Terminó {{ fmtDate(r.finished_at) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>
