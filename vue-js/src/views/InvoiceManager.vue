<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const danhSachHoaDon = ref([]);
const dangTai = ref(false); // Biến trạng thái loading
const router = useRouter();

// Hàm lấy dữ liệu
const layDanhSachHoaDon = async () => {
    dangTai.value = true;
    try {
        const kq = await axios.get('http://localhost:3000/api/hoa-don');
        danhSachHoaDon.value = kq.data;
    } catch (e) {
        console.error("Lỗi tải hóa đơn:", e);
        alert('Không thể tải danh sách hóa đơn.');
    } finally {
        dangTai.value = false;
    }
};

// Hàm xóa hóa đơn
const xoaHoaDon = async (id) => {
    if (!confirm(`Bạn có chắc muốn xóa hóa đơn #${id} không? Hành động này sẽ hoàn lại kho nếu đơn chưa hủy.`)) return;

    try {
        await axios.delete(`http://localhost:3000/api/hoa-don/${id}`);
        alert('Đã xóa thành công!');
        // Cập nhật lại danh sách bằng cách lọc bỏ phần tử đã xóa (nhanh hơn gọi lại API)
        danhSachHoaDon.value = danhSachHoaDon.value.filter(hd => hd.id !== id);
    } catch (e) {
        console.error(e);
        alert('Lỗi khi xóa hóa đơn: ' + (e.response?.data?.msg || e.message));
    }
};

// Helper: Format text trạng thái
const tenTrangThai = (status) => {
    const map = {
        'dang_xu_ly': 'Đang xử lý',
        'dang_giao': 'Đang giao hàng',
        'da_giao': 'Giao thành công',
        'da_huy': 'Đã hủy'
    };
    return map[status] || status;
};

// Helper: Class màu sắc cho trạng thái
const lopTrangThai = (status) => {
    const map = {
        'dang_xu_ly': 'badge-warning',
        'dang_giao': 'badge-info',
        'da_giao': 'badge-success',
        'da_huy': 'badge-danger'
    };
    return map[status] || 'badge-default';
};

onMounted(layDanhSachHoaDon);
</script>

<template>
    <div class="container">
        <div class="header-section">
            <h1>📦 Quản Lý Đơn Hàng</h1>
            <button class="btn-home" @click="router.push('/')">← Về trang chủ</button>
        </div>
        
        <div v-if="dangTai" class="loading">Đang tải dữ liệu...</div>

        <div v-else class="table-responsive">
            <table class="bang-hoa-don">
                <thead>
                    <tr>
                        <th>Mã #</th>
                        <th>Khách Hàng</th>
                        <th>Trạng Thái</th>
                        <th>Tổng Tiền</th>
                        <th>Ngày Tạo</th>
                        <th>Thao Tác</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="danhSachHoaDon.length === 0">
                        <td colspan="6" class="text-center">Chưa có đơn hàng nào.</td>
                    </tr>
                    <tr v-for="hd in danhSachHoaDon" :key="hd.id">
                        <td><strong>#{{ hd.id }}</strong></td>
                        <td>{{ hd.ten_khach_hang }}</td>
                        <td>
                            <span :class="['badge', lopTrangThai(hd.trang_thai)]">
                                {{ tenTrangThai(hd.trang_thai) }}
                            </span>
                        </td>
                        <td class="tien">{{ Number(hd.tong_tien).toLocaleString('vi-VN') }} đ</td>
                        <td>{{ new Date(hd.ngay_tao).toLocaleString('vi-VN') }}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-detail" @click="router.push(`/hoa-don/${hd.id}`)">
                                    Chi tiết
                                </button>
                                <button class="btn-delete" @click="xoaHoaDon(hd.id)">
                                    Xóa
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
.container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }

/* Header */
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-home { background-color: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
.btn-home:hover { background-color: #5a6268; }

/* Table Styles */
.table-responsive { overflow-x: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); border-radius: 8px; }
.bang-hoa-don { width: 100%; border-collapse: collapse; background: white; }
.bang-hoa-don th { background-color: #007bff; color: white; padding: 12px; text-align: left; }
.bang-hoa-don td { padding: 12px; border-bottom: 1px solid #eee; }
.bang-hoa-don tr:hover { background-color: #f8f9fa; }

/* Columns specific */
.tien { color: #d63031; font-weight: bold; }
.text-center { text-align: center; font-style: italic; color: #888; }

/* Badges (Trạng thái) */
.badge { padding: 5px 10px; border-radius: 12px; font-size: 0.85em; font-weight: 600; color: white; display: inline-block; min-width: 80px; text-align: center;}
.badge-warning { background-color: #f39c12; } /* Đang xử lý - Cam */
.badge-info { background-color: #3498db; }    /* Đang giao - Xanh dương */
.badge-success { background-color: #2ecc71; } /* Đã giao - Xanh lá */
.badge-danger { background-color: #e74c3c; }  /* Đã hủy - Đỏ */
.badge-default { background-color: #95a5a6; }

/* Buttons */
.action-buttons { display: flex; gap: 5px; }
.btn-detail { background-color: #17a2b8; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
.btn-detail:hover { background-color: #138496; }
.btn-delete { background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
.btn-delete:hover { background-color: #c82333; }

.loading { text-align: center; font-size: 1.2em; color: #666; margin-top: 50px; }
</style>