import axios from 'axios'
import { API_URL } from './apiConfig'

// Instancia única de axios; el token se lee con un proveedor para evitar ciclos con los stores
const http = axios.create({ baseURL: API_URL, headers: { Accept: 'application/json' } })

let tokenGetter = () => null
export const setTokenGetter = (fn) => {
  tokenGetter = fn
}

http.interceptors.request.use((config) => {
  const token = tokenGetter()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default http
