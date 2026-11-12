<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { useAuthStore } from '@/stores/authStore'
import { useServerErrors } from '@/composables/useServerErrors'
import FormField from '@/components/UI/templates/FormField.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import logo from '@/assets/brand/revent-logo.png'
import logoWhite from '@/assets/brand/revent-logo-white.png'

const auth = useAuthStore()
const router = useRouter()
const { message, get, handle } = useServerErrors()

const form = reactive({ username: '', password: '' })
const saving = ref(false)
const showPassword = ref(false) // el ojito deja ver la contraseña

const submit = async () => {
  saving.value = true
  try {
    await auth.login(form)
    router.push('/')
  } catch (error) {
    handle(error, { alert: false }) // los errores se muestran en el formulario
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Marca -->
    <aside class="login-brand">
      <div class="login-brand-content">
        <img :src="logoWhite" alt="Revent" class="login-brand-logo" />
        <h2>Bienvenido a TechRevent</h2>
        <p>Producción, tiendas e integraciones con Siigo en un solo lugar.</p>
      </div>
      <small class="login-brand-footer">© {{ new Date().getFullYear() }} Revent</small>
    </aside>

    <!-- Formulario -->
    <main class="login-form-side">
      <div class="login-card fade-in">
        <img :src="logo" alt="Revent" class="login-mobile-logo" />
        <h1>Iniciar sesión</h1>
        <p class="text-body-secondary mb-4">Ingresa con tu usuario y contraseña para continuar.</p>

        <CAlert v-if="message" color="danger" class="py-2">{{ message }}</CAlert>

        <form @submit.prevent="submit">
          <FormField label="Usuario" required :error="get('username')">
            <CInputGroup>
              <CInputGroupText><CIcon :icon="cilUser" /></CInputGroupText>
              <CFormInput v-model="form.username" autocomplete="username" autofocus :invalid="!!get('username')" />
            </CInputGroup>
          </FormField>
          <FormField label="Contraseña" required :error="get('password')">
            <CInputGroup>
              <CInputGroupText><CIcon :icon="cilLockLocked" /></CInputGroupText>
              <CFormInput v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" :invalid="!!get('password')" />
              <CButton type="button" color="secondary" variant="outline" class="login-eye" :title="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'" :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'" :aria-pressed="showPassword" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              </CButton>
            </CInputGroup>
          </FormField>
          <CButton type="submit" color="primary" size="lg" class="w-100 mt-2" :disabled="saving">
            <CSpinner v-if="saving" size="sm" /> Ingresar
          </CButton>
          <RequiredNote />
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(320px, 5fr) 6fr;
  min-height: 100vh;
  background: var(--cui-body-bg);
}

/* Panel de marca */
.login-brand {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem;
  color: #fff;
  background: linear-gradient(135deg, var(--kanri-navy, #24247f) 0%, var(--kanri-blue, #1857b6) 100%);
}
.login-brand-content {
  margin: auto 0;
  max-width: 26rem;
}
.login-brand-logo {
  display: block;
  width: min(100%, 18rem);
  height: auto;
  margin-bottom: 2.5rem;
}
.login-brand h2 {
  margin-bottom: 0.75rem;
  font-size: 1.75rem;
  font-weight: 600;
}
.login-brand p {
  margin: 0;
  font-size: 1.05rem;
  opacity: 0.85;
}
.login-brand-footer {
  opacity: 0.7;
}

/* Lado del formulario */
.login-form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.25rem;
}
.login-card {
  width: 100%;
  max-width: 24rem;
}
.login-card h1 {
  margin-bottom: 0.35rem;
  font-size: 1.75rem;
  font-weight: 600;
}
.login-mobile-logo {
  display: none;
  height: 2rem;
  width: auto;
  margin-bottom: 1.75rem;
}
[data-coreui-theme='dark'] .login-mobile-logo {
  filter: invert(1);
}

/* Celular y tablet: se apilan y el logo pasa al formulario */
@media (max-width: 991.98px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .login-brand {
    display: none;
  }
  .login-mobile-logo {
    display: block;
  }
}
</style>
