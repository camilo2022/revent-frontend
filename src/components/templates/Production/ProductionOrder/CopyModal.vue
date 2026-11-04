<script setup>
import { computed, ref, watch } from 'vue'
import { copyRow, ensureStore } from '@/utils/orderMatrix'
import FormField from '@/components/UI/templates/FormField.vue'

// Copia cantidades de una tienda (o de todas) del color origen a otras tiendas y colores.
// Modifica directamente los objetos `lines` (estado reactivo de la orden).
const props = defineProps({
  visible: Boolean,
  sourceId: Number, // id del color origen
  colors: { type: Array, default: () => [] }, // colores del producto
  lines: { type: Object, default: () => ({}) },
  storeLabel: { type: Function, required: true },
})
const emit = defineEmits(['close', 'done'])

const sourceStore = ref('all')
const targetStores = ref([])
const targetColors = ref([])

watch(() => props.visible, (v) => {
  if (v) {
    sourceStore.value = 'all'
    targetStores.value = []
    targetColors.value = []
  }
})

const source = computed(() => props.colors.find((c) => c.id === props.sourceId))
const sourceLine = computed(() => props.lines[props.sourceId])
const otherStores = computed(() => (sourceLine.value?.stores ?? []).filter((s) => s !== Number(sourceStore.value)))
// Otros colores incluidos en la orden
const otherColors = computed(() => props.colors.filter((c) => c.id !== props.sourceId && props.lines[c.id]?.enabled))

const toggle = (list, id) => {
  const at = list.indexOf(id)
  if (at >= 0) list.splice(at, 1)
  else list.push(id)
}

const canApply = computed(() => targetColors.value.length || (sourceStore.value !== 'all' && targetStores.value.length))

const apply = () => {
  const src = sourceLine.value
  const srcSizes = source.value.sizes
  const sources = sourceStore.value === 'all' ? [...src.stores] : [Number(sourceStore.value)]

  // Otras tiendas del mismo color (solo con una tienda origen)
  if (sourceStore.value !== 'all') {
    targetStores.value.forEach((st) => copyRow(src, sources[0], srcSizes, src, st, srcSizes))
  }
  // Otros colores: misma tienda, emparejando por talla
  targetColors.value.forEach((colorId) => {
    const dst = props.colors.find((c) => c.id === colorId)
    sources.forEach((st) => {
      ensureStore(props.lines[colorId], st)
      copyRow(src, st, srcSizes, props.lines[colorId], st, dst.sizes)
    })
  })
  emit('done')
}
</script>

<template>
  <CModal :visible="visible" alignment="center" scrollable @close="emit('close')">
    <CModalHeader><CModalTitle>Copiar a otras tiendas o colores</CModalTitle></CModalHeader>
    <CModalBody>
      <p class="small text-body-secondary">Origen: color <strong>{{ source?.color?.name }}</strong>. Las tallas se emparejan por nombre de talla.</p>
      <FormField label="Copiar desde">
        <CFormSelect v-model="sourceStore" @change="targetStores = []">
          <option value="all">Todas las tiendas del color</option>
          <option v-for="s in sourceLine?.stores" :key="s" :value="s">{{ storeLabel(s) }}</option>
        </CFormSelect>
      </FormField>

      <div v-if="sourceStore !== 'all'" class="mb-3">
        <label class="form-label">Otras tiendas de este color</label>
        <p v-if="!otherStores.length" class="small text-body-secondary mb-0">No hay otras tiendas en este color.</p>
        <CFormCheck
          v-for="s in otherStores" :key="s" :id="`copy-st-${s}`" :label="storeLabel(s)"
          :checked="targetStores.includes(s)" @change="toggle(targetStores, s)"
        />
      </div>

      <div>
        <label class="form-label">Otros colores de la orden</label>
        <p v-if="!otherColors.length" class="small text-body-secondary mb-0">No hay otros colores incluidos en la orden.</p>
        <CFormCheck
          v-for="c in otherColors" :key="c.id" :id="`copy-co-${c.id}`" :label="c.color?.name"
          :checked="targetColors.includes(c.id)" @change="toggle(targetColors, c.id)"
        />
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="emit('close')">Cancelar</CButton>
      <CButton color="primary" :disabled="!canApply" @click="apply">Copiar</CButton>
    </CModalFooter>
  </CModal>
</template>
