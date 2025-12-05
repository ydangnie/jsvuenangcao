<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const hoaDon = ref(null);
const chiTiet = ref([]);

onMounted(async () => {
    try {
        const id = route.params.id;
        const kq = await axios.get(`http://localhost:3000/api/hoa-don/${id}`);
        hoaDon.value = kq.data.thong_tin_chung;
        chiTiet.value = kq.data.danh_sach_mon;
    } catch (e) {
        alert('Không tìm thấy hóa đơn');
        router.push('/quan-ly-hoa-don');
    }
});

const inHoaDon = () => window.print();
</script>

<template>
    <div class="container" v-if="hoaDon">
        <div class="khung-hoa-don">
            <h1 style="text-align: center;">HÓA ĐƠN BÁN LẺ</h1>
            <p><strong>Mã hóa đơn:</strong> #{{ hoaDon.id }}</p>
            <p><strong>Khách hàng:</strong> {{ hoaDon.ten_khach_hang }}</p>
            <p><strong>Ngày lập:</strong> {{ new Date(hoaDon.ngay_tao).toLocaleString('vi-VN') }}</p>
            
            <hr>
            
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid black;">
                        <th style="text-align: left;">Tên món</th>
                        <th>SL</th>
                        <th style="text-align: right;">Đơn giá</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="mon in chiTiet" :key="mon.id">
                        <td>{{ mon.ten_sp_luc_mua }}</td>
                        <td style="text-align: center;">{{ mon.so_luong }}</td>
                        <td style="text-align: right;">{{ Number(mon.don_gia).toLocaleString('vi-VN') }}</td>
                    </tr>
                </tbody>
            </table>
            
            <hr>
            <h2 style="text-align: right; color: red;">Tổng cộng: {{ Number(hoaDon.tong_tien).toLocaleString('vi-VN') }} đ</h2>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button @click="inHoaDon" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">🖨️ In Hóa Đơn</button>
            <button @click="router.push('/')" style="margin-left: 10px;">Về trang chủ</button>
        </div>
    </div>
</template>

<style scoped>
.khung-hoa-don { border: 1px solid #333; padding: 40px; max-width: 600px; margin: 0 auto; background: white; }
@media print {
    .no-print { display: none; }
    .khung-hoa-don { border: none; }
}
</style>