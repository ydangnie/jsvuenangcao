<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import ProductForm from '@/components/ProductForm.vue';

const router = useRouter();
const activeTab = ref('products'); // 'products' hoặc 'orders'

// --- LOGIC SẢN PHẨM ---
const products = ref([]);
const productToEdit = ref(null);
const currentPage = ref(1);
const totalPages = ref(1);

const fetchProducts = async (page = 1) => {
    try {
        const res = await axios.get(`http://localhost:3000/api/san-pham?page=${page}&limit=10`);
        products.value = res.data.danh_sach;
        currentPage.value = res.data.phan_trang.trang;
        totalPages.value = res.data.phan_trang.tong_trang;
    } catch (e) { console.error(e); }
};

const deleteProduct = async (id) => {
    if(confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) {
        await axios.delete(`http://localhost:3000/api/san-pham/${id}`);
        fetchProducts(currentPage.value);
    }
};

const editProduct = (p) => {
    productToEdit.value = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- LOGIC ĐƠN HÀNG ---
const orders = ref([]);
const fetchOrders = async () => {
    try {
        const res = await axios.get('http://localhost:3000/api/hoa-don');
        orders.value = res.data;
    } catch (e) { console.error(e); }
};

// Khởi chạy
onMounted(() => {
    fetchProducts();
    fetchOrders();
});
</script>

<template>
    <div class="admin-container">
        <div class="sidebar">
            <h2 @click="router.push('/')" style="cursor: pointer;">⬅ Về Shop</h2>
            <hr>
            <button :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'">📦 Quản lý Sản phẩm</button>
            <button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">📄 Quản lý Đơn hàng</button>
        </div>

        <div class="content">
            <div v-if="activeTab === 'products'">
                <h1 class="page-title">Quản Lý Sản Phẩm</h1>
                
                <ProductForm 
                    :productToEdit="productToEdit" 
                    @saved="() => { fetchProducts(currentPage); productToEdit = null; }"
                    @cancel="productToEdit = null"
                />

                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Hình</th>
                                <th>Tên sản phẩm</th>
                                <th>Giá</th>
                                <th>Kho</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="p in products" :key="p.id">
                                <td>
                                    <img :src="p.hinh_anh ? `http://localhost:3000${p.hinh_anh}` : 'https://placehold.co/50'" class="thumb"/>
                                </td>
                                <td>{{ p.ten_sp }}</td>
                                <td class="text-red">{{ Number(p.gia).toLocaleString() }} đ</td>
                                <td>{{ p.so_luong }}</td>
                                <td>
                                    <button @click="editProduct(p)" class="btn-sm btn-edit">Sửa</button>
                                    <button @click="deleteProduct(p.id)" class="btn-sm btn-del">Xóa</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination">
                    <button @click="fetchProducts(currentPage - 1)" :disabled="currentPage === 1">Trước</button>
                    <span>Trang {{ currentPage }} / {{ totalPages }}</span>
                    <button @click="fetchProducts(currentPage + 1)" :disabled="currentPage === totalPages">Sau</button>
                </div>
            </div>

            <div v-if="activeTab === 'orders'">
                <h1 class="page-title">Danh Sách Đơn Hàng</h1>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Mã HĐ</th>
                                <th>Khách hàng</th>
                                <th>Tổng tiền</th>
                                <th>Ngày đặt</th>
                                <th>Xem</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="hd in orders" :key="hd.id">
                                <td>#{{ hd.id }}</td>
                                <td>{{ hd.ten_khach_hang }}</td>
                                <td class="text-red">{{ Number(hd.tong_tien).toLocaleString() }} đ</td>
                                <td>{{ new Date(hd.ngay_tao).toLocaleString('vi-VN') }}</td>
                                <td>
                                    <button @click="router.push(`/hoa-don/${hd.id}`)" class="btn-sm btn-view">Chi tiết</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.admin-container { display: flex; min-height: 100vh; font-family: sans-serif; background: #f4f6f8; }
.sidebar { width: 250px; background: #2c3e50; color: white; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
.sidebar button { background: none; border: none; color: #bdc3c7; padding: 15px; text-align: left; font-size: 16px; cursor: pointer; border-radius: 5px; transition: 0.2s; }
.sidebar button:hover, .sidebar button.active { background: #34495e; color: white; font-weight: bold; }

.content { flex: 1; padding: 30px; overflow-y: auto; }
.page-title { margin-top: 0; margin-bottom: 20px; color: #2c3e50; }

.admin-table { width: 100%; background: white; border-collapse: collapse; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden; }
.admin-table th, .admin-table td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
.admin-table th { background: #f8f9fa; font-weight: bold; color: #555; }
.thumb { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; }
.text-red { color: #e74c3c; font-weight: bold; }

.btn-sm { padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px; color: white; font-size: 12px; }
.btn-edit { background: #f39c12; }
.btn-del { background: #e74c3c; }
.btn-view { background: #3498db; }

.pagination { margin-top: 20px; text-align: center; display: flex; justify-content: center; gap: 10px; }
.pagination button { padding: 8px 15px; cursor: pointer; }
</style>