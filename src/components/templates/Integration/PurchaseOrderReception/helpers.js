// Lógica de la recepción de órdenes de compra (sin Vue, para poder probarla): ítems a recibir, totales y datos a enviar.

// Lista de verificación: cada punto se marca con sí/no y viaja como booleano
export const CHECKLIST = [
  {
    title: '1. Frente al transportador',
    items: [
      { key: 'cajas_master', label: 'Cajas Master', text: 'Contar bultos vs. guía de envío.' },
      { key: 'sellos', label: 'Sellos', text: 'Verificar que la cinta de seguridad NO esté rota o despegada.' },
      { key: 'estado_cajas', label: 'Estado', text: 'Cajas sin huecos, humedad o signos de maltrato.' },
      { key: 'documentos', label: 'Documentos', text: '¿Trae factura y orden de compra (OC) original?' },
    ],
  },
  {
    title: '2. Calidad y detalle (al abrir)',
    items: [
      { key: 'empaque', label: 'Empaque', text: 'Cajas blancas individuales, nuevas y limpias.' },
      { key: 'stickers', label: 'Stickers', text: 'Cada par con precio y etiqueta DIAN.' },
      { key: 'producto', label: 'Producto', text: 'Revisar costuras, pegado y que no tenga rayones.' },
      { key: 'exactitud', label: 'Exactitud', text: '¿Color, talla y cantidad coinciden con la OC?' },
      { key: 'variacion_diseno', label: 'Variación y diseño', text: '¿El producto coincide con el modelo original (imagen web o el de existencias en tienda, si aplica)?' },
    ],
  },
  {
    title: '3. Cierre administrativo',
    items: [
      { key: 'firma', label: 'Firma', text: 'Firmar y fechar la OC si todo está correcto.' },
      { key: 'reporte_whatsapp', label: 'Reporte WhatsApp', text: 'Enviar foto de la OC antes de las 5:30 PM.' },
      { key: 'respaldo_whatsapp', label: 'Respaldo WhatsApp', text: 'Respaldar los productos que reciban, al grupo «REVENT Grupo Comercial».' },
      { key: 'alerta', label: 'Alerta', text: 'Si hay fallas, informar a Operaciones ANTES de recibir.' },
      { key: 'venta', label: 'Venta', text: 'NO vender hasta que confirmen la carga en Siigo.' },
    ],
  },
]

export const emptyChecklist = () => ({
  ...Object.fromEntries(CHECKLIST.flatMap((s) => s.items.map((i) => [i.key, false]))),
  referencias_recibidas: '',
  observaciones: '',
  responsable: { nombre: '', cargo: '', departamento: '', celular: '' },
})

const num = (value) => Number(value) || 0

// Ítems de la orden listos para recibir. `Accessible` viene de la API: false = bodega de una tienda que no tienes asignada.
export const toReceivingItems = (order) =>
  (order?.Items ?? []).map((item) => ({ ...item, ReceivingQuantity: 0, Accessible: item.Accessible !== false }))

export const pending = (item) => num(item.ReceivingQuantity) - num(item.Quantity)

// Solo se reciben los ítems de las bodegas a las que tienes acceso
export const receivable = (items) => items.filter((item) => item.Accessible)

export function totals(items) {
  const list = receivable(items)
  const requested = list.reduce((sum, i) => sum + num(i.Quantity), 0)
  const receiving = list.reduce((sum, i) => sum + num(i.ReceivingQuantity), 0)
  return { requested, receiving, pending: receiving - requested }
}

export const orderValue = (order, key) => order?.[key] ?? order?.Entry?.[key] ?? null

export const orderWarehouse = (items) => [...new Set(items.map((i) => i.Warehouse).filter(Boolean))].join(', ')

// Los datos de la recepción con la forma que valida la API (Order, Items, Totals y Checklist)
export function buildReceiving(order, items, checklist) {
  const list = receivable(items)
  const t = totals(items)

  return {
    Order: {
      ACEntryID: orderValue(order, 'ACEntryID'),
      DocName: orderValue(order, 'DocName') ?? '-',
      DocDate: orderValue(order, 'DocDate'),
      DeadlineDate: orderValue(order, 'DeadlineDate'),
      Identification: orderValue(order, 'Identification'),
      FullName: orderValue(order, 'FullName'),
      CompanyName: orderValue(order, 'CompanyName'),
      Warehouse: orderWarehouse(list),
      Observations: orderValue(order, 'Observations') ?? '',
    },
    Items: list.map((item) => ({
      ProductCode: item.ProductCode ?? null,
      Description: item.LongDescription || item.Description || null,
      LongDescription: item.LongDescription ?? null,
      Reference: item.Reference ?? null,
      Color: item.Color ?? null,
      Category: item.Category ?? null,
      Size: item.Size ?? null,
      WarehouseCode: item.WarehouseCode ?? null,
      Warehouse: item.Warehouse ?? null,
      Quantity: num(item.Quantity),
      ReceivingQuantity: num(item.ReceivingQuantity),
      PendingQuantity: pending(item),
    })),
    Totals: { Requested: t.requested, Receiving: t.receiving, Pending: t.pending },
    Checklist: {
      ...checklist,
      responsable: { ...checklist.responsable },
    },
  }
}

export const qty = (value) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(num(value))
export const pendingText = (value) => (num(value) > 0 ? `+${qty(value)}` : qty(value))
