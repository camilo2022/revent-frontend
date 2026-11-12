// Pruebas rápidas (sin backend) de la lógica de seguimiento de OC, filtro de inventario y recepción de OC:
//   node scripts/test-integration-g3.mjs
import assert from 'node:assert'
import * as tracking from '../src/components/templates/Integration/PurchaseOrderTracking/helpers.js'
import * as inventory from '../src/components/templates/Integration/InventoryFilter/helpers.js'
import * as reception from '../src/components/templates/Integration/PurchaseOrderReception/helpers.js'

// ---- Seguimiento de órdenes de compra ----
const order = (over = {}) => ({
  ACEntryID: 1, DocName: 'OC-1-100', DocDate: '2026-11-01', User: 'Luis Perez', FullName: 'PROVEEDOR UNO', TotalQuantity: 10, TotalConfirmed: 4,
  Invoices: [{ ACEntryID: 9, DocName: 'FC-1', DocDate: '2026-11-05', User: 'Ana' }], AgingStatus: 'age-green', Warehouse: '3 - ALEGRA',
  Items: [{ Reference: 'REF1', Model: 'JEAN', Color: 'NEGRO', Size: '30', Warehouse: '3 - ALEGRA', LongDescription: 'REF1-NEGRO-JEAN-30' }],
  ...over,
})

assert.strictEqual(tracking.orderStatus(order()), 'pendiente')
assert.strictEqual(tracking.orderStatus(order({ TotalConfirmed: 10 })), 'completa')
assert.strictEqual(tracking.orderStatus(order({ Invoices: [] })), 'sin_factura')

const f = (over = {}) => ({ ...tracking.emptyFilters(), ...over })
const list = [order(), order({ ACEntryID: 2, DocName: 'OC-1-101', TotalConfirmed: 10 }), order({ ACEntryID: 3, DocName: 'OC-1-102', Invoices: [], IsAnnulled: true })]
const names = (filters) => list.filter((o) => tracking.matchesFilters(o, f(filters))).map((o) => o.DocName)

assert.deepStrictEqual(names({}), ['OC-1-100', 'OC-1-101', 'OC-1-102'])
assert.deepStrictEqual(names({ status: 'completa' }), ['OC-1-101'])
assert.deepStrictEqual(names({ status: 'faltantes' }), ['OC-1-100', 'OC-1-102']) // pendiente + sin factura
assert.deepStrictEqual(names({ valid: 'anulada' }), ['OC-1-102'])
assert.deepStrictEqual(names({ search: 'proveedor uno' }), ['OC-1-100', 'OC-1-101', 'OC-1-102'])
assert.deepStrictEqual(names({ search: 'fc-1' }), ['OC-1-100', 'OC-1-101'])
assert.deepStrictEqual(names({ from: '2026-11-04', dateField: 'invoice' }), ['OC-1-100', 'OC-1-101'])
assert.deepStrictEqual(names({ from: '2026-11-02', dateField: 'order' }), [])
assert.deepStrictEqual(names({ ref: 'REF1', color: 'NEGRO' }), ['OC-1-100', 'OC-1-101', 'OC-1-102'])
assert.deepStrictEqual(names({ ref: 'OTRA' }), [])
assert.deepStrictEqual(names({ user: 'Ana' }), ['OC-1-100', 'OC-1-101'])
assert.strictEqual(tracking.activeFilters(f({ status: 'completa', from: '2026-01-01', search: 'x' })), 2)
assert.deepStrictEqual(tracking.summarize(list), { orders: 3, requested: 30, received: 18, pending: -12 })
assert.strictEqual(tracking.pendingText(5), '+5')
assert.strictEqual(tracking.dateText('2026-11-05T00:00:00'), '05/11/2026')
assert.strictEqual(tracking.warehouseValue(''), '-1 SIN ASIGNAR')
assert.deepStrictEqual(tracking.filterOptions(list).ref, ['REF1'])

// ---- Filtro de inventario ----
const product = (ref, category, price, colors) => inventory.normalizeProduct({ id: ref, referencia: ref, nombre: ref.toLowerCase(), categoria: category, precio: price, colores: colors })
const products = [
  product('REF1', 'JEAN', 80000, [{ nombre: 'Negro', macrocategoria: 'OSCUROS', tallas: { 30: 4, 32: 0 } }, { nombre: 'Azul', macrocategoria: 'CLAROS', tallas: { 30: 0, 32: 1 } }]),
  product('REF2', 'CAMISA', 160000, [{ nombre: 'Blanco', macrocategoria: 'CLAROS', tallas: { M: 3 } }]),
]
const ids = (filters) => inventory.filterProducts(products, { ...inventory.emptyFilters(), ...filters }).map((p) => p.referencia)

