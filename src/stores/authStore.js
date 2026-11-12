import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import AuthService from '@/services/AuthService'
import { useIntegrationStore } from '@/stores/integrationStore'
import { readToken, removeToken, saveToken } from '@/utils/cookies'

// Sesión: el token vive en una cookie y el usuario en localStorage (persistedstate)
export const useAuthStore = defineStore(
  'authStore',
  () => {
    const user = ref(null)
    const token = ref(readToken())
    const navegation = ref([])
    const loaded = ref(false) // true cuando ya se consultó /auth/user

    const permissions = computed(() => (user.value?.permissions ?? []).map((p) => p.name))
    const userName = computed(() => {
      const person = user.value?.employee?.person
      const full = person ? `${person.names ?? ''} ${person.last_names ?? ''}`.trim() : ''
      return full || user.value?.username || ''
    })

    const can = (permission) => !permission || permissions.value.includes(permission)

    const login = async (credentials) => {
      const res = await AuthService.login(credentials)
      user.value = res.data.user
      token.value = res.data.token
      saveToken(res.data.token)
      await fetchUser()
    }

    // Recarga usuario, permisos y menú desde la API
    const fetchUser = async () => {
      const res = await AuthService.user()
      user.value = res.data.user
      navegation.value = res.data.navegation ?? []
      loaded.value = true
    }

    const clear = () => {
      user.value = null
      token.value = null
      removeToken()
      navegation.value = []
      loaded.value = false
      useIntegrationStore().clearAll() // el token y la cookie de Siigo se borran con la sesión del sistema
    }

    const logout = async () => {
      try {
        await AuthService.logout()
      } catch {
        // si falla igual se cierra la sesión local
      }
      clear()
    }

    return { user, token, navegation, loaded, permissions, userName, can, login, fetchUser, logout, clear }
  },
  { persist: { pick: ['user'] } },
)
