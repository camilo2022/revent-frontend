<script setup>
import { cilArrowBottom, cilArrowTop, cilPlus, cilSave, cilTrash } from '@coreui/icons'
import { computed, onMounted, reactive, ref } from 'vue'
import RequestTypeService from '@/services/RequestTypeService'
import { useServerErrors } from '@/composables/useServerErrors'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { confirmAction } from '@/utils/swal'
import Button from '@/components/UI/templates/Button.vue'
import ErrorSummary from '@/components/UI/templates/ErrorSummary.vue'
import FormField from '@/components/UI/templates/FormField.vue'
import LoadingForm from '@/components/UI/templates/Skeleton.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'

// Crear o editar un tipo de solicitud: nombre, descripción y su formulario (settings.form), con la misma forma que los
// formularios configurables de Kanri: field (inglés), label (mayúsculas), type, rules, options, model, cardinality.
const props = defineProps({ id: [String, Number] })
const emit = defineEmits(['saved', 'cancel'])
const { errors, message, attributes, get, clear, handle } = useServerErrors()

const loading = ref(true)
const saving = ref(false)
const meta = ref({ field_types: {}, rules_by_type: {}, with_cardinality: [], models: {} })
const form = reactive({ name: '', description: '', fields: [] })
const { mark, confirmLeave } = useUnsavedChanges(() => JSON.stringify(form))

// Tipos agrupados como en Kanri
const TYPE_GROUPS = [
  ['Texto', ['text', 'textarea']],
  ['Número', ['number']],
  ['Fechas', ['date', 'datetime']],
  ['Selección', ['boolean', 'select', 'selectdinamic']],
  ['Archivos', ['file']],
]
const RULE_LABELS = { min: 'Mínimo', max: 'Máximo', regex: 'Expresión regular', after: 'Fecha mínima (después de)', before: 'Fecha máxima (antes de)' }
const RULE_HINTS = {
  min: (t) => (t === 'number' ? 'Valor mínimo.' : 'Caracteres mínimos.'),
  max: (t) => (t === 'number' ? 'Valor máximo.' : 'Caracteres máximos.'),
  regex: () => 'Con delimitadores, por ejemplo /^[A-Z]+$/.',
  after: (t) => (t === 'date' ? 'AAAA-MM-DD' : 'AAAA-MM-DD HH:mm'),
  before: (t) => (t === 'date' ? 'AAAA-MM-DD' : 'AAAA-MM-DD HH:mm'),
}

// El nombre del campo va en inglés: se sugiere desde la etiqueta y se corrige a mano
const slug = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)

const newField = () => ({ field: '', label: '', type: 'text', required: false, limits: {}, options: [''], model: '', cardinality: 'single', section: '', help: '', fieldTouched: false })

// Campo guardado → campo del formulario (las reglas se separan en required y sus límites)
const toForm = (f) => {
  const limits = {}
  let required = false
  ;(f.rules ?? []).forEach((rule) => {
    if (rule === 'required') required = true
    else {
      const [name, ...rest] = rule.split(':')
      limits[name] = rest.join(':')
    }
  })
  return { ...newField(), ...f, required, limits, options: f.options?.length ? [...f.options] : [''], model: f.model ?? '', cardinality: f.cardinality ?? 'single', section: f.section ?? '', help: f.help ?? '', fieldTouched: true }
}

const rulesOf = (f) => meta.value.rules_by_type[f.type] ?? []
const hasCardinality = (f) => meta.value.with_cardinality.includes(f.type)
const sections = computed(() => [...new Set(form.fields.map((f) => f.section).filter(Boolean))])

onMounted(async () => {
  try {
    meta.value = (await RequestTypeService.metadata()).data
    if (props.id) {
      const type = (await RequestTypeService.find(props.id)).data.request_type
      Object.assign(form, { name: type.name, description: type.description, fields: (type.settings?.form ?? []).map(toForm) })
    } else {
      form.fields.push(newField())
    }
    mark()
  } catch (error) {
    handle(error)
  } finally {
    loading.value = false
  }
})

const onLabel = (f) => {
  f.label = f.label.toUpperCase()
  if (!f.fieldTouched) f.field = slug(f.label)
}
const add = () => form.fields.push({ ...newField(), section: form.fields.at(-1)?.section ?? '' })
const remove = (i) => form.fields.splice(i, 1)
const move = (i, step) => {
  const [field] = form.fields.splice(i, 1)
  form.fields.splice(i + step, 0, field)
}
const addOption = (f) => f.options.push('')
const removeOption = (f, i) => (f.options.length > 1 ? f.options.splice(i, 1) : (f.options[0] = ''))

