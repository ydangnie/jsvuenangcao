import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Dòng này có thể chưa được sử dụng

const app = createApp(App)

app.use(router)

app.mount('#app')