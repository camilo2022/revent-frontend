// Prueba de humo contra la API real usando los servicios y modelos del frontend.
// Uso:  API_URL=http://127.0.0.1:8099/api API_USER=revent API_PASSWORD=*** node scripts/smoke-api.mjs
// La contraseña solo se lee del entorno; nunca se guarda en el repositorio.
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8099/api'
const USER = process.env.API_USER ?? 'revent'
const PASSWORD = process.env.API_PASSWORD
if (!PASSWORD) {
  console.error('Falta API_PASSWORD en el entorno.')
  process.exit(2)
}

// Vite resuelve los alias @/ y el .vue de las configuraciones sin necesidad de navegador
const root = fileURLToPath(new URL('..', import.meta.url))
const server = await createServer({
  root, logLevel: 'error', appType: 'custom', server: { middlewareMode: true },
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify(API_URL) },
})
const load = (path) => server.ssrLoadModule(path).then((m) => m.default ?? m)
const { setTokenGetter } = await server.ssrLoadModule('/src/config/http.js')
const [Auth, ColorS, SizeS, CollectionS, ProductS, SheetS, OrderS, SupplierS, StoreS, TrademarkS, CategoryS, SubcategoryS, FileTypeS, CityS, CountryS, DocTypeS] = await Promise.all([
  'AuthService', 'ColorService', 'SizeService', 'CollectionService', 'ProductService', 'TechnicalSheetService', 'ProductionOrderService',
  'SupplierService', 'StoreService', 'TrademarkService', 'CategoryService', 'SubcategoryService', 'FileTypeService', 'CityService', 'CountryService', 'DocumentTypeService',
].map((n) => load(`/src/services/${n}.js`)))
const Color = await load('/src/models/Color.js')
const Size = await load('/src/models/Size.js')
const Collection = await load('/src/models/Collection.js')
const Product = await load('/src/models/Product.js')

const rnd = (n) => Array.from({ length: n }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('')
const results = []
const ctx = {}

// Ejecuta un paso; si falla lo anota con el mensaje exacto de la API y sigue con el resto
async function step(name, fn) {
  try {
    const out = await fn()
    results.push({ name, ok: true })
    console.log(`  OK   ${name}`)
    return out
  } catch (e) {
    const detail = e?.errors ? JSON.stringify(e.errors) : [e?.error?.message, e?.error?.error].filter(Boolean).join(' | ') || e?.message || String(e)
    results.push({ name, ok: false, detail })
    console.log(`  FALLO ${name}: ${detail}`)
    return undefined
  }
}
const need = (v, what) => {
  if (v === undefined || v === null) throw new Error(`omitido: falta ${what}`)
  return v
}
const first = (res) => Object.values(res.data)[0]
const png = () => new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))], 'icon.png', { type: 'image/png' })

console.log(`API: ${API_URL}`)

await step('auth: login', async () => {
  const res = await Auth.login({ username: USER, password: PASSWORD })
  ctx.token = res.data.token
  setTokenGetter(() => ctx.token)
})
await step('auth: usuario y navegación', async () => {
  const res = await Auth.user()
  need(res.data.user, 'user')
  console.log(`       permisos: ${res.data.user.permissions?.length ?? 0}, módulos del menú: ${res.data.navegation?.length ?? 0}`)
})

// ---- Colores y tallas: crear / editar / eliminar / restaurar ----
const crudCycle = async (label, service, make, edit) => {
  const created = await step(`${label}: crear`, async () => first(await make()))
  await step(`${label}: editar`, async () => service.update(need(created, label).id, edit(created)))
  await step(`${label}: eliminar`, async () => service.delete(need(created, label).id))
  await step(`${label}: restaurar`, async () => service.restore(need(created, label).id))
  return created
}
const color1 = await crudCycle('color', ColorS, () => ColorS.store(new Color({ name: `SMK${rnd(5)}`, description: 'PRUEBA', settings: { code: rnd(2) } })), (c) => ({ name: `SMK${rnd(5)}`, description: 'EDITADO', settings: { code: rnd(2) } }))
const size1 = await crudCycle('talla', SizeS, () => SizeS.storeForm({ ...new Size({ name: `SMK${rnd(5)}`, description: 'PRUEBA', settings: { code: rnd(2) } }), icon: { file: png() } }), (s) => ({ name: `SMK${rnd(5)}`, description: 'EDITADA', settings: { code: rnd(2) } }))

