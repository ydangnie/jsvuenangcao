<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';

const props = defineProps({ productToEdit: Object });
const emit = defineEmits(['saved', 'cancel']);

const formData = ref({ name: '', price: '', description: '' });
const fileInput = ref(null);
const previewImage = ref(null);
const isSubmitting = ref(false);

// Tự động điền dữ liệu khi bấm Sửa
watch(() => props.productToEdit, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal };
    previewImage.value = newVal.image_url ? `http://localhost:3000${newVal.image_url}` : null;
  } else {
    resetForm();
  }
}, { immediate: true });

const handleFile = (e) => {
  const file = e.target.files[0];
  fileInput.value = file;
  if (file) previewImage.value = URL.createObjectURL(file);
};

const resetForm = () => {
  formData.value = { name: '', price: '', description: '' };
  fileInput.value = null;
  previewImage.value = null;
  if(document.getElementById('fileUpload')) document.getElementById('fileUpload').value = "";
};

const submitForm = async () => {
  if (!formData.value.name || !formData.value.price) return alert("Nhập đủ tên và giá!");
  isSubmitting.value = true;

  try {
    const data = new FormData();
    data.append('name', formData.value.name);
    data.append('price', formData.value.price);
    data.append('description', formData.value.description || '');
    if (fileInput.value) data.append('image', fileInput.value);

    if (props.productToEdit) {
      await axios.put(`http://localhost:3000/api/products/${props.productToEdit.id}`, data);
      alert('Đã cập nhật!');
    } else {
      await axios.post('http://localhost:3000/api/products', data);
      alert('Đã thêm mới!');
    }
    emit('saved');
    resetForm();
  } catch (error) {
    console.error(error);
    alert('Lỗi server!');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="form-card">
    <h2>{{ props.productToEdit ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới' }}</h2>
    <form @submit.prevent="submitForm">
      <input v-model="formData.name" class="form-control" placeholder="Tên sản phẩm" />
      <input v-model="formData.price" type="number" class="form-control" placeholder="Giá bán" />
      <textarea v-model="formData.description" class="form-control" placeholder="Mô tả"></textarea>
      
      <label>Chọn ảnh:</label>
      <input type="file" id="fileUpload" @change="handleFile" class="form-control" accept="image/*" />
      <div v-if="previewImage">
        <img :src="previewImage" class="preview" />
      </div>

      <div style="margin-top: 10px;">
        <button type="submit" class="btn btn-success" :disabled="isSubmitting">
          {{ isSubmitting ? 'Đang lưu...' : 'Lưu Dữ Liệu' }}
        </button>
        <button v-if="props.productToEdit" type="button" class="btn btn-danger" @click="$emit('cancel')">Hủy</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
</style>