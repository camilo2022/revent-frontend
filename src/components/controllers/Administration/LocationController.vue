<script setup>
import { ref } from 'vue'
import CountryController from './CountryController.vue'
import DepartmentController from './DepartmentController.vue'
import CityController from './CityController.vue'
import RegionController from './RegionController.vue'
import ContinentController from './ContinentController.vue'

// Ubicaciones (solo lectura): una pestaña por tipo; cada una es un controlador con su lista paginada
const tabs = [
  { key: 'countries', title: 'Países', component: CountryController },
  { key: 'departments', title: 'Departamentos', component: DepartmentController },
  { key: 'cities', title: 'Ciudades', component: CityController },
  { key: 'regions', title: 'Regiones', component: RegionController },
  { key: 'continents', title: 'Continentes', component: ContinentController },
]
const active = ref('countries')
</script>

<template>
  <CNav variant="tabs" class="mb-3" role="tablist">
    <CNavItem v-for="t in tabs" :key="t.key">
      <CNavLink href="#" :active="active === t.key" role="tab" @click.prevent="active = t.key">{{ t.title }}</CNavLink>
    </CNavItem>
  </CNav>
  <template v-for="t in tabs" :key="t.key">
    <component :is="t.component" v-if="active === t.key" />
  </template>
</template>
