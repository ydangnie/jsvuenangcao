<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

// Định nghĩa URL backend
const API_URL = 'http://localhost:3000';

const products = ref([]);
const page = ref(1);
const totalPages = ref(1);
const router = useRouter();

const fetchData = async (p = 1) => {
  try {
    const res = await axios.get(`${API_URL}/api/san-pham?page=${p}`);
    products.value = res.data.danh_sach;
    page.value = res.data.phan_trang.trang;
    totalPages.value = res.data.phan_trang.tong_trang;
  } catch (e) { console.error(e); }
};

const addToCart = (sp) => {
  const tonKho = sp.so_luong !== undefined ? sp.so_luong : 0;
  if (tonKho <= 0) return alert('Sản phẩm đã hết hàng!');

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const exist = cart.find(x => x.id === sp.id);

  // SỬA: Lấy ảnh đại diện để lưu vào giỏ hàng
  const imgCart = sp.hinh_anh_dai_dien ? sp.hinh_anh_dai_dien : '';

  if (exist) {
    if (exist.so_luong_mua >= tonKho) return alert('Kho không đủ hàng!');
    exist.so_luong_mua++;
  } else {
    // Lưu thêm trường hinh_anh vào giỏ để hiển thị bên trang Cart
    cart.push({ ...sp, so_luong_mua: 1, hinh_anh: imgCart });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`Đã thêm ${sp.ten_sp} vào giỏ!`);
};

onMounted(() => fetchData(1));
</script>

<template>
  <div class="shop-container">
    <div class="banner">
      <h1>🛍️ AZALMAN STORE</h1>
      <div class="actions">
        <button @click="router.push('/admin')" class="btn-admin">⚙️ Quản Lý</button>
        <button @click="router.push('/gio-hang')" class="btn-cart">🛒 Giỏ Hàng</button>
      </div>
    </div>

    <div class="product-grid">
      <div v-for="sp in products" :key="sp.id" class="product-card">
        <div class="image-box" @click="router.push(`/product/${sp.id}`)">
          <span v-if="sp.so_luong <= 0" class="badge-out">HẾT HÀNG</span>
          <span v-else class="badge-stock">Kho: {{ sp.so_luong }}</span>

          <img :src="sp.hinh_anh_dai_dien ? `${API_URL}${sp.hinh_anh_dai_dien}` : 'https://placehold.co/300'" />
        </div>
        
        <div class="details">
          <h3 @click="router.push(`/product/${sp.id}`)">{{ sp.ten_sp }}</h3>
          <p class="price">{{ Number(sp.gia).toLocaleString('vi-VN') }} đ</p>
          <div class="buttons">
            <button @click="router.push(`/product/${sp.id}`)" class="btn-view">👁️ Chi Tiết</button>
            <button @click="addToCart(sp)" :disabled="sp.so_luong <= 0" class="btn-buy">
              {{ sp.so_luong > 0 ? '➕ Thêm' : 'Đã hết' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button @click="fetchData(page - 1)" :disabled="page === 1">«</button>
      <span v-for="p in totalPages" :key="p">
        <button @click="fetchData(p)" :class="{ active: page === p }">{{ p }}</button>
      </span>
      <button @click="fetchData(page + 1)" :disabled="page === totalPages">»</button>
    </div>
  </div>
</template>

<style scoped>
/* CSS như cũ, có chỉnh nhẹ cho đẹp */
.shop-container { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
.banner { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; }
.banner h1 { color: #2c3e50; margin: 0; font-weight: 800; }
.btn-cart, .btn-admin { padding: 10px 20px; border: none; border-radius: 20px; cursor: pointer; font-weight: bold; margin-left: 10px; transition: 0.2s; }
.btn-cart { background: #e67e22; color: white; }
.btn-cart:hover { background: #d35400; }
.btn-admin { background: #34495e; color: white; }
.btn-admin:hover { background: #2c3e50; }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
.product-card { background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; transition: transform 0.2s; border: 1px solid #eee; display: flex; flex-direction: column; }
.product-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }

.image-box { position: relative; height: 250px; overflow: hidden; cursor: pointer; }
.image-box img { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
.image-box:hover img { transform: scale(1.05); }

.badge-stock { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
.badge-out { position: absolute; top: 10px; right: 10px; background: #e74c3c; color: white; padding: 4px 8px; font-weight: bold; border-radius: 4px; font-size: 11px; }

.details { padding: 15px; display: flex; flex-direction: column; flex-grow: 1; }
.details h3 { font-size: 18px; margin: 0 0 5px; color: #2c3e50; cursor: pointer; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 48px; }
.details h3:hover { color: #3498db; }
.price { color: #d35400; font-size: 20px; font-weight: bold; margin-bottom: 15px; }

.buttons { margin-top: auto; display: flex; gap: 8px; }
.btn-view { background: #ecf0f1; color: #2c3e50; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600; flex: 1; }
.btn-view:hover { background: #bdc3c7; }
.btn-buy { background: #27ae60; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600; flex: 1; }
.btn-buy:hover:not(:disabled) { background: #219150; }
.btn-buy:disabled { background: #95a5a6; cursor: not-allowed; }

.pagination { margin-top: 40px; text-align: center; display: flex; justify-content: center; gap: 5px; }
.pagination button { width: 35px; height: 35px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px; transition: 0.2s; }
.pagination button.active { background: #34495e; color: white; border-color: #34495e; }
.pagination button:hover:not(:disabled) { background: #eee; }
</style>