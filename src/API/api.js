import axios from 'axios'

// Instancia única de axios para toda la aplicación
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

export default api
