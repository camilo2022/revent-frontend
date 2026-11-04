import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useOptions } from './useOptions'
import { useServerErrors } from './useServerErrors'
import { useAlertStore } from '@/stores/alertStore'
import { useSwalStore } from '@/stores/swalStore'
import { useUiStore } from '@/stores/uiStore'
import { firstOf, listOf } from '@/utils/format'
import { getPath, setPath } from '@/utils/paths'

// Controlador genérico de un recurso: lista paginada, panel activo (index/create/edit/show/otros),
// formulario con el modelo, guardado, eliminar y restaurar. Lo usan todos los *Controller.vue.
export function useResourceController({ service, Model, configuration: config, fixed = () => ({}) }) {
  const alerts = useAlertStore()
  const swal = useSwalStore()
  const ui = useUiStore()
  const { options, loadOptions } = useOptions()
  const serverErrors = useServerErrors()

  const items = ref([])
  const loading = ref(true)
  const saving = ref(false)
  const mode = ref('index') // index | create | edit | show | (panel propio)
  const current = ref(null) // registro seleccionado
  const form = ref(new Model())

  // Paginación con la misma forma que thuman
  const pagination = reactive({
    search: '', sizes: [5, 10, 25, 50, 100], per_page: 10, mode: ui.listMode,
    total: 0, count: 0, current_page: 1, total_pages: 1,
    column: config.sort?.column ?? 'id', dir: config.sort?.dir ?? 'desc',
  })
  // Filtros: with_trashed + los de la configuración (siempre 1/0 para Laravel)
  const filters = reactive({
    ...(config.withTrashed ? { with_trashed: false } : {}),
    ...Object.fromEntries((config.filters ?? []).map((f) => [f.key, false])),
    ...(config.valueFilters ?? {}),
  })

  const params = () => {
    const p = { page: pagination.current_page, per_page: pagination.per_page, column: pagination.column, dir: pagination.dir, ...fixed() }
    if (pagination.search && !config.noSearch) p.search = pagination.search
    Object.entries(filters).forEach(([k, v]) => {
      if (v === true || v === false) p[k] = v ? 1 : 0
      else if (v !== '' && v !== null && v !== undefined) p[k] = v
    })
    return p
  }

  const load = async () => {
    loading.value = true
    try {
      const res = await service.all(params())
      const meta = res.data?.meta?.pagination
      items.value = listOf(res, config.listKey)
      // Sin meta (ubicaciones) se deduce si hay página siguiente
      Object.assign(pagination, meta ?? {
        total: null, count: items.value.length, current_page: pagination.current_page,
        total_pages: items.value.length >= pagination.per_page ? pagination.current_page + 1 : pagination.current_page,
      })
    } catch (error) {
      items.value = []
      alerts.error(error?.error?.message || error?.message || 'No se pudo cargar la lista')
    } finally {
      loading.value = false
    }
  }

  // Navegación entre paneles
  const goIndex = () => {
    mode.value = 'index'
    current.value = null
    serverErrors.clear()
  }
  const goCreate = () => {
    serverErrors.clear()
    form.value = new Model()
    current.value = null
    mode.value = 'create'
  }
  const goEdit = async (row) => {
    serverErrors.clear()
    try {
      // Los formularios propios cargan su propio registro
      current.value = config.customForm ? row : firstOf(await service.find(row.id))
      if (!config.customForm) form.value = Model.from(current.value)
      mode.value = 'edit'
    } catch (error) {
      serverErrors.handle(error)
    }
  }
  const goShow = async (row) => {
    try {
      current.value = config.customShow ? row : firstOf(await service.find(row.id))
      mode.value = 'show'
    } catch (error) {
      serverErrors.handle(error)
    }
  }
  const goPanel = (name, row) => {
    current.value = row
    mode.value = name
  }
  // Tras guardar en un formulario propio
  const saved = () => {
    alerts.success('Guardado correctamente')
    goIndex()
    load()
  }

  // Arma el cuerpo según los campos de la configuración
  const buildPayload = () => {
    const payload = { ...fixed() }
    config.fields.forEach((f) => {
      if (f.type === 'location') {
        payload[f.typeKey] = form.value[f.typeKey]
        payload[f.idKey] = form.value[f.idKey]
        return
      }
      const v = getPath(form.value, f.key)
      if (f.type === 'file' && !(v instanceof File)) return // sin archivo nuevo no se envía
      if (f.type === 'password' && !v) return // contraseña vacía al editar = no cambia
      if (f.onlyWith && !(getPath(form.value, f.onlyWith) instanceof File)) return
      setPath(payload, f.key, v)
    })
    return payload
  }

  const save = async () => {
    saving.value = true
    serverErrors.clear()
    const payload = buildPayload()
    const hasFile = JSON.stringify(payload, (k, v) => (v instanceof File ? '__file__' : v)).includes('__file__')
    try {
      if (mode.value === 'edit') await (hasFile ? service.updateForm(current.value.id, payload) : service.update(current.value.id, payload))
      else await (hasFile ? service.storeForm(payload) : service.store(payload))
      saved()
    } catch (error) {
      serverErrors.handle(error)
    } finally {
      saving.value = false
    }
  }

  // Eliminar / restaurar con confirmación
  const act = async (row, { fn, title, done }) => {
    if (!(await swal.confirm({ title, text: row.name ?? row.username ?? '', icon: 'warning', confirmText: 'Sí, continuar' }))) return
    try {
      await service[fn](row.id)
      alerts.success(done)
      load()
    } catch (error) {
      serverErrors.handle(error)
    }
  }
  const remove = (row) => act(row, { fn: 'delete', title: `¿Eliminar ${config.singular}?`, done: 'Eliminado correctamente' })
  const restore = (row) => act(row, { fn: 'restore', title: `¿Restaurar ${config.singular}?`, done: 'Restaurado correctamente' })

  // Paginación, búsqueda (con retardo), tamaño y orden
  let timer = null
  const setPage = (page) => {
    pagination.current_page = page
    load()
  }
  const refresh = () => setPage(1)
  const onSearch = (value) => {
    pagination.search = value
    clearTimeout(timer)
    timer = setTimeout(refresh, 400)
  }
  const onPerPage = (value) => {
    pagination.per_page = Number(value)
    refresh()
  }
  const sortBy = (column) => {
    pagination.dir = pagination.column === column && pagination.dir === 'asc' ? 'desc' : 'asc'
    pagination.column = column
    refresh()
  }
  const setMode = (value) => {
    pagination.mode = value
    ui.listMode = value
  }

  onMounted(() => {
    loadOptions(config.optionKeys ?? [])
    load()
  })
  onBeforeUnmount(() => clearTimeout(timer))

  return reactive({
    items, loading, saving, mode, current, form, pagination, filters, options, loadOptions,
    errors: serverErrors.errors, message: serverErrors.message, getError: serverErrors.get,
    clearErrors: serverErrors.clear, handleError: serverErrors.handle,
    load, goIndex, goCreate, goEdit, goShow, goPanel, saved, save, remove, restore,
    setPage, refresh, onSearch, onPerPage, sortBy, setMode,
  })
}
