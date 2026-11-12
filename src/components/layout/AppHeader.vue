<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cilBell, cilContrast, cilMenu, cilMoon, cilSun, cilAccountLogout, cilLockLocked, cilUser } from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'
import { useIntegrationStore } from '@/stores/integrationStore'
import { useUiStore } from '@/stores/uiStore'
import AppBreadcrumb from './AppBreadcrumb.vue'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const integration = useIntegrationStore()

// "Autorización Siigo" solo para quienes tienen algún permiso de Integraciones
const showSiigo = computed(() => auth.permissions.some((p) => p.startsWith('integration.')))
const avatarStatus = computed(() => ({ ok: 'success', expiring: 'warning', expired: 'danger', invalid: 'danger' })[integration.overallStatus])

// El vencimiento se revisa cada minuto, al volver a la pestaña y cuando otra pestaña cambia las credenciales
let timer = null
const refresh = () => integration.refreshStatus()
const onStorage = (event) => event.key === 'integrationStore' && integration.$hydrate()
onMounted(() => {
  refresh()
  timer = setInterval(refresh, 60000)
  document.addEventListener('visibilitychange', refresh)
  window.addEventListener('storage', onStorage)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', refresh)
  window.removeEventListener('storage', onStorage)
})

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <CHeader position="sticky" class="mb-4 p-0">
    <CContainer class="border-bottom px-2 px-sm-3 px-lg-4 flex-nowrap" fluid>
      <CHeaderToggler class="ps-1" @click="ui.sidebarVisible = !ui.sidebarVisible">
        <CIcon :icon="cilMenu" size="lg" />
      </CHeaderToggler>
      <CHeaderNav class="ms-auto">
        <CNavItem><CNavLink href="#" @click.prevent><CIcon :icon="cilBell" size="lg" /></CNavLink></CNavItem>
      </CHeaderNav>
      <CHeaderNav>
        <li class="nav-item py-1"><div class="vr h-100 mx-1 mx-sm-2 text-body text-opacity-75"></div></li>
        <CDropdown variant="nav-item" placement="bottom-end">
          <CDropdownToggle :caret="false">
            <CIcon :icon="ui.theme === 'dark' ? cilMoon : cilSun" size="lg" />
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem as="button" type="button" :active="ui.theme === 'light'" class="d-flex align-items-center" @click="ui.setTheme('light')">
              <CIcon class="me-2" :icon="cilSun" size="lg" /> Claro
            </CDropdownItem>
            <CDropdownItem as="button" type="button" :active="ui.theme === 'dark'" class="d-flex align-items-center" @click="ui.setTheme('dark')">
              <CIcon class="me-2" :icon="cilMoon" size="lg" /> Oscuro
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
        <li class="nav-item py-1"><div class="vr h-100 mx-1 mx-sm-2 text-body text-opacity-75"></div></li>
        <CDropdown variant="nav-item" placement="bottom-end">
          <CDropdownToggle :caret="false" class="py-0 pe-0">
            <CAvatar color="primary" text-color="white" size="md" :status="showSiigo ? avatarStatus : undefined">{{ (auth.userName || '?').charAt(0).toUpperCase() }}</CAvatar>
          </CDropdownToggle>
          <CDropdownMenu class="pt-0">
            <CDropdownHeader class="bg-body-secondary fw-semibold my-2">{{ auth.userName }}</CDropdownHeader>
            <CDropdownItem @click="router.push('/profile')"><CIcon class="me-2" :icon="cilUser" /> Mi perfil</CDropdownItem>
            <CDropdownItem v-if="showSiigo" class="d-flex align-items-center" @click="router.push('/siigo_authorization')">
              <CIcon class="me-2" :icon="cilLockLocked" /> Autorización Siigo
            </CDropdownItem>
            <CDropdownItem @click="logout"><CIcon class="me-2" :icon="cilAccountLogout" /> Cerrar sesión</CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
      </CHeaderNav>
    </CContainer>
    <CContainer class="px-2 px-sm-3 px-lg-4" fluid>
      <AppBreadcrumb />
    </CContainer>
  </CHeader>
</template>
