// Lógica del seguimiento de órdenes de compra (sin Vue, para poder probarla): estado, resumen y filtros.
// Equivale a lo que calculaba la pantalla de Integration.

export const WAREHOUSE_EMPTY = '-1 SIN ASIGNAR'

export const norm = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const clean = (value) => (value === null || value === undefined ? '' : String(value).replace(/\|/g, ' ').trim())

export const warehouseValue = (value) => clean(value) || WAREHOUSE_EMPTY

const isoDate = (value) => {
  const match = String(value ?? '').match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

// completa = con facturas y recibido todo; pendiente = con facturas pero falta; sin_factura = nada recibido
export function orderStatus(order) {
  const invoices = Array.isArray(order.Invoices) ? order.Invoices : []
  if (!invoices.length) return 'sin_factura'
  return (Number(order.TotalConfirmed) || 0) >= (Number(order.TotalQuantity) || 0) ? 'completa' : 'pendiente'
}

export const isAnnulled = (order) => !!order.IsAnnulled

export function agingOf(order) {
  return ['age-red', 'age-orange', 'age-green'].includes(order.AgingStatus) ? order.AgingStatus : 'age-green'
}

// Resumen de las órdenes mostradas: el pendiente es recibido - solicitado (negativo = falta)
export function summarize(orders) {
  return orders.reduce(
    (sum, o) => {
      const requested = Number(o.TotalQuantity) || 0
      const received = Number(o.TotalConfirmed) || 0
      return { orders: sum.orders + 1, requested: sum.requested + requested, received: sum.received + received, pending: sum.pending + (received - requested) }
    },
    { orders: 0, requested: 0, received: 0, pending: 0 },
  )
}

const itemView = (item) => ({
  ref: clean(item.Reference),
  model: clean(item.Model),
  color: clean(item.Color),
  size: clean(item.Size),
  warehouse: warehouseValue(item.Warehouse),
})

// Valores únicos de cada filtro por ítem, para llenar las listas
export function filterOptions(orders) {
  const sets = { ref: new Set(), model: new Set(), color: new Set(), size: new Set(), warehouse: new Set(), user: new Set() }
  orders.forEach((order) => {
    if (clean(order.User)) sets.user.add(clean(order.User))
    ;(order.Invoices ?? []).forEach((i) => clean(i.User) && sets.user.add(clean(i.User)))
    ;(order.Items ?? []).forEach((item) => {
      const view = itemView(item)
      Object.keys(view).forEach((key) => view[key] && sets[key].add(view[key]))
    })
  })
  const sorted = (set) => [...set].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
  return Object.fromEntries(Object.entries(sets).map(([key, set]) => [key, sorted(set)]))
}

export const emptyFilters = () => ({
  search: '',
  status: '',
  valid: '',
  aging: '',
  dateField: 'order',
  from: '',
  to: '',
  ref: '',
  model: '',
  color: '',
  size: '',
  warehouse: '',
  user: '',
})

// Cantidad de filtros avanzados activos (sin contar el buscador)
export const activeFilters = (f) => ['status', 'valid', 'aging', 'from', 'to', 'ref', 'model', 'color', 'size', 'warehouse', 'user'].filter((key) => f[key]).length

function searchText(order) {
  const parts = [order.DocName, order.User, order.FullName, order.CompanyName, order.Identification, order.Observations, order.Warehouse]
  ;(order.Invoices ?? []).forEach((i) => parts.push(i.DocName, i.ExternalDocumentNumber, i.User))
  ;(order.Items ?? []).forEach((i) => parts.push(i.Reference, i.Model, i.Color, i.LongDescription))
  return norm(parts.filter(Boolean).join(' '))
}

export function matchesFilters(order, f) {
  if (f.search.trim() && !searchText(order).includes(norm(f.search.trim()))) return false

  const status = orderStatus(order)
  // «faltantes» agrupa todo lo que no está completo (pendiente + sin factura)
  if (f.status && !(f.status === 'faltantes' ? status !== 'completa' : status === f.status)) return false

  if (f.valid && (isAnnulled(order) ? 'anulada' : 'valida') !== f.valid) return false
  if (f.aging && agingOf(order) !== f.aging) return false

  if (f.from || f.to) {
    const dates = f.dateField === 'invoice' ? (order.Invoices ?? []).map((i) => isoDate(i.DocDate)).filter(Boolean) : [isoDate(order.DocDate)].filter(Boolean)
    if (!dates.some((d) => (!f.from || d >= f.from) && (!f.to || d <= f.to))) return false
  }

  if (f.user) {
    const users = [clean(order.User), ...(order.Invoices ?? []).map((i) => clean(i.User))]
    if (!users.includes(f.user)) return false
  }

  if (f.ref || f.model || f.color || f.size || f.warehouse) {
    const match = (order.Items ?? []).some((item) => {
      const view = itemView(item)
      return ['ref', 'model', 'color', 'size', 'warehouse'].every((key) => !f[key] || view[key] === f[key])
    })
    if (!match) return false
  }

  return true
}

export const itemMatches = (item, f) => {
  const view = itemView(item)
  return ['ref', 'model', 'color', 'size', 'warehouse'].some((key) => f[key]) && ['ref', 'model', 'color', 'size', 'warehouse'].every((key) => !f[key] || view[key] === f[key])
}

// Clases de color de cantidades (verde completo, ámbar parcial, azul de más, gris nada)
export function receivedColor(received, requested) {
  received = Number(received) || 0
  requested = Number(requested) || 0
  if (received <= 0) return 'text-body-secondary'
  if (received < requested) return 'text-warning'
  if (received > requested) return 'text-info'
  return 'text-success'
}

export function pendingColor(pending) {
  pending = Number(pending) || 0
  if (pending > 0) return 'text-info'
  if (pending < 0) return 'text-warning'
  return 'text-success'
}

export const qty = (value) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(value) || 0)
export const pendingText = (value) => ((Number(value) || 0) > 0 ? `+${qty(value)}` : qty(value))
export const money = (value) => `$${qty(value)}`
export const dateText = (value) => {
  const iso = isoDate(value)
  return iso ? iso.split('-').reverse().join('/') : '-'
}

export const AGING = {
  'age-red': { label: 'Vencido', color: 'danger' },
  'age-orange': { label: 'Por vencer', color: 'warning' },
  'age-green': { label: 'Reciente', color: 'success' },
}
