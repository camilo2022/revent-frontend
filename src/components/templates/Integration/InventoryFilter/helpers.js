// Lógica del filtro de inventario (sin Vue, para poder probarla): totales por color y talla, filtros y niveles de stock.

export const norm = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export const PRICE_RANGES = [
  { value: '', label: 'Todos los precios' },
  { value: '0-50000', label: '$0 a $50.000' },
  { value: '50000-100000', label: 'Más de $50.000 a $100.000' },
  { value: '100000-150000', label: 'Más de $100.000 a $150.000' },
  { value: '150000+', label: 'Más de $150.000' },
]

export const emptyFilters = () => ({ query: '', category: '', macro: '', color: '', size: '', price: '' })

// Cantidad de filtros avanzados activos (sin contar el buscador)
export const activeFilters = (f) => ['category', 'macro', 'color', 'size', 'price'].filter((key) => f[key]).length

// Un producto siempre trae sus colores como lista
export const normalizeProduct = (product) => ({ ...product, colores: Array.isArray(product.colores) ? product.colores : [] })

export const sumSizes = (color) => Object.values(color?.tallas ?? {}).reduce((sum, q) => sum + (Number(q) || 0), 0)
export const totalOf = (product) => product.colores.reduce((sum, c) => sum + sumSizes(c), 0)

// Verde con existencias, ámbar con 1 o 2 unidades, rojo agotado
export function level(quantity) {
  const n = Number(quantity) || 0
  if (n <= 0) return { color: '#dc2626', name: 'Agotado' }
  if (n <= 2) return { color: '#d97706', name: 'Pocas unidades' }
  return { color: '#16a34a', name: 'Disponible' }
}

export const formatPrice = (value) => {
  const n = Number(value)
  if (value === null || value === undefined || !Number.isFinite(n) || n <= 0) return '$-'
  return `$${Math.round(n).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
}

export function priceMatches(value, range) {
  if (!range) return true
  const n = Number(value)
  if (!Number.isFinite(n)) return false
  if (range === '0-50000') return n <= 50000
  if (range === '50000-100000') return n > 50000 && n <= 100000
  if (range === '100000-150000') return n > 100000 && n <= 150000
  if (range === '150000+') return n > 150000
  return true
}

// Un color coincide con el tono elegido y, si se eligió, con el color específico
export function colorMatches(color, f) {
  if (!f.macro) return true
  if ((color.macrocategoria || 'OTROS') !== f.macro) return false
  return !f.color || norm(color.nombre) === norm(f.color)
}

export function filterProducts(products, f) {
  const q = norm(f.query).trim()

  return products.filter((p) => {
    // Si lo escrito es exactamente la referencia, siempre se muestra
    const exact = q && norm(p.referencia) === q

    if (!exact) {
      if (f.category && p.categoria !== f.category) return false
      if (!priceMatches(p.precio, f.price)) return false
      // Debe tener al menos un color que coincida (aunque esté agotado)
      if (f.macro && !p.colores.some((c) => colorMatches(c, f))) return false
      // Debe tener al menos un color (respetando el tono) con existencias en la talla elegida
      if (f.size && !p.colores.some((c) => colorMatches(c, f) && (Number(c.tallas?.[f.size]) || 0) > 0)) return false
    }

    if (!q) return true
    return (
      norm(p.referencia).includes(q) ||
      norm(p.nombre).includes(q) ||
      norm(p.categoria).includes(q) ||
      p.colores.some((c) => norm(c.nombre).includes(q) || norm(c.macrocategoria).includes(q))
    )
  })
}

export const categoriesOf = (products) => [...new Set(products.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
export const sizesOf = (products) =>
  [...new Set(products.flatMap((p) => p.colores.flatMap((c) => Object.keys(c.tallas ?? {}))))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
export const macrosOf = (groups) => [...new Set(groups.map((g) => g.macrocategoria).filter(Boolean))]
export const colorsOfMacro = (groups, macro) => (groups.find((g) => g.macrocategoria === macro)?.colores ?? [])

// Bodegas con stock de una referencia (respuesta de «todas las bodegas»): una fila por bodega con su total
export function warehouseTotals(products) {
  return products.map((p) => ({ id: p.bodega_id, nombre: p.bodega, total: totalOf(p) }))
}
