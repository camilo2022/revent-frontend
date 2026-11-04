import { reactive, ref } from 'vue'
import Swal from 'sweetalert2'
import { errorMessage } from '@/utils/format'

// Listado con búsqueda, orden y paginación contra una API /all
// extra: objeto reactive con filtros (vacíos no se envían, booleanos van como 1/0)
export function useCrud(service, listKey, { extra = {}, perPage = 10, column = 'id', dir = 'desc' } = {}) {
  const items = ref([])
  const loading = ref(false)
  const pagination = ref(null)
  const query = reactive({ search: '', column, dir, page: 1, per_page: perPage })
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
      const d = res.data
      items.value = Array.isArray(d) ? d : d[listKey] ?? d.data ?? []
      // Si la API no manda meta (ubicaciones) se deduce: hay más páginas si la actual vino llena
      pagination.value = d.meta?.pagination ?? {
        current_page: query.page,
        total_pages: items.value.length >= query.per_page ? query.page + 1 : query.page,
      }
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
