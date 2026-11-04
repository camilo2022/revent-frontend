<script setup>
import { cilPencil, cilReload, cilSearch, cilTrash } from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'

// Acciones de una fila según la configuración y los permisos del usuario
const props = defineProps({ ctrl: { type: Object, required: true }, config: { type: Object, required: true }, row: { type: Object, required: true } })
const auth = useAuthStore()
const perm = (action) => (props.config.permission ? `${props.config.permission}.${action}` : '')
const title = (t) => `${t} ${props.config.singular}`
</script>

<template>
  <div class="d-inline-flex gap-1 flex-wrap justify-content-end">
    <CButton v-if="config.show && auth.can(perm('find'))" color="info" variant="outline" size="sm" :title="title('Ver')" :aria-label="title('Ver')" @click="ctrl.goShow(row)"><CIcon :icon="cilSearch" /></CButton>
    <template v-if="row.deleted_at">
      <CButton v-if="auth.can(perm('restore'))" color="success" variant="outline" size="sm" @click="ctrl.restore(row)"><CIcon :icon="cilReload" /> Restaurar</CButton>
    </template>
    <template v-else-if="!config.readonly">
      <template v-for="a in config.extraActions" :key="a.label">
        <CButton v-if="auth.can(a.permission)" color="info" variant="outline" size="sm" @click="ctrl.goPanel(a.panel, row)">{{ a.label }}</CButton>
      </template>
      <CButton v-if="auth.can(perm('update'))" color="primary" variant="outline" size="sm" :title="title('Editar')" :aria-label="title('Editar')" @click="ctrl.goEdit(row)"><CIcon :icon="cilPencil" /></CButton>
      <CButton v-if="!config.noDelete && auth.can(perm('delete'))" color="danger" variant="outline" size="sm" :title="title('Eliminar')" :aria-label="title('Eliminar')" @click="ctrl.remove(row)"><CIcon :icon="cilTrash" /></CButton>
    </template>
  </div>
</template>
