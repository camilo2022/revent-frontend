// Lee un valor anidado: getPath({a:{b:1}}, 'a.b') => 1
export function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

// Escribe un valor anidado creando los objetos intermedios
export function setPath(obj, path, value) {
  const keys = path.split('.')
  let cur = obj
  keys.slice(0, -1).forEach((key) => {
    if (typeof cur[key] !== 'object' || cur[key] === null) cur[key] = {}
    cur = cur[key]
  })
  cur[keys[keys.length - 1]] = value
}
