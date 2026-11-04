<script setup>
import { reactive, ref } from 'vue'
import dayjs from 'dayjs'
import UserService from '@/services/UserService'
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import SearchSelect from '@/components/UI/templates/SearchSelect.vue'
import Show from './Show.vue'
import { configuration, events } from './configuration.vue'

const props = defineProps({ ctrl: { type: Object, required: true } })

// Filtros locales: se aplican con el botón; las fechas siempre van las dos
const local = reactive({ user_id: '', event: '', start_date: '', end_date: '' })
const warning = ref('')

const apply = () => {
  warning.value = ''
  if (!!local.start_date !== !!local.end_date) {
    warning.value = 'Indica fecha desde y hasta (las dos).'
    return
  }
  if (local.start_date && dayjs(local.end_date).isBefore(local.start_date)) {
    warning.value = 'La fecha hasta no puede ser menor que la fecha desde.'
    return
  }
  Object.assign(props.ctrl.filters, local)
  props.ctrl.refresh()
}
const clear = () => {
  Object.assign(local, { user_id: '', event: '', start_date: '', end_date: '' })
  apply()
}
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #filters>
      <form class="d-flex flex-wrap gap-2 align-items-end" @submit.prevent="apply">
        <div style="min-width: 200px">
          <SearchSelect v-model="local.user_id" :service="UserService" list-key="users" :label-fn="(u) => u.username" :params="{ with_trashed: 1 }" placeholder="Usuario..." />
        </div>
        <CFormSelect v-model="local.event" style="max-width: 160px" aria-label="Evento">
          <option value="">Todos los eventos</option>
          <option v-for="(label, key) in events" :key="key" :value="key">{{ label }}</option>
        </CFormSelect>
        <CFormInput v-model="local.start_date" type="date" aria-label="Desde" style="max-width: 160px" />
        <CFormInput v-model="local.end_date" type="date" aria-label="Hasta" style="max-width: 160px" />
        <CButton type="submit" color="primary">Filtrar</CButton>
        <CButton type="button" color="secondary" variant="outline" @click="clear">Limpiar</CButton>
      </form>
      <CAlert v-if="warning" color="warning" class="py-1 px-2 mb-0 w-100">{{ warning }}</CAlert>
    </template>
    <template #show="{ ctrl: c }">
      <Show :id="c.current.id" @back="c.goIndex()" />
    </template>
  </ResourceScreen>
</template>
