import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import CoreuiVue from '@coreui/vue'
import { CIcon } from '@coreui/icons-vue'
import App from './App.vue'
import router from './router'
import { setTokenGetter } from './config/http'
import { setupInterceptors } from './config/interceptors'
import { vCan } from './utils/directives'
import { useAuthStore } from './stores/authStore'
import { useUiStore } from './stores/uiStore'
import './scss/style.scss'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // sesión y tema se guardan en localStorage

app.use(pinia)
app.use(router)
app.use(CoreuiVue)
app.component('CIcon', CIcon)
app.directive('can', vCan)

setTokenGetter(() => useAuthStore().token)
setupInterceptors()
useUiStore().applyTheme()

app.mount('#app')
