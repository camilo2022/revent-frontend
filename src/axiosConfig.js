// Cabecera con el token de la sesión y parámetros opcionales
export function getConfig(params = {}) {
  const token = localStorage.getItem('revent_token')
  return {
    headers: { Authorization: `Bearer ${token}` },
    params,
  }
}
