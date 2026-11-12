import http from './http'
import router from '@/router'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'
import { useIntegrationStore } from '@/stores/integrationStore'
import { KINDS } from '@/config/integration'

// 401 (fuera del login) cierra la sesión local y manda a /login
export function setupInterceptors() {
  http.interceptors.response.use(
    (response) => {
      // Si algo se ejecuta bien, el backend manda `message` y se confirma con un aviso
      const message = response.data?.message?.toString().trim()
      const alerts = useAlertStore()
      if (response.config.method !== 'get' && message && !alerts.muted && !response.config.url?.match(/\/auth\/|\/reports\/generate/)) alerts.success(message)
      return response
    },
    (error) => {
      const isLogin = error.config?.url?.includes('/auth/login')
      if (error.response?.status === 401 && !isLogin) {
        useAuthStore().clear()
        useAlertStore().addAlert({ type: 'warning', message: 'Tu sesión terminó. Inicia sesión de nuevo.' })
        router.push('/login')
      }
      // Siigo rechazó el token o la cookie (422, nunca 401): se marca la credencial y se avisa sin cerrar la sesión del sistema
      const fields = error.response?.status === 422 && error.config?.url?.includes('/integration/') ? error.response.data?.errors : null
      if (fields) {
        const integration = useIntegrationStore()
        const isCheck = error.config.url.includes('/integration/credentials/check')
        Object.keys(KINDS).filter((kind) => fields[kind]).forEach((kind) => {
          integration.markInvalid(kind, fields[kind][0])
          if (!isCheck) useAlertStore().warning(`Tu ${KINDS[kind].label} de Siigo venció o no es válido: cárgalo de nuevo en Autorización Siigo.`)
        })
      }
      if (error.response?.status === 403 && !error.config?.url?.includes('/auth/')) useAlertStore().warning('No tienes permisos para realizar esta acción.')
      return Promise.reject(error)
    },
  )
}
