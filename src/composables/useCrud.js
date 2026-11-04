import { reactive, ref } from 'vue'
import Swal from 'sweetalert2'
import { errorMessage } from '@/utils/format'

// Listado con búsqueda, orden y paginación contra una API /all
// extra: objeto reactive con filtros (vacíos no se envían, booleanos van como 1/0)
export function useCrud(service, listKey, { extra = {}, perPage = 10 } = {}) {
  const items = ref([])
  const loading = ref(false)
  const pagination = ref(null)
  const query = reactive({ search: '', column: 'id', dir: 'desc', page: 1, per_page: perPage })
  let timer = null

  const load = async () => {
    loading.value = true
    try {
      const params = { ...query }
      Object.entries(extra).forEach(([k, v]) => {
        if (v === true || v === false) params[k] = v ? 1 : 0
        else if (v !== '' && v !== null && v !== undefined) params[k] = v
      })
      if (!params.search) delete params.search
      const res = await service.all(params)
      items.value = res.data[listKey] ?? []
      pagination.value = res.data.meta?.pagination ?? null
    } catch (error) {
      items.value = []
      Swal.fire({ icon: 'error', title: 'No se pudo cargar', text: errorMessage(error) })
    } finally {
      loading.value = false
    }
  }

  const setPage = (page) => {
    query.page = page
    load()
  }
  // Al buscar o filtrar se vuelve a la página 1
  const refresh = () => {
    query.page = 1
    load()
  }
  const setSearch = (value) => {
    query.search = value
    clearTimeout(timer)
    timer = setTimeout(refresh, 400)
  }
  const sortBy = (column) => {
    query.dir = query.column === column && query.dir === 'asc' ? 'desc' : 'asc'
    query.column = column
    refresh()
  }

  return { items, loading, pagination, query, load, setPage, refresh, setSearch, sortBy }
}
