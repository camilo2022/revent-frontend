<script setup>
import { cilCheckAlt, cilLockLocked, cilTrash } from '@coreui/icons'
import { computed, reactive, ref } from 'vue'
import SiigoStatusDot from '@/components/UI/templates/SiigoStatusDot.vue'
import CredentialsService from '@/services/integration/CredentialsService'
import { useAlertStore } from '@/stores/alertStore'
import { useIntegrationStore } from '@/stores/integrationStore'
import { KINDS, STATUS } from '@/config/integration'
import { errorMessage } from '@/utils/format'
import { confirmAction } from '@/utils/swal'

// Autorización Siigo: aquí se cargan el Token y la Cookie que entrega la extensión de Revent.
// Se guardan en este navegador mientras no venzan; al cerrar sesión se borran.
const store = useIntegrationStore()
const alerts = useAlertStore()

const kinds = Object.keys(KINDS)
const draft = reactive({ token: '', cookie: '' })
const errors = reactive({ token: '', cookie: '' })
const checking = ref('')
const verified = reactive({ token: null, cookie: null }) // resultado de Probar: { valid, user }

const slot = (kind) => store[kind]
const mask = (value) => (value ? `${value.slice(0, 6)}…${value.slice(-6)} (${value.length} caracteres)` : '')
const time = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '')
const when = (kind) => {
  const s = slot(kind)
  if (!s.value) return s.status === 'expired' ? 'Venció, vuelve a cargarla.' : 'Todavía no has cargado esta credencial.'
  const left = store.minutesLeft(kind)
  const h = Math.floor(left / 60)
  return `Cargada a las ${time(s.savedAt)} · vence a las ${time(s.expiresAt)} (${h ? `${h} h ` : ''}${left % 60} min)`
}
const statusLabel = (kind) => STATUS[store.status(kind)]?.label ?? ''

const save = (kind) => {
  errors[kind] = ''
  verified[kind] = null
  try {
    store.set(kind, draft[kind])
    draft[kind] = ''
    alerts.success(`${KINDS[kind].label} guardado en este navegador.`)
  } catch (error) {
    errors[kind] = errorMessage(error)
  }
}

const remove = async (kind) => {
  const ok = await confirmAction({ title: `¿Quitar el ${KINDS[kind].label}?`, text: 'Tendrás que volver a pegarlo para usar las acciones que lo necesitan.', confirmText: 'Sí, quitar' })
  if (!ok) return
  store.clear(kind)
  verified[kind] = null
  errors[kind] = ''
}

// Pregunta a Siigo si la credencial guardada sirve y de qué usuario es
const check = async (kind) => {
  if (!store.usable(kind)) return
  checking.value = kind
  errors[kind] = ''
  try {
    const res = await CredentialsService.check({ [kind]: slot(kind).value })
    const result = res.data?.[kind]
    verified[kind] = result ?? null
    if (result?.valid) {
      store.markValid(kind)
      alerts.success(`${KINDS[kind].label} válido${result.user?.name ? `: ${result.user.name}` : ''}.`)
    } else {
      store.markInvalid(kind, 'Siigo no aceptó la credencial.')
      errors[kind] = 'Siigo no aceptó esta credencial. Cárgala de nuevo.'
    }
  } catch (error) {
    // El 422 de token/cookie ya marca la credencial como inválida desde el interceptor
    errors[kind] = error?.errors?.[kind]?.[0] ?? errorMessage(error)
  } finally {
    checking.value = ''
  }
}

const cards = computed(() => kinds.map((kind) => ({ kind, ...KINDS[kind] })))
</script>

<template>
  <div class="siigo-auth fade-in">
    <div class="mb-4">
      <h4 class="mb-1"><CIcon :icon="cilLockLocked" class="me-2" />Autorización Siigo</h4>
      <p class="text-body-secondary mb-0">
        Carga una vez tu Token y/o tu Cookie de Siigo y se usarán solos en las pantallas de Integraciones mientras no venzan.
        Se guardan solo en este navegador y se borran al cerrar sesión. Cada una sirve para acciones distintas: puedes cargar solo la que necesites.
      </p>
    </div>

    <CRow class="g-4">
      <CCol v-for="c in cards" :key="c.kind" lg="6">
        <CCard class="h-100">
          <CCardHeader class="d-flex justify-content-between align-items-center">
            <strong>{{ c.label }}</strong>
            <span class="d-inline-flex align-items-center gap-2 small"><SiigoStatusDot :status="store.status(c.kind)" /> {{ statusLabel(c.kind) }}</span>
          </CCardHeader>
          <CCardBody class="d-flex flex-column gap-3">
            <p class="small text-body-secondary mb-0">{{ c.hint }}</p>

            <div v-if="slot(c.kind).value" class="border rounded-3 p-3 bg-body-tertiary">
              <div class="font-monospace small text-break">{{ mask(slot(c.kind).value) }}</div>
              <div class="small text-body-secondary mt-1">{{ when(c.kind) }}</div>
              <div v-if="slot(c.kind).lastError" class="small text-danger mt-1">{{ slot(c.kind).lastError }}</div>
              <div v-if="verified[c.kind]?.valid" class="small text-success mt-1">
                <CIcon :icon="cilCheckAlt" /> Usuario de Siigo: {{ verified[c.kind].user?.name ?? verified[c.kind].user?.user ?? 'verificado' }}
              </div>
            </div>
            <div v-else class="small text-body-secondary">{{ when(c.kind) }}</div>

            <div>
              <CFormTextarea v-model="draft[c.kind]" rows="3" spellcheck="false" autocomplete="off" class="font-monospace small" :invalid="!!errors[c.kind]" :placeholder="`Pega aquí el ${c.label.toLowerCase()}...`" :aria-label="`Pegar ${c.label}`" />
              <div v-if="errors[c.kind]" class="invalid-feedback d-block">{{ errors[c.kind] }}</div>
            </div>

            <div class="d-flex flex-wrap gap-2">
              <CButton color="primary" :disabled="!draft[c.kind].trim()" @click="save(c.kind)">Guardar</CButton>
              <CButton color="success" variant="outline" :disabled="!store.usable(c.kind) || checking === c.kind" @click="check(c.kind)">
                <CSpinner v-if="checking === c.kind" size="sm" class="me-1" />Probar
              </CButton>
              <CButton color="danger" variant="outline" :disabled="!slot(c.kind).value" @click="remove(c.kind)"><CIcon :icon="cilTrash" /> Quitar</CButton>
            </div>

            <div class="mt-auto">
              <div class="small fw-semibold mb-1">Pantallas que la usan</div>
              <ul class="small text-body-secondary mb-0 ps-3">
                <li v-for="u in c.uses" :key="u">{{ u }}</li>
              </ul>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>