const payload = () => ({
  name: form.name,
  description: form.description,
  settings: {
    form: form.fields.map((f) => ({
      field: f.field,
      label: f.label,
      type: f.type,
      rules: [
        ...(f.required ? ['required'] : []),
        ...rulesOf(f).filter((r) => String(f.limits[r] ?? '').trim() !== '').map((r) => `${r}:${String(f.limits[r]).trim()}`),
      ],
      ...(f.type === 'select' ? { options: f.options.map((o) => o.trim()).filter(Boolean) } : {}),
      ...(f.type === 'selectdinamic' ? { model: f.model || null } : {}),
      ...(hasCardinality(f) ? { cardinality: f.cardinality } : {}),
      section: f.section || null,
      help: f.help || null,
    })),
  },
})

const save = async () => {
  const ok = await confirmAction({
    title: props.id ? '¿Desea actualizar el tipo de solicitud?' : '¿Desea guardar el tipo de solicitud?',
    text: props.id ? 'Las solicitudes ya creadas conservan el formulario con que se llenaron.' : 'Quedará disponible para crear solicitudes.',
    confirmText: props.id ? 'Sí, actualizar' : 'Sí, guardar',
  })
  if (!ok) return
  saving.value = true
  clear()
  try {
    const res = props.id ? await RequestTypeService.update(props.id, payload()) : await RequestTypeService.store(payload())
    mark()
    emit('saved', res.data?.request_type?.id ?? props.id)
  } catch (error) {
    handle(error)
  } finally {
    saving.value = false
  }
}

const cancel = async () => {
  if (await confirmLeave()) emit('cancel')
}
const fieldError = (i, key) => get(`settings.form.${i}.${key}`)
// Primer error de las opciones de un campo (settings.form.i.options.n)
const optionError = (i) => Object.entries(errors.value ?? {}).find(([k]) => k.startsWith(`settings.form.${i}.options.`))?.[1]?.[0]
</script>

