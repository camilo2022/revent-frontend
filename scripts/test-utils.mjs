// Prueba rápida de la curva de tallas (sin backend): npm run test:utils
import assert from 'node:assert'
import { distributeCurve, parseProportions } from '../src/utils/orderMatrix.js'

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
console.log('OK')
