<script setup>
import { useRouter } from 'vue-router'
import { cilAccountLogout } from '@coreui/icons'
import { useAuthStore } from '@/stores/auth'
import { date, fileUrl } from '@/utils/format'

// Datos del usuario autenticado (vienen de /auth/user)
const auth = useAuthStore()
const router = useRouter()
const person = () => auth.user?.employee?.person

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <CCard class="mb-4">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <strong>Mi perfil</strong>
      <CButton color="secondary" variant="outline" size="sm" @click="logout"><CIcon :icon="cilAccountLogout" /> Cerrar sesión</CButton>
    </CCardHeader>
    <CCardBody>
      <div class="d-flex align-items-center gap-3 mb-4">
        <img v-if="person()?.photo" :src="fileUrl(person().photo)" alt="" class="rounded-circle border" style="width: 72px; height: 72px; object-fit: cover" @error="$event.target.style.display = 'none'" />
        <div>
          <h5 class="mb-0">{{ auth.userName }}</h5>
          <small class="text-body-secondary">@{{ auth.user?.username }}</small>
        </div>
      </div>
      <CRow>
        <CCol md="4" class="mb-3"><small class="text-body-secondary d-block">Documento</small>{{ person()?.document ?? '-' }}</CCol>
        <CCol md="4" class="mb-3"><small class="text-body-secondary d-block">Correo</small>{{ person()?.email ?? '-' }}</CCol>
        <CCol md="4" class="mb-3"><small class="text-body-secondary d-block">Teléfono</small>{{ person()?.phone ?? '-' }}</CCol>
        <CCol md="4" class="mb-3"><small class="text-body-secondary d-block">Cargo</small>{{ auth.user?.employee?.position?.name ?? '-' }}</CCol>
        <CCol md="4" class="mb-3"><small class="text-body-secondary d-block">Ingreso</small>{{ date(auth.user?.employee?.start_date) }}</CCol>
        <CCol md="4" class="mb-3">
          <small class="text-body-secondary d-block">Roles</small>
          <CBadge v-for="r in auth.user?.roles ?? []" :key="r.id" color="primary" class="me-1">{{ r.title ?? r.name }}</CBadge>
          <span v-if="!(auth.user?.roles ?? []).length">-</span>
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>

  <CCard>
    <CCardHeader><strong>Mis permisos ({{ auth.permissions.length }})</strong></CCardHeader>
    <CCardBody>
      <CBadge v-for="p in auth.permissions" :key="p" color="light" class="text-body border me-1 mb-1">{{ p }}</CBadge>
    </CCardBody>
  </CCard>
</template>
