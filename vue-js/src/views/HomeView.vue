<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import ProductForm from '../components/ProductForm.vue';
import { useRouter } from 'vue-router';

const products = ref([]);
const productToEdit = ref(null);
const router = useRouter();

const fetchProducts = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/products');
    products.value = res.data;
  } catch (err) { console.error(err); }
};

const deleteProduct = async (id) => {
  if (!confirm('Bạn chắc chắn xóa?')) return;
  await axios.delete(`http://localhost:3000/api/products/${id}`);
  fetchProducts();
};

const editProduct = (p) => {
  productToEdit.value = p;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(fetchProducts);
</script>

<template>
  <div class="container">
    <ProductForm 
      :productToEdit="productToEdit" 
      @saved="() => { fetchProducts(); productToEdit = null; }"
      @cancel="productToEdit = null"
    />

    <div class="grid">
      <div v-for="p in products" :key="p.id" class="card">
        <img :src="p.image_url ? `http://localhost:3000${p.image_url}` : 'https://via.placeholder.com/300'" class="card-img" />
        <div class="card-body">
          <h3>{{ p.name }}</h3>
          <p style="color: red; font-weight: bold;">{{ Number(p.price).toLocaleString('vi-VN') }} đ</p>
          <button @click="router.push(`/product/${p.id}`)" class="btn btn-primary">Xem</button>
          <button @click="editProduct(p)" class="btn btn-success" style="background-color: #f39c12;">Sửa</button>
          <button @click="deleteProduct(p.id)" class="btn btn-danger">Xóa</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
.card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.card-img { width: 100%; height: 200px; object-fit: cover; }
.card-body { padding: 15px; text-align: center; }
</style>