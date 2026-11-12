<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { cilSearch } from '@coreui/icons'
import dayjs from 'dayjs'
import CustomerSalesService from '@/services/integration/CustomerSalesService'
import { useAlertStore } from '@/stores/alertStore'
import { useServerErrors } from '@/composables/useServerErrors'
import { useSiigoCredentials } from '@/composables/useSiigoCredentials'
import { errorMessage, listOf, money } from '@/utils/format'
import Button from '@/components/UI/templates/Button.vue'
import EmptyState from '@/components/UI/templates/EmptyState.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import SiigoCredentialNotice from '@/components/UI/templates/SiigoCredentialNotice.vue'

// Clientes que compraron en una fecha y centro de costo, con su teléfono y lo que compraron (por ejemplo, quién compró este día el año pasado).
// El token de Siigo se toma de «Autorización Siigo» y solo valida el acceso.
const alerts = useAlertStore()
const { get, handle, clear } = useServerErrors()
const { ready } = useSiigoCredentials(['token'])

const costCenters = ref([])
const form = reactive({ date: dayjs().subtract(1, 'year').format('YYYY-MM-DD'), cost_center: '' })
const customers = ref(null) // null = aún no se consulta
const busy = ref(false)

onMounted(async () => {
  try {
    costCenters.value = listOf(await CustomerSalesService.costCenters(), 'cost_centers')
  } catch (error) {
    alerts.error(errorMessage(error))
  }
})

const search = async () => {
  clear()
  busy.value = true
  alerts.muted = true // consultar no es una escritura: sin aviso de «operación completada»
  try {
    const body = { date: form.date }
    if (form.cost_center !== '') body.cost_center = form.cost_center
    customers.value = (await CustomerSalesService.search(body)).data.customers
    Object.keys(wa).forEach((key) => delete wa[key])
  } catch (error) {
    handle(error)
  } finally {
    alerts.muted = false
    busy.value = false
  }
}

// Primero los clientes con teléfono válido y después los demás
const groups = computed(() => {
  const all = customers.value ?? []
  return [
    { title: 'Teléfonos válidos', list: all.filter((c) => c.phone_valid) },
    { title: 'Teléfonos no válidos o sin teléfono', list: all.filter((c) => !c.phone_valid) },
  ].filter((g) => g.list.length)
})

const qty = (n) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
const day = (value) => dayjs(value).format('DD/MM/YYYY')

// ---- Mensaje por WhatsApp: la foto vive solo en el navegador y nunca se sube al servidor ----
const image = ref(null) // Blob PNG (el portapapeles solo acepta PNG)
const previewUrl = ref('')
const message = ref('')
const wa = reactive({}) // identificación => { status, second, copied }

const toPng = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('png'))), 'image/png')
    }
    img.onerror = () => reject(new Error('imagen'))
    img.src = url
  })

const onImage = async (event) => {
  image.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  const file = event.target.files[0]
  if (!file) return
  try {
    image.value = await toPng(file)
    previewUrl.value = URL.createObjectURL(image.value)
  } catch {
    event.target.value = ''
    alerts.warning('No se pudo leer la imagen. Prueba con otra.')
  }
}

// "JUAN PEREZ" -> "Juan Perez"
const title = (name) => String(name).toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
const messageFor = (name) => message.value.replace(/\{nombre\}/gi, title(name))
const clipboardFailed = () => alerts.warning('No se pudo copiar al portapapeles. La página debe abrirse con https (o localhost) y permitir el acceso al portapapeles.')

// Solo celulares: el primero válido de la lista
const mobileOf = (customer) => (customer.phone ?? '').split(' / ').find((n) => /^3\d{9}$/.test(n))
const canWhatsapp = (customer) => customer.phone_valid && !!mobileOf(customer)

// WhatsApp toma solo la foto cuando el portapapeles trae foto y texto: se copia la foto primero y el mensaje después con su botón.
// Sin foto se copia el mensaje directamente.
const openChat = async (customer) => {
  const text = messageFor(customer.name)
  if (!text.trim() && !image.value) {
    alerts.warning('Escribe el mensaje o carga una foto primero.')
    return
  }
  try {
    if (image.value) await navigator.clipboard.write([new ClipboardItem({ 'image/png': image.value })])
    else await navigator.clipboard.writeText(text)
  } catch {
    clipboardFailed()
    return
  }
  wa[customer.identification] = {
    second: !!image.value && !!text.trim(),
    copied: false,
    status: image.value
      ? 'Foto copiada: abre el chat y pega con Ctrl + V. Luego pulsa «Copiar mensaje» y pégalo en el pie de la foto.'
      : 'Mensaje copiado: abre el chat y pega con Ctrl + V.',
  }
  // Chat directo con el cliente, sin texto en la URL
  window.open(`https://wa.me/57${mobileOf(customer)}`, '_blank')
}

const copyMessage = async (customer) => {
  try {
    await navigator.clipboard.writeText(messageFor(customer.name))
    wa[customer.identification].copied = true
  } catch {
    clipboardFailed()
  }
}
</script>

