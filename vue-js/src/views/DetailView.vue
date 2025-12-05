<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const sp = ref(null);
const soLuongMua = ref(1);

onMounted(async () => {
    try {
        const res = await axios.get(`http://localhost:3000/api/san-pham/${route.params.id}`);
        sp.value = res.data;
    } catch { router.push('/'); }
});

const muaNgay = () => {
    if (soLuongMua.value > sp.value.so_luong) return alert('Số lượng tồn kho không đủ!');
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    // Logic thêm vào giỏ (có cộng dồn)
    const exist = cart.find(x => x.id === sp.value.id);
    if (exist) {
        exist.so_luong_mua += soLuongMua.value;
    } else {
        cart.push({ ...sp.value, so_luong_mua: soLuongMua.value });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/gio-hang');
};
</script>

<template>
  <div class="container" v-if="sp">
    <button @click="router.push('/')" class="back-btn">← Quay lại shop</button>
    
    <div class="detail-card">
        <div class="img-col">
            <img :src="sp.hinh_anh ? `http://localhost:3000${sp.hinh_anh}` : 'https://via.placeholder.com/400'" />
        </div>
        <div class="info-col">
            <h1>{{ sp.ten_sp }}</h1>
            <p class="price">{{ Number(sp.gia).toLocaleString('vi-VN') }} đ</p>
            <div class="stock-status">
                Tình trạng: 
                <strong :style="{color: sp.so_luong > 0 ? 'green' : 'red'}">
                    {{ sp.so_luong > 0 ? `Còn hàng (${sp.so_luong})` : 'Hết hàng' }}
                </strong>
            </div>
            <p class="desc">{{ sp.mo_ta }}</p>
            
            <div class="actions" v-if="sp.so_luong > 0">
                <input type="number" v-model="soLuongMua" min="1" :max="sp.so_luong" class="qty-input" />
                <button @click="muaNgay" class="add-btn">Thêm Vào Giỏ</button>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 1000px; margin: 40px auto; font-family: sans-serif; }
.detail-card { display: flex; gap: 40px; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.img-col img { width: 400px; border-radius: 10px; }
.info-col h1 { margin-top: 0; font-size: 28px; }
.price { font-size: 24px; color: #e74c3c; font-weight: bold; }
.qty-input { padding: 10px; font-size: 16px; width: 60px; border: 1px solid #ddd; border-radius: 5px; margin-right: 10px; }
.add-btn { padding: 10px 30px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
.add-btn:hover { background: #555; }
.back-btn { background: none; border: none; font-size: 16px; cursor: pointer; margin-bottom: 20px; }
</style>