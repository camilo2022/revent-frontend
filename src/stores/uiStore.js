import { defineStore } from 'pinia'
import { ref } from 'vue'

// Interfaz: sidebar, tema claro/oscuro y modo de tablas (tabla/tarjetas); todo persistido
export const useUiStore = defineStore(
  'uiStore',
  () => {
    const sidebarVisible = ref(true)
    const sidebarUnfoldable = ref(false)
    const theme = ref('light')
    const listMode = ref('table')

    const applyTheme = () => document.documentElement.setAttribute('data-coreui-theme', theme.value)
    const setTheme = (value) => {
      theme.value = value
      applyTheme()
    }
    const toggleTheme = () => setTheme(theme.value === 'dark' ? 'light' : 'dark')

    return { sidebarVisible, sidebarUnfoldable, theme, listMode, applyTheme, setTheme, toggleTheme }
  },
  { persist: { pick: ['theme', 'listMode', 'sidebarUnfoldable'] } },
)
