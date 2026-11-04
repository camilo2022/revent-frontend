<script setup>
import { onMounted, reactive, watch } from 'vue'
import ResourceScreen from '@/components/UI/templates/ResourceScreen.vue'
import ProductionOrderService from '@/services/ProductionOrderService'
import Form from './Form.vue'
import Show from './Show.vue'
import { configuration } from './configuration.vue'

const props = defineProps({ ctrl: { type: Object, required: true } })

// Pestañas rápidas por estado con contador (listados de 1 registro: meta.pagination.total)
const tabs = [['', 'Todas'], ...configuration.statuses.map(([v]) => [v, v === 'Pendiente' ? 'Pendientes' : v === 'Aprobado' ? 'Aprobadas' : 'Canceladas'])]
const counts = reactive({})
const loadCounts = async () => {
  await Promise.all(
    tabs.map(async ([v]) => {
      try {
        const params = { per_page: 1, page: 1, ...(v ? { status: v } : {}) }
        counts[v] = (await ProductionOrderService.all(params)).data?.meta?.pagination?.total ?? null
      } catch {
        counts[v] = null
      }
    }),
  )
}
const pick = (v) => {
  props.ctrl.filters.status = v
  props.ctrl.refresh()
}
onMounted(loadCounts)
// Al volver a la lista (tras crear/aprobar/cancelar) se actualizan los contadores
watch(() => props.ctrl.mode, (m) => m === 'index' && loadCounts())
</script>

<template>
  <ResourceScreen :ctrl="ctrl" :config="configuration">
    <template #filters>
      <CNav variant="pills" class="gap-1">
        <CNavItem v-for="[v, l] in tabs" :key="v">
          <CNavLink href="#" :active="ctrl.filters.status === v" @click.prevent="pick(v)">
            {{ l }} <CBadge v-if="counts[v] != null" color="light" text-color="dark" shape="rounded-pill" class="ms-1">{{ counts[v] }}</CBadge>
          </CNavLink>
        </CNavItem>
      </CNav>
      <CFormSelect v-model="ctrl.filters.supplier_id" style="max-width: 220px" aria-label="Todos los proveedores" @change="ctrl.refresh()">
        <option value="">Todos los proveedores</option>
        <option v-for="o in ctrl.options.suppliers" :key="o.id" :value="o.id">{{ o.trade_name || o.legal_name }}</option>
      </CFormSelect>
    </template>
    <template #form="{ ctrl: c }">
      <Form :id="c.current?.id" @saved="c.saved(true)" @cancel="c.goIndex()" />
    </template>
    <template #show="{ ctrl: c }">
      <Show :id="c.current.id" @edit="c.goEdit(c.current)" @back="c.goIndex()" @open="(id) => c.goShow({ id })" />
    </template>
  </ResourceScreen>
</template>
