<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';

const props = defineProps({ productToEdit: Object });
const emit = defineEmits(['saved', 'cancel']);

const formData = ref({ name: '', price: '', so_luong: 100, description: '' }); // Thêm so_luong mặc định
const fileInput = ref(null);
const previewImage = ref(null);
const isSubmitting = ref(false);

// --- 1. KHAI BÁO HÀM RESET FORM TRƯỚC (Đưa lên đây) ---
const resetForm = () => {
  formData.value = { name: '', price: '', so_luong: 100, description: '' };
  fileInput.value = null;
  previewImage.value = null;
  // Reset input file nếu có
  const inputElement = document.getElementById('fileUpload');
  if(inputElement) inputElement.value = "";
};

const handleFile = (e) => {
  const file = e.target.files[0];
  fileInput.value = file;
  if (file) previewImage.value = URL.createObjectURL(file);
};

// --- 2. SAU ĐÓ MỚI GỌI WATCH ---
watch(() => props.productToEdit, (newVal) => {
  if (newVal) {
    formData.value = { 
      name: newVal.ten_sp,
      price: newVal.gia,
      so_luong: newVal.so_luong,
      description: newVal.mo_ta
    };
    // Fix lỗi ảnh placeholder ở đây luôn nếu cần
    previewImage.value = newVal.hinh_anh ? `http://localhost:3000${newVal.hinh_anh}` : null;
  } else {
    resetForm(); // Bây giờ gọi hàm này sẽ không bị lỗi nữa
  }
}, { immediate: true });

const submitForm = async () => {
  if (!formData.value.name || !formData.value.price) return alert("Nhập đủ tên và giá!");
  isSubmitting.value = true;

  try {
    const data = new FormData();
    data.append('ten_sp', formData.value.name);
    data.append('gia', formData.value.price);
    data.append('so_luong', formData.value.so_luong);
    data.append('mo_ta', formData.value.description || '');
    if (fileInput.value) data.append('hinh_anh', fileInput.value);

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
    alert('Lỗi server!');
  } finally {
    isSubmitting.value = false;
  }
};
</script>