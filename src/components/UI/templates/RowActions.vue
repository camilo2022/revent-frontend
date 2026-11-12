<script setup>
import { ref } from 'vue'
import { cilHistory, cilApplications, cilHome, cilList, cilLockLocked, cilSitemap, cilPencil, cilReload, cilSearch, cilTrash } from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'
import AuditTimeline from './AuditTimeline.vue'

// Acciones de una fila según la configuración y los permisos del usuario
const props = defineProps({ ctrl: { type: Object, required: true }, config: { type: Object, required: true }, row: { type: Object, required: true } })
// Ícono de cada acción extra según su panel
const panelIcons = { permissions: cilLockLocked, submodules: cilList, subcategories: cilSitemap, stores: cilHome }
const auth = useAuthStore()
const auditOpen = ref(false)
const rowTitle = () => props.row.name ?? props.row.code ?? props.row.consecutive ?? props.row.username ?? ''
const perm = (action) => (props.config.permission ? `${props.config.permission}.${action}` : '')
const title = (t) => `${t} ${props.config.singular}`
// Sin permiso el botón se ve desactivado y avisa con su ayuda
const hint = (allowed, text) => (allowed ? text : 'No tienes permiso para esta acción')
</script>

<template>
  <div class="d-inline-flex gap-1 flex-wrap justify-content-end">
    <CButton v-if="config.show" :disabled="!auth.can(perm('find'))" color="info" variant="outline" size="sm" :title="hint(auth.can(perm('find')), title('Ver'))" :aria-label="title('Ver')" @click="ctrl.goShow(row)"><CIcon :icon="cilSearch" /></CButton>
    <CButton
      v-if="ctrl.service?.base"
      :disabled="!auth.can('audits.find')"
      color="secondary" variant="outline" size="sm"
      :title="hint(auth.can('audits.find'), 'Auditoría del registro')" aria-label="Auditoría del registro"
      @click="auditOpen = true"
    ><CIcon :icon="cilHistory" /></CButton>
    <AuditTimeline v-if="auditOpen" :base="ctrl.service.base" :id="row.id" :title="rowTitle()" @close="auditOpen = false" />
    <template v-if="row.deleted_at">
      <CButton :disabled="!auth.can(perm('restore'))" color="success" variant="outline" size="sm" :title="hint(auth.can(perm('restore')), title('Restaurar'))" :aria-label="title('Restaurar')" @click="ctrl.restore(row)"><CIcon :icon="cilReload" /></CButton>
    </template>
    <template v-else-if="!config.readonly">
      <template v-for="a in config.extraActions" :key="a.label">
        <CButton :disabled="!auth.can(a.permission)" color="dark" variant="outline" size="sm" :title="hint(auth.can(a.permission), a.label)" :aria-label="a.label" @click="ctrl.goPanel(a.panel, row)"><CIcon :icon="a.sub ? cilList : (panelIcons[a.panel] ?? cilApplications)" /></CButton>
      </template>
      <CButton :disabled="!auth.can(perm('update'))" color="primary" variant="outline" size="sm" :title="hint(auth.can(perm('update')), title('Editar'))" :aria-label="title('Editar')" @click="ctrl.goEdit(row)"><CIcon :icon="cilPencil" /></CButton>
      <CButton v-if="!config.noDelete" :disabled="!auth.can(perm('delete'))" color="danger" variant="outline" size="sm" :title="hint(auth.can(perm('delete')), title('Eliminar'))" :aria-label="title('Eliminar')" @click="ctrl.remove(row)"><CIcon :icon="cilTrash" /></CButton>
    </template>
  </div>
</template>
