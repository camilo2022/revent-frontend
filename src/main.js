import { createApp } from 'vue'
import { createPinia } from 'pinia'
import CoreuiVue from '@coreui/vue'
import { CIcon } from '@coreui/icons-vue'
import App from './App.vue'
import router from './router'
import { setupInterceptors } from './API/interceptors'
import { vCan } from './utils/directives'
import { useUiStore } from './stores/ui'
import './scss/style.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(CoreuiVue)
app.component('CIcon', CIcon)
app.directive('can', vCan)

setupInterceptors()
useUiStore().applyTheme() // tema claro/oscuro guardado

app.mount('#app')
