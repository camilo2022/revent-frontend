<script setup>
import { ref } from 'vue'
import { cilHistory, cilPencil } from '@coreui/icons'
import AuditTimeline from './AuditTimeline.vue'
import { useAuthStore } from '@/stores/authStore'
import Button from './Button.vue'

// Detalle de solo lectura según config.show
const props = defineProps({ ctrl: { type: Object, required: true }, config: { type: Object, required: true } })
const auth = useAuthStore()
const auditOpen = ref(false)
const text = (v) => (v === null || v === undefined || v === '' ? '-' : v)
const canEdit = () => !props.config.readonly && auth.can(`${props.config.permission}.update`)
</script>

<template>
  <CCard class="fade-in">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>Detalle de {{ config.singular }}</strong>
      <div class="d-flex gap-2">
        <Button color="secondary" variant="outline" size="sm" @click="ctrl.goIndex()">Volver</Button>
        <Button v-if="!config.readonly" :permission="`${config.permission}.update`" variant="outline" size="sm" :icon="cilPencil" @click="ctrl.goEdit(ctrl.current)">Editar</Button>
        <Button v-if="ctrl.service?.base" permission="audits.find" color="secondary" variant="outline" size="sm" :icon="cilHistory" @click="auditOpen = true">Auditoría</Button>
        <AuditTimeline v-if="auditOpen" :base="ctrl.service.base" :id="ctrl.current.id" @close="auditOpen = false" />
      </div>
    </CCardHeader>
    <CCardBody>
      <CRow>
        <CCol v-for="f in config.show" :key="f.label" :md="f.type === 'list' ? 12 : 4" class="mb-3">
          <small class="text-body-secondary d-block">{{ f.label }}</small>
          <img v-if="f.type === 'photo'" :src="f.value(ctrl.current)" alt="" class="rounded border" style="width: 96px; height: 96px; object-fit: cover" @error="$event.target.style.display = 'none'" />
          <ul v-else-if="f.type === 'list'" class="mb-0 ps-3">
            <li v-for="item in f.value(ctrl.current)" :key="item">{{ item }}</li>
            <li v-if="!f.value(ctrl.current).length" class="list-unstyled text-body-secondary">Ninguno</li>
          </ul>
          <template v-else>{{ text(f.value(ctrl.current)) }}</template>
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>
</template>
