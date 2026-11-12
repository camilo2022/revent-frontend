import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { EXPIRING_MIN, KINDS } from '@/config/integration'

const JWT = /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/
const COOKIE_JWT = /TKNSGRDDREVENTCALZADOSAS=(eyJ[\w-]+\.[\w-]+\.[\w-]+)/

const blank = () => ({ value: null, savedAt: null, expiresAt: null, status: 'empty', lastError: null })

// `exp` (segundos) del payload de un JWT, o null si no se puede leer
const jwtExp = (jwt) => {
  try {
    const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const data = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')))
    return typeof data.exp === 'number' ? data.exp * 1000 : null
  } catch {
    return null
  }
}

// Token y cookie de Siigo de quien usa el sistema: se guardan en localStorage hasta que vencen o se cierra la sesión.
// Nunca se imprimen completos ni se mandan a alertas o registros.
export const useIntegrationStore = defineStore(
  'integrationStore',
  () => {
    const token = ref(blank())
    const cookie = ref(blank())
    const tick = ref(Date.now()) // se actualiza en refreshStatus para recalcular vencimientos
    const slots = { token, cookie }

    // Formato local; devuelve el mensaje de error o '' si está bien
    const formatError = (kind, raw) => {
      if (kind === 'token') return JWT.test(raw) ? '' : 'El token debe empezar por eyJ y tener tres partes separadas por punto.'
      if (!COOKIE_JWT.test(raw)) return 'La cookie debe incluir TKNSGRDDREVENTCALZADOSAS con el token.'
      if (!/\.ASPXAUTH=[^;\s]+/.test(raw)) return 'A la cookie le falta .ASPXAUTH.'
      if (!/ASP\.NET_SessionId=[^;\s]+/.test(raw)) return 'A la cookie le falta ASP.NET_SessionId.'
      return ''
    }

    const set = (kind, raw) => {
      const value = String(raw ?? '').trim().replace(/^["']|["']$/g, '')
      const error = formatError(kind, value)
      if (error) throw { message: error }
      const now = Date.now()
      const jwt = kind === 'token' ? value : COOKIE_JWT.exec(value)[1]
      const byTtl = now + KINDS[kind].ttl * 60000
      const exp = jwtExp(jwt)
      slots[kind].value = { value, savedAt: new Date(now).toISOString(), expiresAt: new Date(exp ? Math.min(exp, byTtl) : byTtl).toISOString(), status: 'ok', lastError: null }
      refreshStatus()
    }

    const clear = (kind) => {
      slots[kind].value = blank()
    }
    const clearAll = () => {
      clear('token')
      clear('cookie')
    }

    // Siigo la rechazó (422 con errors.token / errors.cookie)
    const markInvalid = (kind, message) => {
      if (!slots[kind].value.value) return
      slots[kind].value = { ...slots[kind].value, status: 'invalid', lastError: message ?? 'Siigo no aceptó la credencial.' }
    }

    // Siigo la aceptó: vuelve a vigente (si no venció)
    const markValid = (kind) => {
      if (!slots[kind].value.value) return
      slots[kind].value = { ...slots[kind].value, status: 'ok', lastError: null }
      refreshStatus()
    }

    // Recalcula vigente / vence pronto / vencida; al vencer se borra el valor, no solo el estado
    const refreshStatus = () => {
      const now = Date.now()
      tick.value = now
      Object.values(slots).forEach((slot) => {
        const s = slot.value
        if (!s.value || s.status === 'invalid') return
        const left = new Date(s.expiresAt).getTime() - now
        if (left <= 0) slot.value = { ...blank(), savedAt: s.savedAt, status: 'expired', lastError: 'Venció: vuelve a cargarla.' }
        else s.status = left <= EXPIRING_MIN * 60000 ? 'expiring' : 'ok'
      })
    }

    const has = (kind) => !!slots[kind].value.value
    const status = (kind) => (tick.value, slots[kind].value.status)
    const minutesLeft = (kind) => {
      const s = slots[kind].value
      return s.value ? Math.max(0, Math.round((new Date(s.expiresAt).getTime() - tick.value) / 60000)) : 0
    }
    const usable = (kind) => has(kind) && ['ok', 'expiring'].includes(status(kind))

    // El peor estado de las dos cargadas (para el punto del encabezado); vacío si no hay nada
    const overallStatus = computed(() => {
      const list = ['token', 'cookie'].map(status).filter((s) => s !== 'empty')
      if (!list.length) return 'empty'
      return ['invalid', 'expired', 'expiring', 'ok'].find((s) => list.includes(s))
    })

    // Qué falta para usar una pantalla: { ready, missing, expired }
    const needs = (kinds = []) => {
      const missing = kinds.filter((k) => !has(k) && status(k) !== 'expired')
      const expired = kinds.filter((k) => ['expired', 'invalid'].includes(status(k)))
      return { ready: kinds.every(usable), missing, expired }
    }

    // Credenciales listas para adjuntar al cuerpo de la petición
    const payload = (kinds = []) => Object.fromEntries(kinds.filter(usable).map((k) => [k, slots[k].value.value]))

    return { token, cookie, tick, set, clear, clearAll, markInvalid, markValid, refreshStatus, has, status, minutesLeft, usable, overallStatus, needs, payload }
  },
  { persist: { pick: ['token', 'cookie'] } },
)
