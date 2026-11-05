<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { cilAccountLogout, cilBriefcase, cilCalendar, cilEnvelopeClosed, cilLockLocked, cilPhone, cilShieldAlt, cilUser } from '@coreui/icons'
import Avatar from '@/components/UI/templates/Avatar.vue'
import RoleService from '@/services/RoleService'
import { useAuthStore } from '@/stores/authStore'
import { date, fileUrl, listOf } from '@/utils/format'

// Perfil del usuario autenticado (viene de /auth/user): datos personales y laborales, roles y permisos agrupados
const auth = useAuthStore()
const router = useRouter()
const person = computed(() => auth.user?.employee?.person)
const employee = computed(() => auth.user?.employee)
const roles = computed(() => auth.user?.roles ?? [])

const logout = async () => {
  await auth.logout()
  router.push('/login')
}

const personal = computed(() => [
  { label: 'Documento', value: person.value?.document },
  { label: 'Género', value: person.value?.gender?.name },
  { label: 'Tipo de sangre', value: person.value?.blood_type?.name },
  { label: 'Nacimiento', value: date(person.value?.birth_date) },
  { label: 'Dirección', value: [person.value?.address, person.value?.neighborhood].filter(Boolean).join(' · ') },
])
const labor = computed(() => [
  { label: 'Cargo', value: employee.value?.position?.name },
  { label: 'Ingreso', value: date(employee.value?.start_date) },
  { label: 'Retiro', value: employee.value?.end_date ? date(employee.value.end_date) : null },
  { label: 'EPS', value: employee.value?.health_entity?.name },
  { label: 'Pensión', value: employee.value?.pension_fund?.name },
  { label: 'Caja de compensación', value: employee.value?.compensation_fund?.name },
  { label: 'ARL', value: employee.value?.risk_manager?.name },
])

// Permisos agrupados por rol (si el usuario puede listar roles); si no, por módulo de la ruta del permiso
const roleOf = ref({}) // nombre del permiso => título del rol
onMounted(async () => {
  if (!auth.can('authorization.roles.all')) return
  try {
    const map = {}
    listOf(await RoleService.all({ with_trashed: 0 }), 'roles').forEach((r) => (r.permissions ?? []).forEach((p) => (map[p.name] = r.title ?? r.name)))
    roleOf.value = map
  } catch {
    /* sin roles se agrupa por módulo */
  }
})
const humanize = (text) => text.split('.').slice(0, -1).map((s) => s.replace(/_/g, ' ')).join(' › ')
const groups = computed(() => {
  const out = {}
  ;(auth.user?.permissions ?? []).forEach((p) => {
    const key = roleOf.value[p.name] ?? humanize(p.name) ?? 'Otros'
    ;(out[key] ??= []).push(p)
  })
  return Object.entries(out).sort(([a], [b]) => a.localeCompare(b, 'es'))
})
const activeRole = ref(null)
const shownGroups = computed(() => (activeRole.value ? groups.value.filter(([name]) => name === activeRole.value) : groups.value))
</script>

<template>
  <div class="profile fade-in">
    <CRow class="g-4">
      <!-- Tarjeta de la persona -->
      <CCol lg="4">
        <CCard class="h-100">
          <CCardBody class="text-center p-4">
            <Avatar :src="fileUrl(person?.photo)" :names="person?.names" :last-names="person?.last_names" :size="120" />
            <h4 class="mt-3 mb-1">{{ auth.userName }}</h4>
            <p class="text-body-secondary mb-2">@{{ auth.user?.username }}</p>
            <CBadge v-if="employee?.position?.name" color="primary" shape="rounded-pill" class="px-3 py-2">
              <CIcon :icon="cilBriefcase" size="sm" class="me-1" />{{ employee.position.name }}
            </CBadge>
            <div class="text-start mt-4 small">
              <div class="d-flex align-items-center gap-2 mb-2"><CIcon :icon="cilEnvelopeClosed" class="text-body-secondary" />{{ person?.email ?? '-' }}</div>
              <div class="d-flex align-items-center gap-2 mb-2"><CIcon :icon="cilPhone" class="text-body-secondary" />{{ person?.phone ?? '-' }}</div>
              <div class="d-flex align-items-center gap-2"><CIcon :icon="cilCalendar" class="text-body-secondary" />Ingreso {{ date(employee?.start_date) }}</div>
            </div>
            <CButton color="secondary" variant="outline" size="sm" class="mt-4" @click="logout"><CIcon :icon="cilAccountLogout" /> Cerrar sesión</CButton>
          </CCardBody>
        </CCard>
      </CCol>

      <!-- Datos -->
      <CCol lg="8">
        <CCard class="mb-4">
          <CCardHeader><strong><CIcon :icon="cilUser" class="me-1" />Datos personales</strong></CCardHeader>
          <CCardBody class="p-4">
            <CRow class="g-3">
              <CCol v-for="f in personal" :key="f.label" sm="6" xl="4">
                <small class="text-body-secondary d-block">{{ f.label }}</small>
                <span class="fw-medium">{{ f.value || '-' }}</span>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
        <CCard>
          <CCardHeader><strong><CIcon :icon="cilBriefcase" class="me-1" />Datos laborales</strong></CCardHeader>
          <CCardBody class="p-4">
            <CRow class="g-3">
              <CCol v-for="f in labor" :key="f.label" sm="6" xl="4">
                <small class="text-body-secondary d-block">{{ f.label }}</small>
                <span class="fw-medium">{{ f.value || '-' }}</span>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>

      <!-- Seguridad y accesos -->
      <CCol xs="12">
        <CCard>
          <CCardHeader class="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <strong><CIcon :icon="cilShieldAlt" class="me-1" />Seguridad y accesos</strong>
            <CBadge color="secondary" shape="rounded-pill">{{ auth.permissions.length }} permisos · {{ roles.length }} roles</CBadge>
          </CCardHeader>
          <CCardBody class="p-4">
            <h6 class="text-body-secondary mb-3">Roles asignados</h6>
            <div class="d-flex flex-wrap gap-2 mb-4">
              <span v-for="r in roles" :key="r.id" class="badge text-bg-primary" :title="r.description">{{ r.title ?? r.name }}</span>
              <span v-if="!roles.length" class="text-body-secondary small">Sin roles directos: los permisos se asignaron al usuario.</span>
            </div>

            <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
              <h6 class="text-body-secondary mb-0 me-2"><CIcon :icon="cilLockLocked" class="me-1" />Mis permisos</h6>
              <button type="button" class="btn btn-sm" :class="activeRole === null ? 'btn-primary' : 'btn-outline-secondary'" @click="activeRole = null">Todos</button>
              <button v-for="[name, list] in groups" :key="name" type="button" class="btn btn-sm" :class="activeRole === name ? 'btn-primary' : 'btn-outline-secondary'" @click="activeRole = activeRole === name ? null : name">
                {{ name }} <span class="badge text-bg-light ms-1">{{ list.length }}</span>
              </button>
            </div>

            <CRow class="g-3">
              <CCol v-for="[name, list] in shownGroups" :key="name" md="6" xl="4">
                <div class="border rounded-3 p-3 h-100">
                  <div class="fw-semibold mb-2">{{ name }} <small class="text-body-secondary fw-normal">({{ list.length }})</small></div>
                  <ul class="list-unstyled mb-0 small">
                    <li v-for="p in list" :key="p.id" class="py-1 border-top" :title="p.description">{{ p.title ?? p.name }}</li>
                  </ul>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>
