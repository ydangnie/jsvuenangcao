<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';

const props = defineProps({ productToEdit: Object });
const emit = defineEmits(['saved', 'cancel']);

const formData = ref({ name: '', price: '', description: '' });
const fileInput = ref(null);
const previewImage = ref(null);
const isSubmitting = ref(false);

// --- 1. KHAI BÁO HÀM RESET FORM TRƯỚC ---
const resetForm = () => {
  formData.value = { name: '', price: '', description: '' };
  fileInput.value = null;
  previewImage.value = null;
  if(document.getElementById('fileUpload')) document.getElementById('fileUpload').value = "";
};

const handleFile = (e) => {
  const file = e.target.files[0];
  fileInput.value = file;
  if (file) previewImage.value = URL.createObjectURL(file);
};

// --- 2. SAU ĐÓ MỚI GỌI WATCH ---
watch(() => props.productToEdit, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal };
    // Sửa luôn lỗi ảnh ở đây
    previewImage.value = newVal.image_url ? `http://localhost:3000${newVal.image_url}` : null;
  } else {
    resetForm(); // Bây giờ gọi hàm này sẽ không bị lỗi nữa
  }
}, { immediate: true });

const submitForm = async () => {
  // ... (giữ nguyên phần submit)
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