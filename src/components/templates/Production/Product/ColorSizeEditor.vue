<script setup>
import { computed, ref } from 'vue'
import { cilCheckAlt, cilCopy, cilPlus, cilTrash } from '@coreui/icons'

// v-model: [{ color_id, description, size_ids: [] }]
const model = defineModel({ type: Array, default: () => [] })
const props = defineProps({
  colors: { type: Array, default: () => [] },
  sizes: { type: Array, default: () => [] },
  productCode: { type: String, default: '' }, // código del producto ya guardado (ej. RB265001) para mostrar el código de cada talla
})

const newColor = ref('')
const search = ref('')
const colorOf = (id) => props.colors.find((c) => c.id === id)
const colorName = (id) => colorOf(id)?.name ?? `Color ${id}`
// Colores que aún no se han agregado, filtrados por el buscador
const available = computed(() => {
  const q = search.value.trim().toLowerCase()
  return props.colors
    .filter((c) => !model.value.some((m) => m.color_id === c.id))
    .filter((c) => !q || `${c.name} ${c.settings?.code ?? ''}`.toLowerCase().includes(q))
})

const addColor = () => {
  if (!newColor.value) return
  model.value.push({ color_id: Number(newColor.value), description: null, size_ids: [] })
  newColor.value = ''
  search.value = ''
}
const removeColor = (i) => model.value.splice(i, 1)

const toggleSize = (item, sizeId) => {
  const at = item.size_ids.indexOf(sizeId)
  if (at >= 0) item.size_ids.splice(at, 1)
  else item.size_ids.push(sizeId)
}
const allSizes = (item) => {
  const all = props.sizes.every((s) => item.size_ids.includes(s.id))
  item.size_ids = all ? [] : props.sizes.map((s) => s.id)
}
const copyPrevious = (i) => {
  model.value[i].size_ids = [...model.value[i - 1].size_ids]
}
// Código que tendrá la talla: PRODUCTO-COLOR-TALLA (solo cuando el producto ya existe)
const sizeCode = (item, s) => {
  const cc = colorOf(item.color_id)?.settings?.code
  return props.productCode && cc && s.settings?.code ? `${props.productCode}-${cc}-${s.settings.code}` : null
}
</script>

<template>
  <div>
    <div class="d-flex flex-wrap gap-2 mb-2">
      <CFormInput v-model="search" placeholder="Buscar color por nombre o código..." style="max-width: 240px" aria-label="Buscar color" />
      <CFormSelect v-model="newColor" style="max-width: 280px" aria-label="Color">
        <option value="">Selecciona un color...</option>
        <option v-for="c in available" :key="c.id" :value="c.id">{{ c.name }} ({{ c.settings?.code }})</option>
      </CFormSelect>
      <CButton color="success" variant="outline" :disabled="!newColor" @click="addColor"><CIcon :icon="cilPlus" /> Agregar color</CButton>
    </div>
    <p class="form-text mt-0 mb-3">Agrega cada color del producto y marca las tallas en las que se fabricará. Haz clic en una talla para marcarla o desmarcarla.</p>

    <p v-if="!model.length" class="text-body-secondary">Aún no hay colores. Busca uno arriba y pulsa "Agregar color".</p>

    <CCard v-for="(item, i) in model" :key="item.color_id" class="mb-2 border">
      <CCardBody class="py-2">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <strong>{{ colorName(item.color_id) }} <small class="text-body-secondary fw-normal">({{ item.size_ids.length }} talla{{ item.size_ids.length === 1 ? '' : 's' }})</small></strong>
          <div class="d-flex flex-wrap gap-1">
            <CButton color="secondary" variant="outline" size="sm" @click="allSizes(item)">
              <CIcon :icon="cilCheckAlt" /> {{ sizes.every((s) => item.size_ids.includes(s.id)) ? 'Ninguna talla' : 'Todas las tallas' }}
            </CButton>
            <CButton v-if="i > 0" color="secondary" variant="outline" size="sm" title="Usa las mismas tallas del color de arriba" @click="copyPrevious(i)">
              <CIcon :icon="cilCopy" /> Copiar tallas del color anterior
            </CButton>
            <CButton color="danger" variant="ghost" size="sm" @click="removeColor(i)"><CIcon :icon="cilTrash" /> Quitar</CButton>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <CButton
            v-for="s in sizes"
            :key="s.id"
            size="sm"
            :color="item.size_ids.includes(s.id) ? 'primary' : 'secondary'"
            :variant="item.size_ids.includes(s.id) ? undefined : 'outline'"
            shape="rounded-pill"
            :title="sizeCode(item, s) ? `Código: ${sizeCode(item, s)}` : `Talla ${s.name}`"
            :aria-pressed="item.size_ids.includes(s.id)"
            @click="toggleSize(item, s.id)"
          >
            {{ s.name }}
            <small v-if="item.size_ids.includes(s.id) && sizeCode(item, s)" class="opacity-75 ms-1">{{ sizeCode(item, s) }}</small>
          </CButton>
        </div>
        <small v-if="!item.size_ids.length" class="text-body-secondary">Selecciona las tallas de este color.</small>
      </CCardBody>
    </CCard>
  </div>
</template>
