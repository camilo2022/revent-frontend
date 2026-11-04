import http from './http'
import router from '@/router'
import { useAuthStore } from '@/stores/authStore'
import { useAlertStore } from '@/stores/alertStore'

// 401 (fuera del login) cierra la sesión local y manda a /login
export function setupInterceptors() {
  http.interceptors.response.use(
    (response) => response,
    (error) => {
      const isLogin = error.config?.url?.includes('/auth/login')
      if (error.response?.status === 401 && !isLogin) {
        useAuthStore().clear()
        useAlertStore().addAlert({ type: 'warning', message: 'Tu sesión terminó. Inicia sesión de nuevo.' })
        router.push('/login')
      }
      return Promise.reject(error)
    },
  )
}
