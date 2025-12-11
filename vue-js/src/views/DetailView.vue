<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const API_URL = 'http://localhost:3000';
const route = useRoute();
const router = useRouter();
const sp = ref(null);
const mainImg = ref('');
const qty = ref(1);

onMounted(async () => {
    try {
        const res = await axios.get(`${API_URL}/api/san-pham/${route.params.id}`);
        sp.value = res.data;
        if(sp.value.danh_sach_anh?.length) mainImg.value = sp.value.danh_sach_anh[0].duong_dan;
    } catch { router.push('/'); }
});

const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const exist = cart.find(x => x.id === sp.value.id);
    if(exist) exist.so_luong_mua += qty.value;
    else cart.push({ ...sp.value, so_luong_mua: qty.value, hinh_anh: mainImg.value }); // Lưu ảnh đại diện vào giỏ
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/gio-hang');
};
</script>

<template>
<div class="container" v-if="sp">
    <button @click="router.push('/')">← Quay lại</button>
    <div class="detail-box">
        <div class="left">
            <img :src="mainImg ? `${API_URL}${mainImg}` : 'https://placehold.co/400'" class="main-pic" />
            <div class="thumbs">
                <img v-for="img in sp.danh_sach_anh" :key="img.id" :src="`${API_URL}${img.duong_dan}`" 
                     @click="mainImg = img.duong_dan" :class="{active: mainImg === img.duong_dan}"/>
            </div>
        </div>
        <div class="right">
            <h1>{{ sp.ten_sp }}</h1>
            <h2 class="price">{{ Number(sp.gia).toLocaleString() }} đ</h2>
            <p>Kho: <strong>{{ sp.so_luong }}</strong></p>
            <p>{{ sp.mo_ta }}</p>
            <div v-if="sp.so_luong > 0">
                <input type="number" v-model="qty" min="1" :max="sp.so_luong" style="width: 50px; padding: 5px;" />
                <button @click="addToCart" class="buy-btn">Thêm vào giỏ</button>
            </div>
            <p v-else style="color: red; font-weight: bold;">HẾT HÀNG</p>
        </div>
    </div>
</div>
</template>

<style scoped>
.container { max-width: 900px; margin: 20px auto; font-family: sans-serif; }
.detail-box { display: flex; gap: 30px; margin-top: 20px; }
.left { width: 400px; }
.main-pic { width: 100%; height: 300px; object-fit: contain; border: 1px solid #eee; }
.thumbs { display: flex; gap: 5px; margin-top: 10px; overflow-x: auto; }
.thumbs img { width: 60px; height: 60px; object-fit: cover; cursor: pointer; border: 2px solid transparent; }
.thumbs img.active { border-color: orange; }
.right { flex: 1; }
.price { color: #d35400; }
.buy-btn { background: #27ae60; color: white; border: none; padding: 10px 20px; cursor: pointer; margin-left: 10px; }
</style>