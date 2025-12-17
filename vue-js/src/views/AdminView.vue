<script setup>
import { ref, onMounted, watch } from 'vue';   // Import các API của Vue 3 Composition API
import axios from 'axios';                     // Dùng axios để gọi API
import { useRouter } from 'vue-router';        // Dùng router để điều hướng trang
import ProductForm from '@/components/ProductForm.vue'; // Import component form sản phẩm

// URL API backend
const API_URL = 'http://localhost:3000';
const router = useRouter();

// Trạng thái tab hiện tại (products hoặc orders)
const activeTab = ref('products');

// Biến loading để hiển thị trạng thái tải dữ liệu
const isLoading = ref(false);

// Hàm format tiền VNĐ
const formatVND = (amount) => Number(amount).toLocaleString('vi-VN') + ' đ';

// Hàm format ngày giờ theo locale VN
const formatDate = (d) => new Date(d).toLocaleString('vi-VN');


// ================== QUẢN LÝ SẢN PHẨM ==================
const products = ref([]);              // Danh sách sản phẩm
const productToEdit = ref(null);       // Sản phẩm đang được chỉnh sửa
const showForm = ref(false);           // Hiển thị form thêm/sửa sản phẩm
const pagination = ref({ page: 1, totalPages: 1 }); // Phân trang sản phẩm

// Hàm lấy danh sách sản phẩm từ API
const fetchProducts = async (page = 1) => {
    try {
        const res = await axios.get(`${API_URL}/api/san-pham?page=${page}&limit=10`);
        products.value = res.data.danh_sach; // Gán danh sách sản phẩm
        pagination.value = { 
            page: res.data.phan_trang.trang, 
            totalPages: res.data.phan_trang.tong_trang 
        };
    } catch (e) { 
        console.error(e); 
    }
};

// Hàm xóa sản phẩm
const deleteProduct = async (id) => {
    if (confirm('Xóa sản phẩm này?')) {
        await axios.delete(`${API_URL}/api/san-pham/${id}`);
        fetchProducts(pagination.value.page); // Refresh lại danh sách
    }
};

// Mở form thêm sản phẩm
const openAddForm = () => { 
    productToEdit.value = null; 
    showForm.value = true; 
    window.scrollTo(0,0); // Cuộn lên đầu trang
};

// Mở form chỉnh sửa sản phẩm
const openEditForm = (p) => { 
    productToEdit.value = p; 
    showForm.value = true; 
    window.scrollTo(0,0); 
};

// Sau khi lưu sản phẩm thì đóng form và refresh danh sách
const handleSaved = () => { 
    showForm.value = false; 
    fetchProducts(pagination.value.page); 
};


// ================== QUẢN LÝ ĐƠN HÀNG ==================
const orders = ref([]);     // Danh sách đơn hàng (sau khi lọc)
const allOrders = ref([]);  // Toàn bộ đơn hàng (dùng để tính thống kê)

// Bộ lọc đơn hàng
const searchQuery = ref('');   // Tìm kiếm theo từ khóa
const statusFilter = ref('');  // Lọc theo trạng thái
const startDate = ref('');     // Ngày bắt đầu
const endDate = ref('');       // Ngày kết thúc

// Hàm lấy danh sách đơn hàng từ API (có filter)
const fetchOrders = async () => {
    isLoading.value = true;
    try {
        const params = new URLSearchParams();
        if (searchQuery.value) params.append('search', searchQuery.value);
        if (statusFilter.value !== '') params.append('status', statusFilter.value);
        if (startDate.value) params.append('startDate', startDate.value);
        if (endDate.value) params.append('endDate', endDate.value);

        const res = await axios.get(`${API_URL}/api/hoa-don?${params.toString()}`);
        orders.value = res.data;     // Gán dữ liệu đã lọc
        allOrders.value = res.data;  // Lưu toàn bộ để tính thống kê
    } catch (e) { 
        console.error(e); 
    } finally { 
        isLoading.value = false; 
    }
};

