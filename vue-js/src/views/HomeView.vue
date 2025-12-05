<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const products = ref([]);
const page = ref(1);
const totalPages = ref(1);
const router = useRouter();

const fetchData = async (p = 1) => {
  try {
    // Gọi API lấy danh sách sản phẩm
    const res = await axios.get(`http://localhost:3000/api/san-pham?page=${p}`);
    products.value = res.data.danh_sach;
    page.value = res.data.phan_trang.trang;
    totalPages.value = res.data.phan_trang.tong_trang;
  } catch (e) { console.error(e); }
};

const addToCart = (sp) => {
  const tonKho = sp.so_luong !== undefined ? sp.so_luong : 100;
  if (tonKho <= 0) return alert('Sản phẩm đã hết hàng!');

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const exist = cart.find(x => x.id === sp.id);

  if (exist) {
    if (exist.so_luong_mua >= tonKho) return alert('Kho không đủ hàng!');
    exist.so_luong_mua++;
  } else {
    cart.push({ ...sp, so_luong_mua: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`Đã thêm ${sp.ten_sp} vào giỏ!`);
};

onMounted(() => fetchData(1));
</script>

<template>
  <div class="shop-container">
    <div class="banner">
      <h1>AZALMAN STORE</h1>
      <div class="actions">
        <button @click="router.push('/admin')" class="btn-admin">⚙️ Trang Quản Lý</button>
        <button @click="router.push('/gio-hang')" class="btn-cart">🛒 Giỏ Hàng</button>
      </div>
    </div>

    <div class="product-grid">
      <div v-for="sp in products" :key="sp.id" class="product-card">
        <div class="image-box">
          <span v-if="sp.so_luong == 0" class="badge-out">HẾT HÀNG</span>
          <span v-else class="badge-stock">Kho: {{ sp.so_luong }}</span>

          <img :src="sp.hinh_anh ? `http://localhost:3000${sp.hinh_anh}` : 'https://placehold.co/300'" />
        </div>
        <div class="details">
          <h3>{{ sp.ten_sp }}</h3>
          <p class="price">{{ Number(sp.gia).toLocaleString('vi-VN') }} đ</p>
          <div class="buttons">
            <button @click="router.push(`/product/${sp.id}`)" class="btn-view">Chi Tiết</button>
            <button @click="addToCart(sp)" :disabled="sp.so_luong <= 0" class="btn-buy">
              {{ sp.so_luong > 0 ? 'Thêm vào giỏ' : 'Hết hàng' }}
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
/* Giữ nguyên CSS của bạn */
.shop-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
}

.banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
  padding-bottom: 20px;
}

.banner h1 {
  color: #333;
  font-weight: 800;
  letter-spacing: 1px;
}

.btn-cart,
.btn-admin {
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  margin-left: 10px;
  transition: 0.3s;
}

.btn-cart {
  background: #333;
  color: white;
}

.btn-admin {
  background: #f1f1f1;
  color: #333;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.image-box {
  position: relative;
  height: 250px;
  overflow: hidden;
}

.image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-stock {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge-out {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e74c3c;
  color: white;
  padding: 4px 8px;
  font-weight: bold;
  border-radius: 4px;
  font-size: 12px;
}

.details {
  padding: 20px;
  text-align: center;
}

.details h3 {
  font-size: 18px;
  margin: 0 0 10px;
  color: #2c3e50;
  height: 44px;
  overflow: hidden;
}

.price {
  color: #e67e22;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
}

.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-view {
  background: #fff;
  border: 1px solid #333;
  color: #333;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
}

.btn-buy {
  background: #27ae60;
  border: none;
  color: white;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  flex-grow: 1;
}

.btn-buy:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.pagination {
  margin-top: 40px;
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 5px;
}

.pagination button {
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 50%;
  transition: 0.2s;
}

.pagination button.active {
  background: #333;
  color: white;
  border-color: #333;
}

.pagination button:hover:not(:disabled) {
  background: #eee;
}
</style>