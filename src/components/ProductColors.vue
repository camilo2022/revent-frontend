<script setup>
// Colores y tallas de un producto con sus códigos (solo lectura)
defineProps({ colors: { type: Array, default: () => [] } })
</script>

<template>
  <p v-if="!colors.length" class="text-body-secondary mb-0">Sin colores.</p>
  <CTable v-else small responsive class="mb-0">
    <CTableHead>
      <CTableRow>
        <CTableHeaderCell>Color</CTableHeaderCell>
        <CTableHeaderCell>Código del color</CTableHeaderCell>
        <CTableHeaderCell>Tallas (código)</CTableHeaderCell>
      </CTableRow>
    </CTableHead>
    <CTableBody>
      <CTableRow v-for="c in colors" :key="c.id">
        <CTableDataCell>{{ c.color?.name }}</CTableDataCell>
        <CTableDataCell><code>{{ c.code }}</code></CTableDataCell>
        <CTableDataCell>
          <CBadge v-for="s in c.sizes" :key="s.id" color="light" class="text-body border me-1 mb-1" :title="s.code">
            {{ s.size?.name }} <span class="text-body-secondary">{{ s.code }}</span>
          </CBadge>
        </CTableDataCell>
      </CTableRow>
    </CTableBody>
  </CTable>
</template>
