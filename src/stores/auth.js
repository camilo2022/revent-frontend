import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: read('revent_user', null),
    token: localStorage.getItem('revent_token'),
    navegation: [],
    loaded: false, // true cuando ya se consultó /auth/user
  }),
  getters: {
    // Nombres de permisos del usuario
    permissions: (state) => (state.user?.permissions ?? []).map((p) => p.name),
    userName: (state) => {
      const person = state.user?.employee?.person
      return person ? `${person.name ?? ''} ${person.surname ?? ''}`.trim() || state.user.username : state.user?.username ?? ''
    },
  },
  actions: {
    can(permission) {
      return !permission || this.permissions.includes(permission)
    },
    setSession(user, token) {
      this.user = user
      if (token) {
        this.token = token
        localStorage.setItem('revent_token', token)
      }
      localStorage.setItem('revent_user', JSON.stringify(user))
    },
    async login(credentials) {
      const res = await authService.login(credentials)
      this.setSession(res.data.user, res.data.token)
      await this.fetchUser()
    },
    // Recarga usuario, permisos y menú desde la API
    async fetchUser() {
      const res = await authService.user()
      this.setSession(res.data.user)
      this.navegation = res.data.navegation ?? []
      this.loaded = true
    },
    async logout() {
      try {
        await authService.logout()
      } catch {
        // si falla igual se cierra la sesión local
      }
      this.clear()
    },
    clear() {
      this.user = null
      this.token = null
      this.navegation = []
      this.loaded = false
      localStorage.removeItem('revent_token')
      localStorage.removeItem('revent_user')
    },
  },
})
