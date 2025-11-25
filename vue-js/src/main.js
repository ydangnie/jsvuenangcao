import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 👈 Bổ sung: Import router

const app = createApp(App)

app.use(router) // 👈 Bổ sung: Sử dụng router
    // FIX: Thay đổi target mount từ '#app' thành '#app-wrapper' để khớp với App.vue
app.mount('#app-wrapper')