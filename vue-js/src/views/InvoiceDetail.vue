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
        
        // SỬA LẠI ĐÚNG TÊN TRƯỜNG TỪ API
        hoaDon.value = kq.data.thong_tin; 
        chiTiet.value = kq.data.chi_tiet; 
    } catch (e) {
        console.error(e);
        alert('Không tìm thấy hóa đơn');
        router.push('/');
    }
});

const inHoaDon = () => window.print();
</script>

<template>
    <div class="container" v-if="hoaDon">
        <div class="khung-hoa-don">
            <div class="header">
                <h1>AZALMAN STORE</h1>
                <h3>HÓA ĐƠN BÁN LẺ</h3>
            </div>
            
            <div class="info">
                <p><strong>Mã hóa đơn:</strong> #{{ hoaDon.id }}</p>
                <p><strong>Khách hàng:</strong> {{ hoaDon.ten_khach_hang }}</p>
                <p><strong>Ngày lập:</strong> {{ new Date(hoaDon.ngay_tao).toLocaleString('vi-VN') }}</p>
            </div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th style="text-align: left;">Tên món</th>
                        <th style="text-align: center;">SL</th>
                        <th style="text-align: right;">Đơn giá</th>
                        <th style="text-align: right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="mon in chiTiet" :key="mon.id">
                        <td>{{ mon.ten_sp_luc_mua }}</td>
                        <td style="text-align: center;">{{ mon.so_luong_mua }}</td>
                        <td style="text-align: right;">{{ Number(mon.don_gia).toLocaleString('vi-VN') }}</td>
                        <td style="text-align: right;">{{ (Number(mon.don_gia) * mon.so_luong_mua).toLocaleString('vi-VN') }}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="total">
                <h2>Tổng cộng: {{ Number(hoaDon.tong_tien).toLocaleString('vi-VN') }} đ</h2>
            </div>
            
            <p style="text-align: center; margin-top: 40px; font-style: italic;">Cảm ơn quý khách đã mua hàng!</p>
        </div>

        <div class="no-print actions">
            <button @click="inHoaDon" class="btn-print">🖨️ In Hóa Đơn</button>
            <button @click="router.push('/')" class="btn-home">Về trang chủ</button>
        </div>
    </div>
</template>

<style scoped>
.container { padding: 20px; font-family: 'Times New Roman', sans-serif; }
.khung-hoa-don { border: 1px solid #ddd; padding: 40px; max-width: 700px; margin: 0 auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
.header { text-align: center; margin-bottom: 30px; }
.header h1 { margin: 0; color: #333; }
.header h3 { margin: 5px 0 0; color: #555; }

.invoice-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.invoice-table th { border-bottom: 2px solid #333; padding: 10px 0; }
.invoice-table td { border-bottom: 1px solid #eee; padding: 10px 0; }

.total { text-align: right; margin-top: 20px; color: #e74c3c; }

.actions { text-align: center; margin-top: 30px; }
.btn-print { padding: 10px 25px; background: #333; color: white; border: none; cursor: pointer; font-size: 16px; border-radius: 5px; }
.btn-home { padding: 10px 25px; background: #eee; color: #333; border: none; cursor: pointer; font-size: 16px; margin-left: 10px; border-radius: 5px; }

@media print {
    .no-print { display: none; }
    .khung-hoa-don { border: none; box-shadow: none; padding: 0; }
    body { background: white; }
}
</style>