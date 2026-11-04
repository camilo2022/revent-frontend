<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useServerErrors } from '@/composables/useServerErrors'
import FormField from '@/components/UI/templates/FormField.vue'
import RequiredNote from '@/components/UI/templates/RequiredNote.vue'
import logo from '@/assets/brand/revent-logo.png'

const auth = useAuthStore()
const router = useRouter()
const { message, get, handle } = useServerErrors()

const form = reactive({ username: '', password: '' })
const saving = ref(false)

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
  <div class="min-vh-100 d-flex align-items-center bg-body-tertiary">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol md="6" lg="4">
          <CCard class="p-4">
            <CCardBody>
              <div class="text-center mb-4">
                <img :src="logo" alt="Revent" height="56" class="mb-2" />
                <h4 class="mb-0">TechRevent</h4>
                <small class="text-body-secondary">Inicia sesión para continuar</small>
              </div>
              <CAlert v-if="message" color="danger" class="py-2">{{ message }}</CAlert>
              <form @submit.prevent="submit">
                <FormField label="Usuario" required :error="get('username')">
                  <CFormInput v-model="form.username" autocomplete="username" :invalid="!!get('username')" />
                </FormField>
                <FormField label="Contraseña" required :error="get('password')">
                  <CFormInput v-model="form.password" type="password" autocomplete="current-password" :invalid="!!get('password')" />
                </FormField>
                <CButton type="submit" color="primary" class="w-100" :disabled="saving">
                  <CSpinner v-if="saving" size="sm" /> Ingresar
                </CButton>
                <RequiredNote />
              </form>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>
