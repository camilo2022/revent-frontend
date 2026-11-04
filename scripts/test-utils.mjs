// Prueba rápida de la curva de tallas (sin backend): npm run test:utils
import assert from 'node:assert'
import { distributeCurve, parseProportions, parsePastedBlock, applyPastedBlock, matrixToText } from '../src/utils/orderMatrix.js'

const casos = [
  [[1, 2, 3, 3, 2, 1], 24],
  [[1, 2, 3, 3, 2, 1], 25],
  [[1, 2, 3, 3, 2, 1], 7],
  [[1, 1, 1], 10],
  [[0, 0, 0], 10],
]
for (const [prop, total] of casos) {
  const r = distributeCurve(prop, total)
  const suma = r.reduce((a, b) => a + b, 0)
  const esperado = prop.reduce((a, b) => a + b, 0) > 0 ? total : 0
  assert.strictEqual(suma, esperado, `suma incorrecta para ${prop} / ${total}: ${r}`)
  console.log(prop.join(','), '->', total, '=>', r.join(','))
}
assert.deepStrictEqual(parseProportions('1, 2,3'), [1, 2, 3])
assert.strictEqual(parseProportions('1,a'), null)

// Pegado desde Excel: tabuladores, celdas vacías = 0, inválidas se ignoran y se reportan
const pegado = parsePastedBlock('1\t2\t\r\n3\tx\t-1\n')
assert.deepStrictEqual(pegado.rows, [[1, 2, 0], [3, null, null]])
assert.strictEqual(pegado.ignored.length, 2)
const sizes = [{ id: 10, size: { name: '35' } }, { id: 11, size: { name: '36' } }]
const line = { stores: [1, 2], qty: { 1: {}, 2: {} } }
const res = applyPastedBlock(line, sizes, 0, 0, pegado.rows)
assert.deepStrictEqual(line.qty, { 1: { 10: 1, 11: 2 }, 2: { 10: 3 } })
assert.strictEqual(res.written, 3)
assert.strictEqual(res.outside, 2) // tercera columna no existe
assert.strictEqual(matrixToText(line, sizes, (id) => `T${id}`), 'Tienda\t35\t36\tTotal\nT1\t1\t2\t3\nT2\t3\t0\t3')
console.log('OK')