<template>
  <div class="d-flex flex-column gap-4 fade-in">
    <SiigoCredentialNotice :kinds="['token']" />

    <CCard>
      <CCardHeader><strong>Clientes por venta</strong></CCardHeader>
      <CCardBody>
        <p class="text-body-secondary">
          Consulta qué clientes compraron en una fecha, con su teléfono y lo que compraron. Sirve, por ejemplo, para ver quién compró este mismo día el año pasado.
          Se consulta un solo día. El token de Siigo solo valida tu acceso.
        </p>
        <form novalidate @submit.prevent="search">
          <CRow class="align-items-start">
            <CCol md="4">
              <FormField label="Fecha" required :error="get('date')">
                <input v-model="form.date" type="date" class="form-control" />
              </FormField>
            </CCol>
            <CCol md="5">
              <FormField label="Centro de costo (tienda)" :error="get('cost_center')">
                <select v-model="form.cost_center" class="form-select">
                  <option value="">Todos</option>
                  <option v-for="c in costCenters" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </FormField>
            </CCol>
            <CCol md="3" class="pt-md-4 mt-md-1">
              <Button type="submit" :loading="busy" :disabled="!ready || !form.date" permission="integration.customer_sales.search" :icon="cilSearch">Consultar</Button>
            </CCol>
          </CRow>
          <p v-if="get('token')" class="text-danger small mb-2">{{ get('token') }}</p>
          <RequiredNote />
        </form>
      </CCardBody>
    </CCard>

    <template v-if="customers">
      <CCard>
        <CCardHeader><strong>Mensaje por WhatsApp</strong></CCardHeader>
        <CCardBody>
          <p class="text-body-secondary small">
            La foto no se guarda en el servidor: solo se usa en esta pantalla. En el mensaje escribe <strong>{nombre}</strong> y se cambia por el nombre de cada cliente.
            El botón de cada cliente copia la foto al portapapeles y abre su chat de WhatsApp vacío; ahí pega con Ctrl + V. Después pulsa «Copiar mensaje» y pégalo.
          </p>
          <FormField label="Foto (opcional)">
            <input type="file" class="form-control" accept="image/*" @change="onImage" />
          </FormField>
          <img v-if="previewUrl" :src="previewUrl" alt="Vista previa de la foto" class="rounded mb-3" style="max-height: 140px; max-width: 100%" />
          <FormField label="Mensaje">
            <textarea v-model="message" class="form-control" rows="4" placeholder="Hola {nombre}, hace un año nos visitaste y queremos mostrarte…"></textarea>
          </FormField>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader><strong>{{ customers.length }} {{ customers.length === 1 ? 'cliente' : 'clientes' }}</strong></CCardHeader>
        <CCardBody>
          <EmptyState v-if="!customers.length" text="No hay ventas para esa fecha y centro de costo." />
          <template v-for="g in groups" :key="g.title">
            <h6 class="mt-3">{{ g.title }} ({{ g.list.length }})</h6>
            <div v-for="c in g.list" :key="c.identification" class="border rounded-3 p-3 mt-2">
              <div class="d-flex flex-wrap justify-content-between gap-2">
                <div>
                  <div class="fw-bold">{{ c.name }}</div>
                  <div class="fs-5 fw-bold" :class="c.phone_valid ? 'text-success' : 'text-danger'">{{ c.phone || 'Sin teléfono' }}</div>
                  <div v-if="c.email" class="small text-body-secondary">{{ c.email }}</div>
                </div>
                <div class="text-md-end">
                  <div class="small text-body-secondary">{{ c.invoices.length }} {{ c.invoices.length === 1 ? 'factura' : 'facturas' }}</div>
                  <template v-if="canWhatsapp(c)">
                    <CButton color="success" size="sm" class="mt-1" @click="openChat(c)">Enviar mensaje por WhatsApp</CButton>
                    <div v-if="wa[c.identification]" class="small text-success mt-1" style="max-width: 280px">
                      <div>{{ wa[c.identification].status }}</div>
                      <CButton v-if="wa[c.identification].second" color="success" variant="outline" size="sm" class="mt-1" @click="copyMessage(c)">
                        {{ wa[c.identification].copied ? 'Mensaje copiado: pégalo en el pie de la foto' : 'Copiar mensaje' }}
                      </CButton>
                    </div>
                  </template>
                </div>
              </div>
              <div v-for="inv in c.invoices" :key="inv.name" class="mt-3">
                <div class="fw-semibold small">{{ inv.name }} · {{ day(inv.date) }} · {{ money(inv.total) }}</div>
                <div class="table-responsive">
                  <table class="table table-sm mb-0">
                    <thead><tr><th>Referencia</th><th>Descripción</th><th class="text-end">Cantidad</th></tr></thead>
                    <tbody>
                      <tr v-for="(item, i) in inv.items" :key="i"><td>{{ item.code }}</td><td>{{ item.description }}</td><td class="text-end">{{ qty(item.quantity) }}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </template>
        </CCardBody>
      </CCard>
    </template>
  </div>
</template>