<template>
  <LoadingForm v-if="loading" variant="form" />
  <form v-else novalidate @submit.prevent="save">
    <ErrorSummary :message="message" :errors="errors" :attributes="attributes" />

    <CCard class="mb-4">
      <CCardHeader><strong>{{ id ? 'Editar tipo de solicitud' : 'Nuevo tipo de solicitud' }}</strong></CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="5">
            <FormField label="Nombre" required :error="get('name')" hint="En mayúsculas, por ejemplo PIEZAS GRÁFICAS PARA TIENDAS.">
              <CFormInput v-model="form.name" maxlength="80" @input="form.name = form.name.toUpperCase()" />
            </FormField>
          </CCol>
          <CCol md="7">
            <FormField label="Descripción" required :error="get('description')">
              <CFormInput v-model="form.description" maxlength="255" />
            </FormField>
          </CCol>
        </CRow>
        <p class="small text-body-secondary mb-0">
          La fecha, quién la crea y el estado los registra el sistema en todas las solicitudes; aquí defines solo los campos de este tipo.
          Un <strong>select estático</strong> lleva opciones que escribes tú; un <strong>select dinámico</strong> se relaciona con un modelo
          (por ejemplo Tiendas: cada persona ve solo las que tiene asignadas).
        </p>
      </CCardBody>
    </CCard>

    <CCard class="mb-4">
      <CCardHeader class="d-flex justify-content-between align-items-center">
        <strong>Formulario de la solicitud ({{ form.fields.length }} campos)</strong>
        <Button size="sm" color="secondary" variant="outline" :icon="cilPlus" @click="add">Agregar campo</Button>
      </CCardHeader>
      <CCardBody>
        <div v-if="get('settings.form')" class="invalid-feedback d-block mb-2">{{ get('settings.form') }}</div>
        <datalist id="request-type-sections"><option v-for="s in sections" :key="s" :value="s" /></datalist>

        <div v-for="(f, i) in form.fields" :key="i" class="border rounded-3 p-3 mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-semibold">Campo n° {{ i + 1 }}<span v-if="f.label" class="text-body-secondary fw-normal"> · {{ f.label }}</span></span>
            <div class="d-flex gap-1">
              <CButton size="sm" color="secondary" variant="ghost" :disabled="i === 0" title="Subir" @click="move(i, -1)"><CIcon :icon="cilArrowTop" /></CButton>
              <CButton size="sm" color="secondary" variant="ghost" :disabled="i === form.fields.length - 1" title="Bajar" @click="move(i, 1)"><CIcon :icon="cilArrowBottom" /></CButton>
              <CButton size="sm" color="danger" variant="ghost" title="Quitar" @click="remove(i)"><CIcon :icon="cilTrash" /></CButton>
            </div>
          </div>

          <CRow>
            <CCol md="4">
              <FormField label="Etiqueta (nombre visible)" required :error="fieldError(i, 'label')">
                <CFormInput v-model="f.label" maxlength="120" @input="onLabel(f)" />
              </FormField>
            </CCol>
            <CCol md="3">
              <FormField label="Nombre del campo" required :error="fieldError(i, 'field')" hint="En inglés y snake_case, por ejemplo store_id.">
                <CFormInput v-model="f.field" maxlength="40" @input="f.fieldTouched = true; f.field = f.field.toLowerCase()" />
              </FormField>
            </CCol>
            <CCol md="3">
              <FormField label="Tipo de campo" required :error="fieldError(i, 'type')">
                <CFormSelect v-model="f.type">
                  <optgroup v-for="[group, types] in TYPE_GROUPS" :key="group" :label="group">
                    <option v-for="t in types" :key="t" :value="t">{{ meta.field_types[t] ?? t }}</option>
                  </optgroup>
                </CFormSelect>
              </FormField>
            </CCol>
            <CCol md="2" class="d-flex align-items-center">
              <CFormSwitch v-model="f.required" label="Obligatorio" class="mt-3" />
            </CCol>
          </CRow>

          <!-- Reglas según el tipo -->
          <CRow v-if="rulesOf(f).length">
            <CCol v-for="r in rulesOf(f)" :key="r" :md="r === 'regex' ? 4 : 2">
              <FormField :label="RULE_LABELS[r]" :error="fieldError(i, `rules.${r}`)" :hint="RULE_HINTS[r](f.type)">
                <CFormInput v-model="f.limits[r]" :type="['min', 'max'].includes(r) ? 'number' : 'text'" />
              </FormField>
            </CCol>
          </CRow>

          <!-- Select estático: opciones escritas a mano -->
          <FormField v-if="f.type === 'select'" label="Opciones" required :error="fieldError(i, 'options') || optionError(i)">
            <div v-for="(o, n) in f.options" :key="n" class="d-flex gap-2 mb-2">
              <CFormInput v-model="f.options[n]" maxlength="100" :placeholder="`Opción ${n + 1}`" />
              <CButton color="danger" variant="ghost" title="Quitar opción" @click="removeOption(f, n)"><CIcon :icon="cilTrash" /></CButton>
            </div>
            <CButton size="sm" color="secondary" variant="outline" @click="addOption(f)"><CIcon :icon="cilPlus" class="me-1" />Agregar opción</CButton>
          </FormField>

          <CRow v-if="f.type === 'selectdinamic' || hasCardinality(f)">
            <CCol v-if="f.type === 'selectdinamic'" md="4">
              <FormField label="Modelo relacionado" required :error="fieldError(i, 'model')">
                <CFormSelect v-model="f.model">
                  <option value="">Selecciona...</option>
                  <option v-for="(label, key) in meta.models" :key="key" :value="key">{{ label }}</option>
                </CFormSelect>
              </FormField>
            </CCol>
            <CCol v-if="hasCardinality(f)" md="4">
              <FormField label="Cantidad" :error="fieldError(i, 'cardinality')">
                <CFormSelect v-model="f.cardinality">
                  <option value="single">Una opción</option>
                  <option value="multiple">Varias opciones</option>
                </CFormSelect>
              </FormField>
            </CCol>
          </CRow>

          <CRow>
            <CCol md="4">
              <FormField label="Sección" :error="fieldError(i, 'section')" hint="Agrupa los campos en el formulario.">
                <CFormInput v-model="f.section" maxlength="120" list="request-type-sections" @input="f.section = f.section.toUpperCase()" />
              </FormField>
            </CCol>
            <CCol md="8">
              <FormField label="Ayuda" :error="fieldError(i, 'help')">
                <CFormInput v-model="f.help" maxlength="255" />
              </FormField>
            </CCol>
          </CRow>
        </div>

        <Button size="sm" color="secondary" variant="outline" :icon="cilPlus" @click="add">Agregar campo</Button>
      </CCardBody>
    </CCard>

    <RequiredNote />
    <div class="d-flex gap-2 justify-content-end">
      <CButton color="secondary" variant="outline" @click="cancel">Cancelar</CButton>
      <Button type="submit" :loading="saving" :icon="cilSave">Guardar</Button>
    </div>
  </form>
</template>
