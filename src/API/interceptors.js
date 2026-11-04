import Swal from 'sweetalert2'
import api from './api'
import router from '@/router'

// 401 limpia la sesión y manda a /login; 500 muestra un aviso
export function setupInterceptors() {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status
      const isLogin = error.config?.url?.includes('/auth/login')

      if (status === 401 && !isLogin) {
        localStorage.removeItem('revent_token')
        localStorage.removeItem('revent_user')
        router.push('/login')
      } else if (status === 500) {
        Swal.fire({ icon: 'error', title: 'Error del servidor', text: 'Ocurrió un error inesperado. Intenta de nuevo.' })
      }
      return Promise.reject(error)
    },
  )
}
