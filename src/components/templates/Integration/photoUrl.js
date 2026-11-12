// URL de una foto de producto tal como la entrega la API (`Storage::url`): puede ser absoluta o empezar por `/storage/...`.
// Las relativas se completan con el origen de la API, que es donde se sirve el disco público.
export function photoUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const origin = new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
}
