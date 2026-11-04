// Cookie de sesión: SameSite=Strict, dura lo mismo que el token de la API (120 min) y es Secure en https
const NAME = 'revent_token'
const MAX_AGE = 120 * 60

export const readToken = () => {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${NAME}=`))
  return match ? decodeURIComponent(match.slice(NAME.length + 1)) : null
}

export const saveToken = (value) => {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${NAME}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; SameSite=Strict${secure}`
}

export const removeToken = () => {
  document.cookie = `${NAME}=; path=/; max-age=0; SameSite=Strict`
}
