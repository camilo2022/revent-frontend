<script setup>
import { useRouter } from 'vue-router'
import { cilMenu, cilMoon, cilSun, cilAccountLogout, cilUser } from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import AppBreadcrumb from './AppBreadcrumb.vue'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <CHeader position="sticky" class="mb-4 p-0">
    <CContainer class="border-bottom px-4" fluid>
      <CHeaderToggler class="ps-1" @click="ui.sidebarVisible = !ui.sidebarVisible">
        <CIcon :icon="cilMenu" size="lg" />
      </CHeaderToggler>
      <CHeaderNav class="ms-auto align-items-center gap-2">
        <CButton color="secondary" variant="ghost" :title="ui.theme === 'dark' ? 'Tema claro' : 'Tema oscuro'" @click="ui.toggleTheme()">
          <CIcon :icon="ui.theme === 'dark' ? cilSun : cilMoon" />
        </CButton>
        <RouterLink to="/profile" class="text-body-secondary d-none d-md-inline text-decoration-none"><CIcon :icon="cilUser" /> {{ auth.userName }}</RouterLink>
        <CButton color="secondary" variant="outline" size="sm" @click="logout">
          <CIcon :icon="cilAccountLogout" /> Cerrar sesión
        </CButton>
      </CHeaderNav>
    </CContainer>
    <CContainer class="px-4" fluid>
      <AppBreadcrumb />
    </CContainer>
  </CHeader>
</template>
