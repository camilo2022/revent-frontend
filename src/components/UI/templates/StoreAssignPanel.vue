<script setup>
import { cilArrowLeft } from '@coreui/icons'
import { computed, onMounted, ref } from 'vue'
import StoreService from '@/services/StoreService'
import UserService from '@/services/UserService'
import { useAlertStore } from '@/stores/alertStore'
import { useAuthStore } from '@/stores/authStore'
import { errorMessage, listOf } from '@/utils/format'
import { confirmAction } from '@/utils/swal'
import CheckList from './CheckList.vue'
import Skeleton from './Skeleton.vue'

// Asignar/quitar las tiendas (bodegas de Siigo) en las que un usuario puede operar.
// Cada casilla llama a la API de inmediato (users/stores/assign y remove).
const props = defineProps({ record: { type: Object, required: true } })
defineEmits(['back'])
const auth = useAuthStore()
const alerts = useAlertStore()

const items = ref([])
const selected = ref([])
const accessAll = ref(false) // el usuario tiene el permiso «todas las bodegas»
const busy = ref(false)
const loading = ref(true)
const canEdit = computed(() => auth.can('users.stores.assign') && auth.can('users.stores.remove'))

onMounted(async () => {
  try {
    const mine = (await UserService.stores.all(props.record.id)).data
    selected.value = (mine.stores ?? []).map((s) => s.id)
    accessAll.value = !!mine.access_all
    items.value = listOf(await StoreService.all({ with_trashed: 0, per_page: 1000 }), 'stores').map((s) => ({
      id: s.id,
      label: `${s.name} (${s.code})`,
      group: '',
    }))
  } catch (error) {
    alerts.error(errorMessage(error))
  }
  loading.value = false
})

const apply = async (item, checked) => {
  const body = { store_id: item.id }
  if (checked) await UserService.stores.assign(props.record.id, body)
  else await UserService.stores.remove(props.record.id, body)
  selected.value = checked ? [...selected.value, item.id] : selected.value.filter((x) => x !== item.id)
}

const run = async (list, checked) => {
  if (!canEdit.value) return
  const ok = await confirmAction({
    title: checked ? '¿Desea asignar?' : '¿Desea quitar?',
    text: list.length === 1 ? list[0].label : `Se ${checked ? 'asignarán' : 'quitarán'} ${list.length} tiendas.`,
    confirmText: checked ? 'Sí, asignar' : 'Sí, quitar',
  })
  if (!ok) return
  busy.value = true
  alerts.muted = true
  try {
    for (const item of list) {
      if (selected.value.includes(item.id) !== checked) await apply(item, checked)
    }
    alerts.success('Cambios guardados')
  } catch (error) {
    alerts.error(errorMessage(error))
  } finally {
    alerts.muted = false
    busy.value = false
  }
}
</script>

<template>
  <CCard class="fade-in">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>Bodegas (tiendas) del usuario: {{ record.username }}</strong>
      <CButton color="secondary" variant="outline" size="sm" @click="$emit('back')"><CIcon :icon="cilArrowLeft" /> Volver</CButton>
    </CCardHeader>
    <CCardBody>
      <Skeleton v-if="loading" variant="form" />
      <template v-else>
        <CAlert v-if="accessAll" color="info">
          <CBadge color="info" class="me-2">Todas las bodegas</CBadge>
          Este usuario tiene el permiso «Acceso a todas las bodegas»: puede operar en cualquier bodega aunque no la tenga marcada aquí.
        </CAlert>
        <p class="text-body-secondary">Solo podrá sacar, ingresar o aceptar traslados y consultar el inventario de las tiendas marcadas (y de su bodega de tránsito).</p>
        <p v-if="!canEdit" class="text-body-secondary">No tienes permiso para modificar estas asignaciones.</p>
        <CheckList :items="items" :selected="selected" :busy="busy || !canEdit" @toggle="(i, c) => run([i], c)" @toggle-group="run" />
      </template>
    </CCardBody>
  </CCard>
</template>
