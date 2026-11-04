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

// Convierte un bloque copiado de Excel/Sheets (filas con tabulador) en una matriz de enteros >= 0.
// Devuelve { rows: number[][], ignored: string[] }; las celdas que no son enteros >= 0 quedan en null
export function parsePastedBlock(text) {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '')
  const ignored = []
  const rows = lines.map((line, r) =>
    line.split(/\t|;/).map((raw, c) => {
      const t = raw.trim().replace(/\./g, '')
      if (t === '') return 0
      const n = Number(t)
      if (!Number.isInteger(n) || n < 0) {
        ignored.push(`fila ${r + 1}, columna ${c + 1}: "${raw.trim()}"`)
        return null
      }
      return n
    }),
  )
  return { rows, ignored }
}

// Pega el bloque a partir de (storeIndex, sizeIndex); devuelve cuántas celdas se escribieron y qué sobró
export function applyPastedBlock(line, sizes, storeIndex, sizeIndex, rows) {
  let written = 0
  let outside = 0
  rows.forEach((row, r) => {
    const storeId = line.stores[storeIndex + r]
    row.forEach((value, c) => {
      const size = sizes[sizeIndex + c]
      if (storeId == null || !size) {
        outside++
        return
      }
      if (value === null) return
      ensureStore(line, storeId)
      line.qty[storeId][size.id] = value
      written++
    })
  })
  return { written, outside }
}

// Texto con tabuladores para pegar en Excel (encabezado + una fila por tienda)
export function matrixToText(line, sizes, storeLabel) {
  const head = ['Tienda', ...sizes.map((s) => s.size?.name ?? ''), 'Total'].join('\t')
  const body = line.stores.map((st) => [storeLabel(st), ...sizes.map((s) => cell(line, st, s.id)), rowTotal(line, st, sizes)].join('\t'))
  return [head, ...body].join('\n')
}

// Copia la fila de una tienda a otra tienda/color emparejando por talla (size.id)
export function copyRow(srcLine, srcStore, srcSizes, dstLine, dstStore, dstSizes) {
  ensureStore(dstLine, dstStore)
  dstSizes.forEach((d) => {
    const match = srcSizes.find((s) => s.size.id === d.size.id)
    dstLine.qty[dstStore][d.id] = match ? cell(srcLine, srcStore, match.id) : 0
  })
}
