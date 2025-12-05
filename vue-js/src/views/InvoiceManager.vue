<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const danhSachHoaDon = ref([]);
const router = useRouter();

const layDanhSachHoaDon = async () => {
    try {
        const kq = await axios.get('http://localhost:3000/api/hoa-don');
        danhSachHoaDon.value = kq.data;
    } catch (e) { console.error(e); }
};

onMounted(layDanhSachHoaDon);
</script>

<template>
    <div class="container">
        <h1>Quản Lý Hóa Đơn</h1>
        <button @click="router.push('/')">← Về trang chủ</button>
        
        <table border="1" class="bang-hoa-don">
            <thead>
                <tr>
                    <th>Mã HĐ</th>
                    <th>Khách Hàng</th>
                    <th>Tổng Tiền</th>
                    <th>Ngày Tạo</th>
                    <th>Xem</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="hd in danhSachHoaDon" :key="hd.id">
                    <td>#{{ hd.id }}</td>
                    <td>{{ hd.ten_khach_hang }}</td>
                    <td style="color: red; font-weight: bold;">{{ Number(hd.tong_tien).toLocaleString('vi-VN') }} đ</td>
                    <td>{{ new Date(hd.ngay_tao).toLocaleString('vi-VN') }}</td>
                    <td>
                        <button @click="router.push(`/hoa-don/${hd.id}`)">Chi tiết</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.bang-hoa-don { width: 100%; border-collapse: collapse; margin-top: 20px; }
.bang-hoa-don th, .bang-hoa-don td { padding: 10px; text-align: center; }
</style>