assert.deepStrictEqual(ids({}), ['REF1', 'REF2'])
assert.deepStrictEqual(ids({ category: 'JEAN' }), ['REF1'])
assert.deepStrictEqual(ids({ price: '150000+' }), ['REF2'])
assert.deepStrictEqual(ids({ price: '50000-100000' }), ['REF1'])
assert.deepStrictEqual(ids({ macro: 'CLAROS' }), ['REF1', 'REF2'])
assert.deepStrictEqual(ids({ macro: 'CLAROS', color: 'azul' }), ['REF1'])
assert.deepStrictEqual(ids({ size: '32' }), ['REF1']) // solo con stock en esa talla
assert.deepStrictEqual(ids({ macro: 'OSCUROS', size: '32' }), []) // el negro no tiene talla 32
assert.deepStrictEqual(ids({ query: 'blanco' }), ['REF2'])
assert.deepStrictEqual(ids({ query: 'ref1', category: 'CAMISA' }), ['REF1']) // referencia exacta ignora los demás filtros
assert.strictEqual(inventory.totalOf(products[0]), 5)
assert.strictEqual(inventory.level(0).color, '#dc2626')
assert.strictEqual(inventory.level(2).color, '#d97706')
assert.strictEqual(inventory.level(3).color, '#16a34a')
assert.strictEqual(inventory.formatPrice(80000), '$80.000')
assert.strictEqual(inventory.formatPrice(0), '$-')
assert.deepStrictEqual(inventory.categoriesOf(products), ['CAMISA', 'JEAN'])
assert.deepStrictEqual(inventory.sizesOf(products), ['30', '32', 'M'])
assert.strictEqual(inventory.activeFilters({ ...inventory.emptyFilters(), category: 'JEAN', size: '30', query: 'x' }), 2)
assert.deepStrictEqual(inventory.warehouseTotals([{ bodega_id: 3, bodega: 'ALEGRA', colores: [{ tallas: { 30: 2 } }] }]), [{ id: 3, nombre: 'ALEGRA', total: 2 }])

// ---- Recepción de órdenes de compra ----
const detail = {
  Entry: { ACEntryID: 123, DocName: 'OC-1-100', DocDate: '2026-11-01', Observations: 'Urgente' },
  Items: [
    { ProductCode: 'P-1', LongDescription: 'REF1-NEGRO-JEAN-30', Reference: 'REF1', WarehouseCode: 3, Warehouse: '3 - ALEGRA', Quantity: 5, Accessible: true },
    { ProductCode: 'P-2', LongDescription: 'REF1-NEGRO-JEAN-32', Reference: 'REF1', WarehouseCode: 9, Warehouse: '9 - MAYALES', Quantity: 2, Accessible: false },
  ],
}
const items = reception.toReceivingItems(detail)
assert.deepStrictEqual(items.map((i) => i.ReceivingQuantity), [0, 0])
items[0].ReceivingQuantity = 4
assert.deepStrictEqual(reception.totals(items), { requested: 5, receiving: 4, pending: -1 }) // solo cuenta lo que se puede recibir
assert.strictEqual(reception.pending(items[0]), -1)
assert.strictEqual(reception.orderValue(detail, 'DocName'), 'OC-1-100')

const checklist = reception.emptyChecklist()
checklist.sellos = true
checklist.observaciones = 'Todo bien'
Object.assign(checklist.responsable, { nombre: 'Ana', cargo: 'Auxiliar', departamento: 'Bodega' })
const body = reception.buildReceiving(detail, items, checklist)
assert.strictEqual(body.Order.DocName, 'OC-1-100')
assert.strictEqual(body.Order.Warehouse, '3 - ALEGRA')
assert.strictEqual(body.Items.length, 1) // el ítem de la bodega sin acceso no viaja
assert.deepStrictEqual(body.Items[0], {
  ProductCode: 'P-1', Description: 'REF1-NEGRO-JEAN-30', LongDescription: 'REF1-NEGRO-JEAN-30', Reference: 'REF1', Color: null, Category: null, Size: null,
  WarehouseCode: 3, Warehouse: '3 - ALEGRA', Quantity: 5, ReceivingQuantity: 4, PendingQuantity: -1,
})
assert.deepStrictEqual(body.Totals, { Requested: 5, Receiving: 4, Pending: -1 })
assert.strictEqual(body.Checklist.sellos, true)
assert.strictEqual(body.Checklist.responsable.nombre, 'Ana')
assert.strictEqual(Object.keys(body.Checklist).filter((k) => typeof body.Checklist[k] === 'boolean').length, 14) // los 14 puntos de la lista

console.log('OK: seguimiento, inventario y recepción')
