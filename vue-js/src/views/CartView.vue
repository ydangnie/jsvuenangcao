<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const gioHang = ref([]);
const router = useRouter();

// Thông tin khách hàng
const tenKhachHang = ref('');
const diaChi = ref('');
const sdt = ref('');

onMounted(() => {
    gioHang.value = JSON.parse(localStorage.getItem('cart')) || [];
});

const xoaKhoiGio = (index) => {
    gioHang.value.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(gioHang.value));
};

const tongTien = computed(() => {
    return gioHang.value.reduce((tong, sp) => tong + Number(sp.gia) * sp.so_luong_mua, 0);
});

const thanhToan = async () => {
    if (gioHang.value.length === 0) return alert('Giỏ hàng trống!');
    if (!tenKhachHang.value || !sdt.value) return alert('Vui lòng nhập tên và số điện thoại!');

    try {
        // [FIX] Gửi tách riêng sdt và dia_chi để backend lưu vào cột tương ứng
        const data = {
            khach_hang: tenKhachHang.value, // Chỉ lưu tên người mua
            sdt: sdt.value,                 // Lưu số điện thoại riêng
            dia_chi: diaChi.value,          // Lưu địa chỉ riêng
            tong_tien: tongTien.value,
            gio_hang: gioHang.value 
        };

        const res = await axios.post('http://localhost:3000/api/thanh-toan', data);
        
        alert('Thanh toán thành công!');
        localStorage.removeItem('cart');
        router.push(`/hoa-don/${res.data.id_hoa_don}`);
    } catch (e) {
        console.error(e);
        alert('Lỗi thanh toán: ' + (e.response?.data?.msg || 'Lỗi server'));
    }
};
</script>

<template>
    <div class="container">
        <div class="cart-header">
            <h1>Giỏ Hàng Của Bạn</h1>
            <button @click="router.push('/')" class="btn-back">← Tiếp tục mua sắm</button>
        </div>
        
        <div v-if="gioHang.length > 0" class="cart-layout">
            <div class="cart-items">
                <table class="cart-table">
                    <thead>
                        <tr>
                            <th>Sản Phẩm</th>
                            <th>SL</th>
                            <th>Giá</th>
                            <th>Thành tiền</th>
                            <th>Xóa</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(sp, index) in gioHang" :key="index">
                            <td>{{ sp.ten_sp }}</td>
                            <td class="text-center">{{ sp.so_luong_mua }}</td>
                            <td>{{ Number(sp.gia).toLocaleString('vi-VN') }} đ</td>
                            <td style="font-weight: bold;">{{ (Number(sp.gia) * sp.so_luong_mua).toLocaleString('vi-VN') }} đ</td>
                            <td class="text-center"><button @click="xoaKhoiGio(index)" class="btn-del">×</button></td>
                        </tr>
                    </tbody>
                </table>
                <div class="total-row">
                    <h3>Tổng tiền: <span class="price-text">{{ tongTien.toLocaleString('vi-VN') }} đ</span></h3>
                </div>
            </div>

            <div class="checkout-form">
                <h3>Thông Tin Giao Hàng</h3>
                <div class="form-group">
                    <label>Họ và tên (*):</label>
                    <input v-model="tenKhachHang" type="text" placeholder="Nhập tên của bạn..." />
                </div>
                <div class="form-group">
                    <label>Số điện thoại (*):</label>
                    <input v-model="sdt" type="text" placeholder="Nhập SĐT..." />
                </div>
                <div class="form-group">
                    <label>Địa chỉ nhận hàng:</label>
                    <textarea v-model="diaChi" rows="3" placeholder="Số nhà, đường, phường..."></textarea>
                </div>
                <button @click="thanhToan" class="btn-checkout">XÁC NHẬN ĐẶT HÀNG</button>
            </div>
        </div>

        <h3 v-else style="text-align: center; margin-top: 50px; color: #777;">Giỏ hàng đang trống</h3>
    </div>
</template>

<style scoped>
.container { max-width: 1100px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
.cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-back { background: none; border: 1px solid #333; padding: 5px 15px; cursor: pointer; border-radius: 4px; }

.cart-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }

/* Bảng giỏ hàng */
.cart-table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.cart-table th, .cart-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
.cart-table th { background: #f8f9fa; }
.text-center { text-align: center !important; }
.btn-del { background: #e74c3c; color: white; border: none; width: 25px; height: 25px; border-radius: 50%; cursor: pointer; }

/* Form thanh toán */
.checkout-form { background: #f9f9f9; padding: 20px; border-radius: 10px; height: fit-content; }
.checkout-form h3 { margin-top: 0; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
.form-group input, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }

.btn-checkout { width: 100%; padding: 15px; background: #27ae60; color: white; border: none; font-size: 16px; font-weight: bold; cursor: pointer; border-radius: 5px; margin-top: 10px; transition: 0.3s; }
.btn-checkout:hover { background: #219150; }

.total-row { text-align: right; margin-top: 15px; }
.price-text { color: #e67e22; font-size: 24px; }
</style>