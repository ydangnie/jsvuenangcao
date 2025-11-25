import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChiTietSanPham from '../views/ChiTietSanPham.vue' // Import component chi tiết

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [{
            path: '/',
            name: 'home',
            component: HomeView, // Trang danh sách sản phẩm
        },
        {
            path: '/san-pham/:id', // Route chi tiết sản phẩm với tham số ID
            name: 'chi-tiet-san-pham',
            component: ChiTietSanPham,
            props: true // Cho phép truyền params là props vào component
        },
        {
            path: '/about',
            name: 'about',
            // route level code-splitting
            // this generates a separate chunk (About.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () =>
                import ('../views/AboutView.vue'),
        },
    ],
})

export default router