<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';

const props = defineProps({ productToEdit: Object });
const emit = defineEmits(['saved', 'cancel']);
const API_URL = 'http://localhost:3000';

const formData = ref({ ten_sp: '', gia: '', mo_ta: '', so_luong: 100 });
const newFiles = ref([]);
const newPreviews = ref([]);
const existingImages = ref([]);
const deletedImageIds = ref([]);
const isSubmitting = ref(false);

const resetForm = () => {
    formData.value = { ten_sp: '', gia: '', mo_ta: '', so_luong: 100 };
    newFiles.value = []; newPreviews.value = []; existingImages.value = []; deletedImageIds.value = [];
    if(document.getElementById('fileUpload')) document.getElementById('fileUpload').value = "";
};

const handleFile = (e) => {
    const files = Array.from(e.target.files);
    newFiles.value.push(...files);
    newPreviews.value.push(...files.map(f => URL.createObjectURL(f)));
};

const removeNew = (i) => { newFiles.value.splice(i, 1); URL.revokeObjectURL(newPreviews.value[i]); newPreviews.value.splice(i, 1); };
const removeOld = (id, i) => { existingImages.value.splice(i, 1); deletedImageIds.value.push(id); };

watch(() => props.productToEdit, (val) => {
    resetForm();
    if (val) {
        formData.value = { ten_sp: val.ten_sp, gia: val.gia, mo_ta: val.mo_ta, so_luong: val.so_luong };
        if (val.danh_sach_anh) existingImages.value = [...val.danh_sach_anh];
    }
}, { immediate: true });

const submit = async () => {
    if (!formData.value.ten_sp || !formData.value.gia) return alert("Thiếu thông tin!");
    isSubmitting.value = true;
    try {
        const data = new FormData();
        Object.keys(formData.value).forEach(k => data.append(k, formData.value[k]));
        newFiles.value.forEach(f => data.append('hinh_anh', f));
        if (deletedImageIds.value.length) data.append('cac_anh_can_xoa', deletedImageIds.value.join(','));

        if (props.productToEdit) await axios.put(`${API_URL}/api/san-pham/${props.productToEdit.id}`, data);
        else await axios.post(`${API_URL}/api/san-pham`, data);
        
        emit('saved'); resetForm();
    } catch (e) { alert(e.message); } finally { isSubmitting.value = false; }
};
</script>

<template>
  <div class="form-card">
    <h3>{{ productToEdit ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm' }}</h3>
    <form @submit.prevent="submit">
      <input v-model="formData.ten_sp" placeholder="Tên SP" class="inp" />
      <div class="row">
        <input v-model="formData.gia" type="number" placeholder="Giá" class="inp" />
        <input v-model="formData.so_luong" type="number" placeholder="Kho" class="inp" />
      </div>
      <textarea v-model="formData.mo_ta" placeholder="Mô tả" class="inp"></textarea>
      
      <input type="file" multiple @change="handleFile" id="fileUpload" class="inp" />
      <div class="preview-zone">
          <div v-for="(img, i) in existingImages" :key="img.id" class="p-item">
              <img :src="`${API_URL}${img.duong_dan}`" /> <span @click="removeOld(img.id, i)" class="del-x">x</span>
          </div>
          <div v-for="(src, i) in newPreviews" :key="i" class="p-item new">
              <img :src="src" /> <span @click="removeNew(i)" class="del-x">x</span>
          </div>
      </div>

      <div class="btns">
          <button type="submit" :disabled="isSubmitting" class="save">Lưu</button>
          <button type="button" @click="$emit('cancel')" class="cancel">Hủy</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
.inp { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; display: block; }
.row { display: flex; gap: 10px; }
.preview-zone { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px; }
.p-item { width: 60px; height: 60px; position: relative; border: 1px solid #ddd; }
.p-item img { width: 100%; height: 100%; object-fit: cover; }
.del-x { position: absolute; top: -5px; right: -5px; background: red; color: white; border-radius: 50%; width: 15px; height: 15px; font-size: 10px; text-align: center; cursor: pointer; }
.btns { display: flex; gap: 10px; }
.save { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; flex: 1; }
.cancel { background: #7f8c8d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
</style>