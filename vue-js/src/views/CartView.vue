<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const gioHang = ref([]);
const router = useRouter();


onMounted(() => {
    gioHang.value = JSON.parse(localStorage.getItem('gio_hang')) || [];
});

const xoaKhoiGio = (index) => {
    gioHang.value.splice(index, 1);
    localStorage.setItem('gio_hang', JSON.stringify(gioHang.value));
};

const tongTien = computed(() => {
    return gioHang.value.reduce((tong, sp) => tong + Number(sp.gia), 0);
});

const thanhToan = async () => {
    if (gioHang.value.length === 0) return alert('Giỏ hàng trống!');

    try {
        // Gửi danh sách giỏ hàng về backend để lưu hóa đơn VÀ trừ kho
        const data = {
            khach_hang: 'Khách Online', 
            tong_tien: tongTien.value,
            gio_hang: gioHang.value // Backend sẽ dùng mảng này để trừ số lượng
        };

        const res = await axios.post('http://localhost:3000/api/thanh-toan', data);
        
        alert('Thanh toán thành công! Đã trừ kho.');
        localStorage.removeItem('cart'); // Xóa giỏ hàng
        router.push(`/hoa-don/${res.data.id_hoa_don}`);
    } catch (e) {
        console.error(e);
        alert('Lỗi thanh toán (có thể hết hàng)');
    }
};
</script>

<template>
    <div class="container">
        <h1>Giỏ Hàng Của Bạn</h1>
        <button @click="router.push('/')">← Tiếp tục mua sắm</button>
        
        <table v-if="gioHang.length > 0" border="1" style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr>
                <th>Tên Sản Phẩm</th>
                <th>Giá</th>
                <th>Thao tác</th>
            </tr>
            <tr v-for="(sp, index) in gioHang" :key="index">
                <td>{{ sp.ten_sp }}</td>
                <td>{{ Number(sp.gia).toLocaleString('vi-VN') }} đ</td>
                <td><button @click="xoaKhoiGio(index)" style="color: red;">Xóa</button></td>
            </tr>
        </table>
        <h3 v-else>Giỏ hàng đang trống</h3>

        <div v-if="gioHang.length > 0" style="margin-top: 20px; text-align: right;">
            <h2>Tổng tiền: {{ tongTien.toLocaleString('vi-VN') }} đ</h2>
            <button @click="thanhToan" style="padding: 10px 20px; background: orange; color: white; border: none; cursor: pointer;">THANH TOÁN NGAY</button>
        </div>
    </div>
</template>