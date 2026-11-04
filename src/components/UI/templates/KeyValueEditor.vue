<script setup>
import { CIcon } from '@coreui/icons-vue'
import { cilPlus, cilTrash } from '@coreui/icons'

// Pares clave/valor dinámicos: v-model es un arreglo [{ key, value }]
const model = defineModel({ type: Array, default: () => [] })
const add = () => model.value.push({ key: '', value: '' })
const remove = (i) => model.value.splice(i, 1)
</script>

<template>
  <div>
    <div v-for="(row, i) in model" :key="i" class="d-flex gap-2 mb-2">
      <CFormInput v-model="row.key" placeholder="Característica (ej. Horma)" />
      <CFormInput v-model="row.value" placeholder="Valor" />
      <CButton color="danger" variant="outline" @click="remove(i)"><CIcon :icon="cilTrash" /></CButton>
    </div>
    <CButton color="success" variant="outline" size="sm" @click="add"><CIcon :icon="cilPlus" /> Agregar característica</CButton>
  </div>
</template>
