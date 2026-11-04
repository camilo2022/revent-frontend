<script setup>
import { onMounted, ref } from 'vue'
import { cilPencil } from '@coreui/icons'
import { useServerErrors } from '@/composables/useServerErrors'
import { usePermissions } from '@/composables/usePermissions'
import { firstOf } from '@/utils/format'
import LoadingForm from '@/components/LoadingForm.vue'
import { useResource } from './resourceConfig'

// Detalle genérico de solo lectura según config.show
const props = defineProps({ resource: { type: String, required: true }, id: [String, Number] })
const { can } = usePermissions()
const { config, base, perm } = useResource(props.resource)
const { handle } = useServerErrors()
const entity = ref(null)

onMounted(async () => {
  try {
    entity.value = firstOf(await config.service.find(props.id))
  } catch (error) {
    handle(error)
  }
})
const show = (v) => (v === null || v === undefined || v === '' ? '-' : v)
</script>

<template>
  <LoadingForm v-if="!entity" />
  <CCard v-else>
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>Detalle de {{ config.singular }}</strong>
      <div class="d-flex gap-2">
        <RouterLink :to="base"><CButton color="secondary" variant="outline" size="sm">Volver</CButton></RouterLink>
        <RouterLink v-if="!config.readonly && can(perm('update'))" :to="`${base}/${id}/edit`">
          <CButton color="primary" size="sm"><CIcon :icon="cilPencil" /> Editar</CButton>
        </RouterLink>
      </div>
    </CCardHeader>
    <CCardBody>
      <CRow>
        <CCol v-for="f in config.show" :key="f.label" :md="f.type === 'list' ? 12 : 4" class="mb-3">
          <small class="text-body-secondary d-block">{{ f.label }}</small>
          <img v-if="f.type === 'photo'" :src="f.value(entity)" alt="" class="rounded border" style="width: 96px; height: 96px; object-fit: cover" @error="$event.target.style.display = 'none'" />
          <ul v-else-if="f.type === 'list'" class="mb-0 ps-3">
            <li v-for="item in f.value(entity)" :key="item">{{ item }}</li>
            <li v-if="!f.value(entity).length" class="list-unstyled text-body-secondary">Ninguno</li>
          </ul>
          <template v-else>{{ show(f.value(entity)) }}</template>
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>
</template>
