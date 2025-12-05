import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DetailView from '../views/DetailView.vue'
import CartView from '../views/CartView.vue'
import InvoiceDetail from '../views/InvoiceDetail.vue'
import AdminView from '../views/AdminView.vue' // 👈 Import trang Admin mới

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/product/:id', name: 'product-detail', component: DetailView },
        { path: '/gio-hang', name: 'cart', component: CartView },
        { path: '/hoa-don/:id', name: 'invoice-detail', component: InvoiceDetail },

        // 👇 Thêm route này
        { path: '/admin', name: 'admin', component: AdminView }
    ]
})

export default router