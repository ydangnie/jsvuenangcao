<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';

const props = defineProps({ productToEdit: Object });
const emit = defineEmits(['saved', 'cancel']);

// SỬA: Đổi tên biến state cho khớp với database để dễ quản lý
const formData = ref({ ten_sp: '', gia: '', mo_ta: '', so_luong: 100 });
const fileInput = ref(null);
const previewImage = ref(null);
const isSubmitting = ref(false);

const resetForm = () => {
  formData.value = { ten_sp: '', gia: '', mo_ta: '', so_luong: 100 };
  fileInput.value = null;
  previewImage.value = null;
  if(document.getElementById('fileUpload')) document.getElementById('fileUpload').value = "";
};

const handleFile = (e) => {
  const file = e.target.files[0];
  fileInput.value = file;
  if (file) previewImage.value = URL.createObjectURL(file);
};

watch(() => props.productToEdit, (newVal) => {
  if (newVal) {
    // SỬA: Map dữ liệu từ props vào form
    formData.value = { 
        ten_sp: newVal.ten_sp,
        gia: newVal.gia,
        mo_ta: newVal.mo_ta,
        so_luong: newVal.so_luong
    };
    previewImage.value = newVal.hinh_anh ? `http://localhost:3000${newVal.hinh_anh}` : null;
  } else {
    resetForm();
  }
}, { immediate: true });

const submitForm = async () => {
  if (!formData.value.ten_sp || !formData.value.gia) return alert("Nhập đủ tên và giá!");
  isSubmitting.value = true;

  try {
    const data = new FormData();
    // SỬA: Key append vào phải khớp với req.body trong app.js
    data.append('ten_sp', formData.value.ten_sp);
    data.append('gia', formData.value.gia);
    data.append('so_luong', formData.value.so_luong || 0); // Thêm số lượng nếu cần
    data.append('mo_ta', formData.value.mo_ta || '');
    
    // SỬA: Key file phải là 'hinh_anh' khớp với upload.single('hinh_anh')
    if (fileInput.value) data.append('hinh_anh', fileInput.value);

    // SỬA: Đường dẫn API phải là /api/san-pham
    if (props.productToEdit) {
      await axios.put(`http://localhost:3000/api/san-pham/${props.productToEdit.id}`, data);
      alert('Đã cập nhật!');
    } else {
      await axios.post('http://localhost:3000/api/san-pham', data);
      alert('Đã thêm mới!');
    }
    emit('saved');
    resetForm();
  } catch (error) {
    console.error(error);
    alert('Lỗi server: ' + (error.response?.data?.message || error.message));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="form-card">
    <h2>{{ productToEdit ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới' }}</h2>
    <form @submit.prevent="submitForm" class="form-layout">
      <div class="form-group">
        <label>Tên sản phẩm:</label>
        <input v-model="formData.ten_sp" type="text" placeholder="Nhập tên..." />
      </div>

      <div class="form-group">
        <label>Giá (VNĐ):</label>
        <input v-model="formData.gia" type="number" placeholder="Nhập giá..." />
      </div>

      <div class="form-group">
        <label>Số lượng kho:</label>
        <input v-model="formData.so_luong" type="number" placeholder="Số lượng..." />
      </div>

      <div class="form-group">
        <label>Mô tả:</label>
        <textarea v-model="formData.mo_ta" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label>Hình ảnh:</label>
        <input type="file" @change="handleFile" id="fileUpload" />
        <img v-if="previewImage" :src="previewImage" class="preview" />
      </div>

     <div class="actions">
        <button type="submit" :disabled="isSubmitting" class="btn-save">
          {{ isSubmitting ? 'Đang lưu...' : 'Lưu Sản Phẩm' }}
        </button>
        
        <button type="button" @click="$emit('cancel')" class="btn-cancel">
            Hủy
        </button>
    </div>
  </form>
  </div>
</template>

<style scoped>
/* CSS giữ nguyên hoặc tùy chỉnh nhẹ */
.form-card { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.form-layout { display: grid; gap: 15px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group input, .form-group textarea { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
.preview { margin-top: 10px; height: 100px; object-fit: contain; border: 1px dashed #ccc; }
.actions { display: flex; gap: 10px; margin-top: 10px; }
.btn-save { background: #27ae60; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
.btn-cancel { background: #95a5a6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
</style>