<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const product = ref(null);

onMounted(async () => {
  try {
    const res = await axios.get(`http://localhost:3000/api/products/${route.params.id}`);
    product.value = res.data;
  } catch {
    alert('Sản phẩm không tồn tại');
    router.push('/');
  }
});
</script>

<template>
  <div class="container" v-if="product">
    <button @click="router.push('/')" class="btn btn-primary">← Quay lại</button>
    <div class="detail-box">
      <img :src="product.image_url ? `http://localhost:3000${product.image_url}` : 'https://via.placeholder.com/400'" />
      <div class="info">
        <h1>{{ product.name }}</h1>
        <p class="price">{{ Number(product.price).toLocaleString('vi-VN') }} đ</p>
        <p>{{ product.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-box { display: flex; gap: 30px; margin-top: 20px; background: white; padding: 30px; border-radius: 8px; }
.detail-box img { max-width: 400px; border-radius: 8px; }
.price { font-size: 24px; color: red; font-weight: bold; }
</style>