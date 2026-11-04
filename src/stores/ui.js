import { defineStore } from 'pinia'

const THEME_KEY = 'revent_theme'

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarVisible: true,
    sidebarUnfoldable: false,
    theme: localStorage.getItem(THEME_KEY) || 'light',
  }),
  actions: {
    applyTheme() {
      document.documentElement.setAttribute('data-coreui-theme', this.theme)
    },
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem(THEME_KEY, theme)
      this.applyTheme()
    },
    toggleTheme() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark')
    },
  },
})