// Tự động gọi fetchOrders khi filter thay đổi
watch([searchQuery, statusFilter, startDate, endDate], () => {
    fetchOrders();
}, { deep: true });

// Reset bộ lọc về mặc định
const resetFilters = () => {
    searchQuery.value = '';
    statusFilter.value = '';
    startDate.value = '';
    endDate.value = '';
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (orderId, event) => {
    const newStatus = event.target.value;
    // Xác nhận trước khi cập nhật
    if(!confirm(`Cập nhật trạng thái thành "${getStatusLabel(newStatus)}"? ${newStatus == 2 ? '(Hủy đơn sẽ hoàn kho)' : ''}`)) { 
        await fetchOrders();  
        return; 
    }
    try {
        await axios.put(`${API_URL}/api/hoa-don/${orderId}/trang-thai`, { trang_thai: newStatus });
        alert("Đã cập nhật!");
        fetchOrders();
    } catch (e) { 
        alert("Lỗi: " + e.message); 
    }
};

// Hàm trả về class CSS theo trạng thái đơn hàng
const getStatusClass = (s) => {
    const map = {
        0: 'st-warning', // Đang xử lý
        1: 'st-info',    // Đang giao
        2: 'st-danger',  // Đã hủy
        3: 'st-success'  // Đã giao
    };
    return map[s] || '';
};

// Hàm trả về label trạng thái đơn hàng
const getStatusLabel = (s) => {
    const map = {
        0: 'Đang xử lý',
        1: 'Đang giao',
        2: 'Đã hủy',
        3: 'Đã giao'
    };
    return map[s] || 'Không rõ';
};


// ================== THỐNG KÊ ĐƠN HÀNG ==================
const orderStats = ref({
    total: 0,      // Tổng số đơn
    pending: 0,    // Đang xử lý
    shipping: 0,   // Đang giao
    completed: 0,  // Đã giao
    cancelled: 0,  // Đã hủy
    revenue: 0     // Doanh thu (chỉ tính đơn đã giao)
});

// Hàm tính toán thống kê từ allOrders
const calculateStats = () => {
    const stats = {
        total: allOrders.value.length,
        pending: 0,
        shipping: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0
    };

    allOrders.value.forEach(order => {
        if (order.trang_thai === 0) stats.pending++;
        else if (order.trang_thai === 1) stats.shipping++;
        else if (order.trang_thai === 2) stats.cancelled++;
        else if (order.trang_thai === 3) stats.completed++;

        // Nếu đơn đã giao thì cộng doanh thu
        if (order.trang_thai === 3) {
            stats.revenue += Number(order.tong_tien);
        }
    });

    orderStats.value = stats;
};

// Theo dõi allOrders để tự động tính lại thống kê
watch(allOrders, calculateStats, { immediate: true, deep: true });

// Khi component mount thì gọi API lấy dữ liệu sản phẩm và đơn hàng
onMounted(() => { 
    fetchProducts(); 
    fetchOrders(); 
});
</script>

<template>
    <div class="admin-layout">
        <aside class="sidebar">
            <div class="brand" @click="router.push('/')"><h2>🛍️ Shop Admin</h2></div>
            <nav class="menu">
                <button :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'">
                    📦 Sản phẩm
                </button>
                <button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
                    📄 Đơn hàng
                    <span v-if="orderStats.pending > 0" class="badge">{{ orderStats.pending }}</span>
                </button>
            </nav>
        </aside>

        <main class="content">
            <div v-if="isLoading" class="loading">Đang tải...</div>

            <!-- TAB SẢN PHẨM -->
            <div v-if="activeTab === 'products'" class="tab-content">
                <div class="header-row">
                    <h1>Sản Phẩm</h1> 
                    <button v-if="!showForm" @click="openAddForm" class="btn btn-primary">+ Thêm</button>
                </div>
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

            <!-- TAB ĐƠN HÀNG (NÂNG CẤP) -->
            <div v-if="activeTab === 'orders'" class="tab-content">
                <div class="header-row">
                    <h1>Đơn Hàng</h1> 
                    <button @click="fetchOrders" class="btn btn-outline">🔄 Làm mới</button>
                </div>

                <!-- 🔥 THỐNG KÊ -->
                <div class="stats-grid">
                    <div class="stat-card stat-total">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <div class="stat-label">Tổng đơn</div>
                            <div class="stat-value">{{ orderStats.total }}</div>
                        </div>
                    </div>
                    <div class="stat-card stat-pending">
                        <div class="stat-icon">⏳</div>
                        <div class="stat-info">
                            <div class="stat-label">Đang xử lý</div>
                            <div class="stat-value">{{ orderStats.pending }}</div>
                        </div>
                    </div>
                    <div class="stat-card stat-shipping">
                        <div class="stat-icon">🚚</div>
                        <div class="stat-info">
                            <div class="stat-label">Đang giao</div>
                            <div class="stat-value">{{ orderStats.shipping }}</div>
                        </div>
                    </div>
                    <div class="stat-card stat-completed">
                        <div class="stat-icon">✅</div>
                        <div class="stat-info">
                            <div class="stat-label">Đã giao</div>
                            <div class="stat-value">{{ orderStats.completed }}</div>
                        </div>
                    </div>
                    <div class="stat-card stat-revenue">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <div class="stat-label">Doanh thu</div>
                            <div class="stat-value">{{ formatVND(orderStats.revenue) }}</div>
                        </div>
                    </div>
                </div>

                <!-- 🔥 BỘ LỌC -->
                <div class="filter-section">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>🔍 Tìm kiếm</label>
                            <input 
                                v-model="searchQuery" 
                                type="text" 
                                placeholder="Tên, SĐT, Email..."
                                class="filter-input"
                            />
                        </div>

                        <div class="filter-group">
                            <label>📋 Trạng thái</label>
                            <select v-model="statusFilter" class="filter-select">
                                <option value="">Tất cả</option>
                                <option value="0">⏳ Đang xử lý</option>
                                <option value="1">🚚 Đang giao</option>
                                <option value="2">❌ Đã hủy</option>
                                <option value="3">✅ Đã giao</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label>📅 Từ ngày</label>
                            <input v-model="startDate" type="date" class="filter-input" />
                        </div>

                        <div class="filter-group">
                            <label>📅 Đến ngày</label>
                            <input v-model="endDate" type="date" class="filter-input" />
                        </div>

                        <button @click="resetFilters" class="btn-reset">🔄 Reset</button>
                    </div>
                </div>

                <!-- BẢNG DỮ LIỆU -->
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Khách hàng</th>
                                <th>SĐT</th>
                                <th>Tiền</th>
                                <th>Trạng thái</th>
                                <th>Ngày</th>
                                <th>Xem</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="orders.length === 0">
                                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                                    {{ searchQuery || statusFilter || startDate || endDate ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào' }}
                                </td>
                            </tr>
                            <tr v-for="hd in orders" :key="hd.id">
                                <td><strong>#{{ hd.id }}</strong></td>
                                <td>{{ hd.nguoi_mua }}</td>
                                <td>{{ hd.sdt }}</td>
                                <td class="text-price">{{ formatVND(hd.tong_tien) }}</td>
                                <td>
                                    <select 
                                        :value="hd.trang_thai" 
                                        @change="updateOrderStatus(hd.id, $event)" 
                                        :class="['status-select', getStatusClass(hd.trang_thai)]"
                                    >
                                        <option value="0">⏳ Đang xử lý</option>
                                        <option value="1">🚚 Đang giao</option>
                                        <option value="2">❌ Đã hủy</option>
                                        <option value="3">✅ Đã giao</option>
                                    </select>
                                </td>
                                <td>{{ formatDate(hd.thoi_diem) }}</td>
                                <td>
                                    <button @click="router.push(`/hoa-don/${hd.id}`)" class="btn-sm">Chi tiết</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: #f8f9fa; font-family: sans-serif; }
.sidebar { width: 250px; background: #343a40; color: #fff; position: sticky; top: 0; height: 100vh; }
.brand { padding: 20px; background: #212529; cursor: pointer; text-align: center; }
.menu button { width: 100%; background: none; border: none; color: #ccc; padding: 15px; text-align: left; cursor: pointer; position: relative; }
.menu button.active { background: #0d6efd; color: white; font-weight: bold; }
.menu button .badge { 
    position: absolute; 
    right: 15px; 
    top: 50%; 
    transform: translateY(-50%);
    background: #dc3545; 
    color: white; 
    border-radius: 10px; 
    padding: 2px 6px; 
    font-size: 11px; 
    font-weight: bold;
}

.content { flex: 1; padding: 20px; overflow-y: auto; }
.header-row { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center; }
.data-table { width: 100%; background: white; border-collapse: collapse; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.data-table th, .data-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
.thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
.text-price { color: #d63031; font-weight: bold; }

.btn { padding: 8px 15px; border-radius: 4px; border: none; cursor: pointer; font-weight: 500; }
.btn-primary { background: #0d6efd; color: white; }
.btn-outline { background: white; border: 1px solid #0d6efd; color: #0d6efd; }
.btn-icon { width: 30px; height: 30px; border-radius: 50%; border: none; margin-right: 5px; cursor: pointer; }
.edit { background: #ffc107; } 
.del { background: #dc3545; color: white; }

.status-select { 
    padding: 5px 10px; 
    border-radius: 15px; 
    border: 1px solid #ddd; 
    font-weight: bold; 
    cursor: pointer; 
    font-size: 13px;
}
.st-warning { background: #fff3cd; color: #856404; } 
.st-info { background: #cff4fc; color: #055160; }
.st-success { background: #d1e7dd; color: #0f5132; } 
.st-danger { background: #f8d7da; color: #842029; }

.pagination { 
    margin-top: 20px; 
    text-align: center; 
    display: flex; 
    gap: 10px; 
    justify-content: center; 
}

.btn-sm { 
    background: #17a2b8; 
    color: white; 
    border: none; 
    padding: 5px 10px; 
    border-radius: 4px; 
    cursor: pointer; 
    font-size: 12px;
}
.btn-sm:hover { background: #138496; }

/* 🔥 STATS GRID */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 25px;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: transform 0.2s;
}

.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.stat-icon {
    font-size: 36px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
}

.stat-total .stat-icon { background: #e3f2fd; }
.stat-pending .stat-icon { background: #fff3e0; }
.stat-shipping .stat-icon { background: #e1f5fe; }
.stat-completed .stat-icon { background: #e8f5e9; }
.stat-revenue .stat-icon { background: #f3e5f5; }

.stat-info {
    flex: 1;
}

.stat-label {
    font-size: 13px;
    color: #666;
    margin-bottom: 5px;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
}

/* 🔥 FILTER SECTION */
.filter-section {
    background: white;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.filter-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1.3fr 1.3fr auto;
    gap: 15px;
    align-items: end;
}

.filter-group {
    display: flex;
    flex-direction: column;
}

.filter-group label {
    font-size: 13px;
    font-weight: 600;
    color: #555;
    margin-bottom: 8px;
}

.filter-input, .filter-select {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
}

.filter-input:focus, .filter-select:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.btn-reset {
    padding: 10px 20px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    height: 42px;
}

.btn-reset:hover {
    background: #5a6268;
}

.table-wrapper {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.loading { 
    text-align: center; 
    padding: 40px; 
    font-size: 18px; 
    color: #666; 
}

/* RESPONSIVE */
@media (max-width: 1200px) {
    .filter-row {
        grid-template-columns: 1fr 1fr;
    }
    
    .btn-reset {
        grid-column: span 2;
    }
}

@media (max-width: 768px) {
    .admin-layout {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        height: auto;
        position: relative;
    }
    
    .menu {
        display: flex;
    }
    
    .menu button {
        flex: 1;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .filter-row {
        grid-template-columns: 1fr;
    }
    
    .btn-reset {
        grid-column: span 1;
    }
}
</style>