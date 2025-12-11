<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import ProductForm from '@/components/ProductForm.vue';

const API_URL = 'http://localhost:3000';
const router = useRouter();
const activeTab = ref('products');
const isLoading = ref(false);

const formatVND = (amount) => Number(amount).toLocaleString('vi-VN') + ' đ';
const formatDate = (d) => new Date(d).toLocaleString('vi-VN');

// --- SẢN PHẨM ---
const products = ref([]);
const productToEdit = ref(null);
const showForm = ref(false);
const pagination = ref({ page: 1, totalPages: 1 });

const fetchProducts = async (page = 1) => {
    try {
        const res = await axios.get(`${API_URL}/api/san-pham?page=${page}&limit=10`);
        products.value = res.data.danh_sach;
        pagination.value = { page: res.data.phan_trang.trang, totalPages: res.data.phan_trang.tong_trang };
    } catch (e) { console.error(e); }
};

const deleteProduct = async (id) => {
    if (confirm('Xóa sản phẩm này?')) {
        await axios.delete(`${API_URL}/api/san-pham/${id}`);
        fetchProducts(pagination.value.page);
    }
};

const openAddForm = () => { productToEdit.value = null; showForm.value = true; window.scrollTo(0,0); };
const openEditForm = (p) => { productToEdit.value = p; showForm.value = true; window.scrollTo(0,0); };
const handleSaved = () => { showForm.value = false; fetchProducts(pagination.value.page); };

// --- ĐƠN HÀNG ---
const orders = ref([]);
const fetchOrders = async () => {
    isLoading.value = true;
    try {
        const res = await axios.get(`${API_URL}/api/hoa-don`);
        orders.value = res.data;
    } catch (e) { console.error(e); } finally { isLoading.value = false; }
};

const updateOrderStatus = async (orderId, event) => {
    const newStatus = event.target.value;
    if(!confirm(`Cập nhật trạng thái thành "${newStatus}"? (Hủy đơn sẽ hoàn kho)`)) {
        await fetchOrders(); return;
    }
    try {
        await axios.put(`${API_URL}/api/hoa-don/${orderId}/trang-thai`, { trang_thai: newStatus });
        alert("Đã cập nhật!");
        fetchOrders();
    } catch (e) { alert("Lỗi: " + e.message); }
};

const getStatusClass = (s) => ({
    'dang_xu_ly': 'st-warning', 'dang_giao': 'st-info', 'da_giao': 'st-success', 'da_huy': 'st-danger'
}[s] || '');

onMounted(() => { fetchProducts(); fetchOrders(); });
</script>

<template>
    <div class="admin-layout">
        <aside class="sidebar">
            <div class="brand" @click="router.push('/')"><h2>🛍️ Shop Admin</h2></div>
            <nav class="menu">
                <button :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'">📦 Sản phẩm</button>
                <button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">📄 Đơn hàng</button>
            </nav>
        </aside>

        <main class="content">
            <div v-if="isLoading" class="loading">Đang tải...</div>

            <div v-if="activeTab === 'products'" class="tab-content">
                <div class="header-row"><h1>Sản Phẩm</h1> <button v-if="!showForm" @click="openAddForm" class="btn btn-primary">+ Thêm</button></div>
                <div v-if="showForm" class="form-wrapper">
                    <ProductForm :productToEdit="productToEdit" @saved="handleSaved" @cancel="showForm = false" />
                </div>
                <table class="data-table">
                    <thead><tr><th>Ảnh</th><th>Tên</th><th>Giá</th><th>Kho</th><th>Hành động</th></tr></thead>
                    <tbody>
                        <tr v-for="p in products" :key="p.id">
                            <td><img :src="p.hinh_anh_dai_dien ? `${API_URL}${p.hinh_anh_dai_dien}` : 'https://placehold.co/50'" class="thumb" /></td>
                            <td class="fw-bold">{{ p.ten_sp }}</td>
                            <td class="text-price">{{ formatVND(p.gia) }}</td>
                            <td>{{ p.so_luong }}</td>
                            <td>
                                <button @click="openEditForm(p)" class="btn-icon edit">✏️</button>
                                <button @click="deleteProduct(p.id)" class="btn-icon del">🗑️</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="pagination">
                    <button @click="fetchProducts(pagination.page - 1)" :disabled="pagination.page === 1">Prev</button>
                    <span>{{ pagination.page }}/{{ pagination.totalPages }}</span>
                    <button @click="fetchProducts(pagination.page + 1)" :disabled="pagination.page === pagination.totalPages">Next</button>
                </div>
            </div>

            <div v-if="activeTab === 'orders'" class="tab-content">
                <div class="header-row"><h1>Đơn Hàng</h1> <button @click="fetchOrders" class="btn btn-outline">🔄 Làm mới</button></div>
                <table class="data-table">
                    <thead><tr><th>#</th><th>Khách</th><th>Tiền</th><th>Trạng thái</th><th>Ngày</th><th>Xem</th></tr></thead>
                    <tbody>
                        <tr v-for="hd in orders" :key="hd.id">
                            <td>#{{ hd.id }}</td>
                            <td>{{ hd.ten_khach_hang }}</td>
                            <td class="text-price">{{ formatVND(hd.tong_tien) }}</td>
                            <td>
                                <select :value="hd.trang_thai" @change="updateOrderStatus(hd.id, $event)" :class="['status-select', getStatusClass(hd.trang_thai)]">
                                    <option value="dang_xu_ly">⏳ Đang xử lý</option>
                                    <option value="dang_giao">🚚 Đang giao</option>
                                    <option value="da_giao">✅ Đã giao</option>
                                    <option value="da_huy">❌ Đã hủy</option>
                                </select>
                            </td>
                            <td>{{ formatDate(hd.ngay_tao) }}</td>
                            <td><button @click="router.push(`/hoa-don/${hd.id}`)" class="btn-sm">Chi tiết</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>
    </div>
</template>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: #f8f9fa; font-family: sans-serif; }
.sidebar { width: 250px; background: #343a40; color: #fff; }
.brand { padding: 20px; background: #212529; cursor: pointer; text-align: center; }
.menu button { width: 100%; background: none; border: none; color: #ccc; padding: 15px; text-align: left; cursor: pointer; }
.menu button.active { background: #0d6efd; color: white; font-weight: bold; }
.content { flex: 1; padding: 20px; }
.header-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
.data-table { width: 100%; background: white; border-collapse: collapse; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.data-table th, .data-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
.thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
.text-price { color: #d63031; font-weight: bold; }
.btn { padding: 8px 15px; border-radius: 4px; border: none; cursor: pointer; }
.btn-primary { background: #0d6efd; color: white; }
.btn-icon { width: 30px; height: 30px; border-radius: 50%; border: none; margin-right: 5px; cursor: pointer; }
.edit { background: #ffc107; } .del { background: #dc3545; color: white; }
.status-select { padding: 5px 10px; border-radius: 15px; border: 1px solid #ddd; font-weight: bold; cursor: pointer; }
.st-warning { background: #fff3cd; color: #856404; } .st-info { background: #cff4fc; color: #055160; }
.st-success { background: #d1e7dd; color: #0f5132; } .st-danger { background: #f8d7da; color: #842029; }
.pagination { margin-top: 20px; text-align: center; display: flex; gap: 10px; justify-content: center; }
</style>