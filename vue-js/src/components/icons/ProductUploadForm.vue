<template>
  <div class="upload-container">
    <h3>Tải Lên Ảnh Sản Phẩm Mới</h3>
    
    <div class="file-input-wrapper">
      <input 
        type="file" 
        @change="handleFileUpload" 
        accept="image/png, image/jpeg, image/gif, image/webp"
        class="file-input"
        ref="fileInput"
      >
      <p class="file-info">{{ selectedFile ? selectedFile.name : 'Chọn một file ảnh (Max 5MB)' }}</p>
    </div>

    <button 
      @click="uploadFile" 
      :disabled="!selectedFile || isUploading"
      class="upload-button"
    >
      {{ isUploading ? 'Đang tải lên... 🔃' : 'Bắt đầu Upload Ảnh' }}
    </button>
    
    <div v-if="uploadMessage" :class="['message', { 'success': isSuccess, 'error': !isSuccess }]">
      <p>{{ uploadMessage }}</p>
      <p v-if="uploadedImageUrl">Xem ảnh: <a :href="uploadedImageUrl" target="_blank">{{ uploadedImageUrl }}</a></p>
      
      <button v-if="isSuccess" @click="simulateSave" class="save-button">
          Lưu URL vào Database Sản Phẩm
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ProductUploadForm',
  data() {
    return {
      selectedFile: null,
      isUploading: false,
      uploadMessage: '',
      uploadedImageUrl: '',
      isSuccess: false,
      backendBaseUrl: 'http://localhost:8080' // Đảm bảo URL này đúng với port Express của bạn
    };
  },
  methods: {
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
      this.uploadMessage = '';
      this.uploadedImageUrl = '';
      this.isSuccess = false;
    },
    async uploadFile() {
      if (!this.selectedFile) return;

      this.isUploading = true;
      this.uploadMessage = 'Đang tải lên... ⏳';
      this.isSuccess = false;

      const formData = new FormData();
      // 'productImage' phải khớp với tên trường trong Multer (upload.single('productImage'))
      formData.append('productImage', this.selectedFile); 

      try {
        const response = await axios.post(`${this.backendBaseUrl}/upload-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        this.isSuccess = true;
        this.uploadMessage = response.data.message;
        this.uploadedImageUrl = this.backendBaseUrl + response.data.imageUrl;
        console.log('Ảnh đã upload thành công:', response.data.imageUrl);
        
      } catch (error) {
        this.isSuccess = false;
        const errorMessage = error.response?.data?.message || 'Lỗi kết nối hoặc lỗi server không xác định.';
        this.uploadMessage = `Lỗi Upload: ${errorMessage} ❌`;
        console.error("Lỗi upload:", error);
      } finally {
        this.isUploading = false;
      }
    },
    simulateSave() {
        // Trong thực tế, bạn sẽ gửi request này đến một endpoint khác 
        // để cập nhật cột `hinhAnh` của sản phẩm trong database.
        alert(`Đã lưu URL ảnh ${this.uploadedImageUrl} (giả lập). Bây giờ bạn cần code API để lưu URL này vào DB.`);
    }
  }
};
</script>

<style scoped>
.upload-container {
    max-width: 500px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
}
h3 {
    margin-bottom: 15px;
    color: #333;
}
.file-input-wrapper {
    margin-bottom: 15px;
    padding: 10px;
    border: 1px dashed #ccc;
    border-radius: 4px;
}
.file-input {
    display: block;
    width: 100%;
    padding: 5px 0;
}
.file-info {
    font-size: 0.9em;
    color: #666;
    margin-top: 5px;
}
.upload-button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}
.upload-button:disabled {
    background-color: #a0a0a0;
    cursor: not-allowed;
}
.message {
    margin-top: 20px;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid;
}
.success {
    background-color: #d4edda;
    color: #155724;
    border-color: #c3e6cb;
}
.error {
    background-color: #f8d7da;
    color: #721c24;
    border-color: #f5c6cb;
}
.save-button {
    margin-top: 10px;
    background-color: #28a745;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
}
</style>