// Segundo color y más tallas para el producto
const color2 = await step('color 2: crear', async () => first(await ColorS.store(new Color({ name: `SMK${rnd(5)}`, description: 'PRUEBA', settings: { code: rnd(2) } }))))
const extraSizes = []
for (let i = 0; i < 2; i++) {
  extraSizes.push(await step(`talla extra ${i + 1}: crear`, async () => first(await SizeS.storeForm({ ...new Size({ name: `SMK${rnd(5)}`, description: 'PRUEBA', settings: { code: rnd(2) } }), icon: { file: png() } }))))
}
const sizes = [size1, ...extraSizes].filter(Boolean)

// ---- Colección y producto ----
const collection = await step('colección: crear', async () => {
  for (let i = 0; i < 20; i++) {
    try {
      return first(await CollectionS.store(new Collection({ name: `SMK${rnd(4)}`, description: 'PRUEBA', year: String(Math.floor(Math.random() * 90) + 10), code: String(Math.floor(Math.random() * 10)) })))
    } catch (e) {
      if (!e?.errors?.code) throw e
    }
  }
  throw new Error('no se halló año/código libre')
})
const product = await step('producto: crear con 2 colores y tallas repetidas', async () => {
  const sizesId = sizes.map((s) => ({ size_id: s.id, description: null }))
  const body = { ...new Product({ collection_id: need(collection, 'colección').id, name: `SMK${rnd(5)}`, description: 'PRUEBA', price: 189900, cost: 85000 }),
    colors_id: [color1, color2].map((c) => ({ color_id: need(c, 'color').id, description: null, sizes_id: sizesId })) }
  const p = first(await ProductS.store(body))
  console.log(`       código generado: ${p.code}`)
  return p
})
await step('producto: leer con colores y tallas', async () => {
  const p = first(await ProductS.find(need(product, 'producto').id))
  ctx.colors = p.colors
  if (p.colors.length !== 2 || p.colors.some((c) => c.sizes.length !== sizes.length)) throw new Error('el producto no trae 2 colores con todas las tallas')
})

// ---- Ficha técnica: crear -> aprobar -> editar aprobada -> cancelar -> reactivar ----
const pick = async (service, key) => (await service.all({ with_trashed: 0 })).data[key]?.[0]
const trademark = await step('marca: obtener o crear', async () => {
  const existing = await pick(TrademarkS, 'trademarks')
  if (existing) return existing
  const ft = (await pick(FileTypeS, 'file_types')) ?? first(await FileTypeS.store({ name: `SMK${rnd(5)}`, description: 'ICONO' }))
  return first(await TrademarkS.storeForm({ name: `SMK${rnd(5)}`, description: 'PRUEBA', settings: { code: rnd(2) }, icon: png(), file_type_id: ft.id }))
})
const category = await step('categoría: obtener o crear', async () => (await pick(CategoryS, 'categories')) ?? first(await CategoryS.store({ name: `SMK${rnd(5)}`, description: 'PRUEBA', settings: { code: rnd(2) } })))
const subcategory = await step('subcategoría: obtener o crear', async () => (await pick(SubcategoryS, 'subcategories')) ?? first(await SubcategoryS.store({ name: `SMK${rnd(5)}`, description: 'PRUEBA', settings: { code: rnd(2) } })))
const sheet = await step('ficha: crear', async () => first(await SheetS.store({
  product_id: need(product, 'producto').id, trademark_id: need(trademark, 'marca').id, category_id: need(category, 'categoría').id,
  subcategory_id: need(subcategory, 'subcategoría').id, process: 'CORTE', description: 'PRUEBA', observation: '', specifications: { horma: 'ancha' },
})))
const sheetId = () => need(sheet, 'ficha').id
await step('ficha: la ficha no trae versión', async () => {
  if ('version' in need(sheet, 'ficha')) throw new Error('la ficha aún trae "version"')
})
await step('ficha: segundo store del mismo producto falla con 422', async () => {
  try {
    await SheetS.store({ product_id: product.id, trademark_id: trademark.id, category_id: category.id, subcategory_id: subcategory.id })
  } catch (e) {
    if (e?.errors) return
    throw e
  }
  throw new Error('la API aceptó una segunda ficha')
})
await step('ficha: enviar a revisión', async () => SheetS.reviewed(sheetId()))
await step('ficha: aprobar', async () => SheetS.approved(sheetId()))
await step('ficha: editar estando aprobada', async () => SheetS.update(sheetId(), { trademark_id: trademark.id, category_id: category.id, subcategory_id: subcategory.id, process: 'CORTE Y COSTURA', description: 'EDITADA', observation: '', specifications: { horma: 'angosta' } }))
await step('ficha: cancelar', async () => SheetS.canceled(sheetId()))
await step('ficha: editar cancelada debe fallar (422)', async () => {
  try {
    await SheetS.update(sheetId(), { trademark_id: trademark.id, category_id: category.id, subcategory_id: subcategory.id })
  } catch (e) {
    return
  }
  throw new Error('la API dejó editar una ficha cancelada')
})
await step('ficha: reactivar (enviar a revisión desde Cancelado)', async () => SheetS.reviewed(sheetId()))
await step('ficha: aprobar de nuevo', async () => SheetS.approved(sheetId()))
await step('ficha: aparece en only_approved', async () => {
  const list = (await SheetS.all({ only_approved: 1 })).data.technical_sheets
  if (!list.some((s) => s.id === sheetId())) throw new Error('no aparece')
})

