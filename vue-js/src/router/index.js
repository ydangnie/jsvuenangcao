import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChiTietSanPham from '../views/ChiTietSanPham.vue' // Đảm bảo tệp này tồn tại

const router = createRouter({
    history: createWebHistory(
        import.meta.env.BASE_URL),
    routes: [{
            path: '/',
            name: 'home',
            component: HomeView, // Trang danh sách sản phẩm
        },
        // FIX: Thêm một route để xử lý yêu cầu "/home" bằng cách redirect về "/"
        {
            path: '/home',
            redirect: '/'
        },
        {
            path: '/san-pham/:id',
            name: 'chi-tiet-san-pham',
            component: ChiTietSanPham,
            props: true
        },
        {
            path: '/about',
            name: 'about',
            component: () =>
                import ('../views/AboutView.vue'),
        },
    ],
})

export default router