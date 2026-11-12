<script setup>
import { computed, reactive, ref } from 'vue'
import { cilPlus, cilSend, cilX } from '@coreui/icons'
import { useServerErrors } from '@/composables/useServerErrors'
import Button from '@/components/UI/templates/Button.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import JobQueuedNotice from '@/components/UI/templates/JobQueuedNotice.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'

// Formulario de los exportes de Siigo por correo: correos de aviso, periodo (mes o rango) y, si hace falta, campos propios del reporte.
// `request` recibe el cuerpo y devuelve la promesa del servicio; la respuesta trae { export: { emails, jobs } }.
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  request: { type: Function, required: true },
  permission: { type: String, default: undefined },
  period: Boolean, // muestra "Periodo a consultar" (mes completo / rango manual)
  initial: { type: Object, default: () => ({}) }, // valores iniciales de los campos propios
})

const { get, handle, clear } = useServerErrors()

const emails = ref([''])
const mode = ref('month')
const month = ref('')
const createdStart = ref('')
const createdEnd = ref('')
const fields = reactive({ ...props.initial })
const busy = ref(false)
const queued = ref(null) // { emails, jobs } cuando el exporte quedó en cola

const addEmail = () => emails.value.push('')
const removeEmail = (index) => {
  emails.value.splice(index, 1)
  if (!emails.value.length) emails.value.push('')
}

// Solo se envía lo que tiene valor; sin correos el backend usa la lista por defecto del equipo
const body = computed(() => {
  const data = {}
  const list = emails.value.map((e) => e.trim()).filter(Boolean)
  if (list.length) data.emails = list
  if (props.period) {
    if (mode.value === 'month' && month.value) data.month = month.value
    if (mode.value === 'range') {
      data.created_start = createdStart.value
      data.created_end = createdEnd.value
    }
  }
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) data[key] = value
  })
  return data
})

const submit = async () => {
  clear()
  busy.value = true
  try {
    const res = await props.request(body.value)
    queued.value = res.data.export
  } catch (error) {
    handle(error)
  } finally {
    busy.value = false
  }
}

const reset = () => {
  queued.value = null
  clear()
}
</script>

<template>
  <CCard class="fade-in">
    <CCardHeader>
      <strong>{{ title }}</strong>
      <div v-if="subtitle" class="small text-body-secondary mt-1">{{ subtitle }}</div>
    </CCardHeader>
    <CCardBody>
      <div v-if="queued" class="d-flex flex-column gap-3">
        <JobQueuedNotice message="El reporte se está generando." :emails="queued.emails">
          <div class="small">Puede tardar varios minutos. Cuando termine llegará el archivo al correo.</div>
        </JobQueuedNotice>
        <div><CButton color="primary" variant="outline" size="sm" @click="reset">Generar otro reporte</CButton></div>
      </div>

      <form v-else novalidate @submit.prevent="submit">
        <h6 class="text-body-secondary mb-2">Correos de notificación</h6>
        <div v-for="(_, index) in emails" :key="index" class="mb-2">
          <div class="input-group">
            <input v-model="emails[index]" type="email" class="form-control" :class="{ 'is-invalid': get(`emails.${index}`) }" placeholder="nombre@correo.com" autocomplete="off" />
            <button type="button" class="btn btn-outline-secondary" :disabled="emails.length <= 1 && !emails[index]" title="Quitar correo" aria-label="Quitar correo" @click="removeEmail(index)"><CIcon :icon="cilX" size="sm" /></button>
          </div>
          <div v-if="get(`emails.${index}`)" class="invalid-feedback d-block">{{ get(`emails.${index}`) }}</div>
        </div>
        <div v-if="get('emails')" class="invalid-feedback d-block mb-2">{{ get('emails') }}</div>
        <CButton color="primary" variant="outline" size="sm" type="button" @click="addEmail"><CIcon :icon="cilPlus" /> Agregar otro correo</CButton>
        <div class="form-text mb-4">Si no agregas ningún correo, se enviará a la lista de notificación por defecto del equipo.</div>

        <template v-if="period">
          <h6 class="text-body-secondary mb-2">Periodo a consultar</h6>
          <div class="btn-group mb-3" role="group" aria-label="Tipo de periodo">
            <button type="button" class="btn btn-sm" :class="mode === 'month' ? 'btn-primary' : 'btn-outline-primary'" @click="mode = 'month'">Mes completo</button>
            <button type="button" class="btn btn-sm" :class="mode === 'range' ? 'btn-primary' : 'btn-outline-primary'" @click="mode = 'range'">Rango manual</button>
          </div>
          <CRow v-if="mode === 'month'">
            <CCol md="4">
              <FormField label="Mes" :error="get('month')" hint="Si lo dejas en blanco, se generará el reporte del mes actual.">
                <input v-model="month" type="month" class="form-control" />
              </FormField>
            </CCol>
          </CRow>
          <CRow v-else>
            <CCol md="4">
              <FormField label="Fecha inicio" required :error="get('created_start')">
                <input v-model="createdStart" type="datetime-local" class="form-control" />
              </FormField>
            </CCol>
            <CCol md="4">
              <FormField label="Fecha fin" required :error="get('created_end')" hint="Ambas fechas son obligatorias si usas el rango manual.">
                <input v-model="createdEnd" type="datetime-local" class="form-control" />
              </FormField>
            </CCol>
          </CRow>
        </template>

        <slot name="fields" :fields="fields" :get="get" />

        <div class="d-flex flex-wrap align-items-center gap-3 mt-2">
          <Button type="submit" :loading="busy" :permission="permission" :icon="cilSend">Generar reporte</Button>
          <RequiredNote v-if="period && mode === 'range'" />
        </div>
      </form>
    </CCardBody>
  </CCard>
</template>