// ---- Proveedor y tiendas ----
const supplier = await step('proveedor: obtener o crear', async () => {
  const existing = await pick(SupplierS, 'suppliers')
  if (existing) return existing
  const ft = (await pick(FileTypeS, 'file_types')) ?? first(await FileTypeS.store({ name: `SMK${rnd(5)}`, description: 'FOTO' }))
  const dt = need(await pick(DocTypeS, 'document_types'), 'tipo de documento')
  const country = need((await CountryS.all({ per_page: 1 })).data?.[0], 'país')
  const city = need((await CityS.all({ per_page: 1 })).data?.[0], 'ciudad')
  return first(await SupplierS.storeForm({
    code: rnd(2), legal_name: `SMK ${rnd(6)}`, trade_name: `SMK ${rnd(6)}`, document_type_id: dt.id, document: String(Date.now()).slice(-9),
    location_type: 'App\\Models\\City', location_id: city.id, address: 'CALLE 1', neighborhood: 'CENTRO', phone_country_id: country.id,
    phone: '3001234567', email: `smk${Date.now()}@example.com`, file: png(), file_type_id: ft.id,
  }))
})
const stores = await step('tiendas: obtener 3 (o crearlas)', async () => {
  const list = (await StoreS.all({ with_trashed: 0 })).data.stores ?? []
  const city = (await CityS.all({ per_page: 1 })).data?.[0]
  while (list.length < 3) {
    list.push(first(await StoreS.store({ code: rnd(2), name: `SMK ${rnd(6)}`, location_type: 'App\\Models\\City', location_id: need(city, 'ciudad').id, address: 'CALLE 2', neighborhood: 'NORTE' })))
  }
  return list.slice(0, 3)
})

// ---- Orden: crear con 2 colores y 3 tiendas -> aprobar -> cancelar ----
const order = await step('orden: crear con 2 colores y 3 tiendas', async () => {
  const colors = need(ctx.colors, 'colores del producto')
  const due = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  const body = {
    technical_sheet_id: sheetId(), supplier_id: need(supplier, 'proveedor').id, due_date: due, vat_percentage: 100, delivery_note_percentage: 0,
    production_order_details: colors.map((c) => ({
      product_detail_id: c.id, cost: 85000, price: 189900, observation: null,
      production_order_detail_quantities: need(stores, 'tiendas').flatMap((st) => c.sizes.map((s, i) => ({ store_id: st.id, product_detail_id: s.id, quantity: i + 1 }))),
    })),
  }
  const o = first(await OrderS.store(body))
  console.log(`       consecutivo: ${o.consecutive}, pares: ${o.totals?.pairs}, colores: ${o.totals?.colors}, tiendas: ${o.totals?.stores}`)
  return o
})
await step('orden: editar en Pendiente', async () => {
  const o = first(await OrderS.find(need(order, 'orden').id))
  const body = {
    technical_sheet_id: sheetId(), supplier_id: o.supplier.id, due_date: o.due_date, vat_percentage: 100, delivery_note_percentage: 10,
    production_order_details: o.details.map((d) => ({
      product_detail_id: d.product_detail_id, cost: d.cost, price: d.price, observation: 'EDITADA',
      production_order_detail_quantities: d.stores.flatMap((st) => st.sizes.map((z) => ({ store_id: st.store.id, product_detail_id: z.product_detail_id, quantity: z.quantity }))),
    })),
  }
  await OrderS.update(o.id, body)
})
await step('orden: aprobar', async () => OrderS.approved(need(order, 'orden').id))
await step('orden: cancelar', async () => OrderS.canceled(need(order, 'orden').id))

await server.close()
const failed = results.filter((r) => !r.ok)
console.log(`\nResultado: ${results.length - failed.length} OK, ${failed.length} con fallo`)
failed.forEach((f) => console.log(` - ${f.name}: ${f.detail}`))
process.exit(failed.length ? 1 : 0)
