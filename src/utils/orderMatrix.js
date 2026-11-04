// Funciones puras de la matriz tienda x talla de la orden de producción

// Reparte `total` pares según las proporciones; el redondeo (mayor resto) suma exacto
export function distributeCurve(proportions, total) {
  const sum = proportions.reduce((a, b) => a + b, 0)
  if (sum <= 0 || total <= 0) return proportions.map(() => 0)

  const exact = proportions.map((p) => (p / sum) * total)
  const result = exact.map((x) => Math.floor(x))
  let left = total - result.reduce((a, b) => a + b, 0)

  // Los mayores decimales reciben los pares que faltan
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || proportions[b.i] - proportions[a.i] || a.i - b.i)
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) result[order[k].i]++
  return result
}

// Convierte "1,2,3" en [1,2,3]; devuelve null si algo no es un número válido
export function parseProportions(text) {
  const parts = String(text).split(/[,\s;]+/).filter(Boolean)
  const nums = parts.map(Number)
  if (!nums.length || nums.some((n) => Number.isNaN(n) || n < 0)) return null
  return nums
}

// Línea vacía de un color de la orden
export function newLine(color, product) {
  return {
    enabled: false,
    product_detail_id: color.id,
    cost: product?.cost ?? 0,
    price: product?.price ?? 0,
    observation: '',
    stores: [], // ids de tiendas (filas de la matriz)
    qty: {}, // qty[storeId][sizeDetailId] = pares
  }
}

export function ensureStore(line, storeId) {
  if (!line.stores.includes(storeId)) line.stores.push(storeId)
  if (!line.qty[storeId]) line.qty[storeId] = {}
}

export function removeStore(line, storeId) {
  line.stores = line.stores.filter((s) => s !== storeId)
  delete line.qty[storeId]
}

export function cell(line, storeId, sizeId) {
  return Number(line.qty[storeId]?.[sizeId]) || 0
}

export function rowTotal(line, storeId, sizes) {
  return sizes.reduce((acc, s) => acc + cell(line, storeId, s.id), 0)
}

export function colTotal(line, sizeId) {
  return line.stores.reduce((acc, st) => acc + cell(line, st, sizeId), 0)
}

export function lineTotal(line, sizes) {
  return line.stores.reduce((acc, st) => acc + rowTotal(line, st, sizes), 0)
}

// Copia la fila de una tienda a otra tienda/color emparejando por talla (size.id)
export function copyRow(srcLine, srcStore, srcSizes, dstLine, dstStore, dstSizes) {
  ensureStore(dstLine, dstStore)
  dstSizes.forEach((d) => {
    const match = srcSizes.find((s) => s.size.id === d.size.id)
    dstLine.qty[dstStore][d.id] = match ? cell(srcLine, srcStore, match.id) : 0
  })
}
