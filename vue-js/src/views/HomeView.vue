<template>
  <div class="app-container">
    <header class="header">
      <div class="header-content">
        <h1>📦 Quản Lý Sản Phẩm</h1>
        <p class="subtitle">Quản lý kho hàng, thêm sửa xóa sản phẩm</p>
      </div>
      <button @click="moCuaSoChinhSua(null)" class="btn btn-primary btn-add">
        <i class="fas fa-plus"></i> Thêm Sản Phẩm
      </button>
    </header>

    <div v-if="dangTai" class="loading-container">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="!duLieu || duLieu.length === 0" class="empty-state">
      <img src="https://cdn-icons-png.flaticon.com/512/4076/4076432.png" alt="Empty" width="100">
      <p>Chưa có sản phẩm nào.</p>
      <button @click="moCuaSoChinhSua(null)" class="btn btn-primary">Tạo sản phẩm đầu tiên</button>
    </div>

    <div v-else class="item-list">
      <div v-for="item in sanPhamHienThi" :key="item.idsanpham" class="product-card">
        <div class="card-image">
          <img :src="item.hinhAnh" :alt="'SP #' + item.idsanpham" loading="lazy">
          <div class="card-badge">#{{ item.idsanpham }}</div>
        </div>

        <div class="card-body">
          <h3 class="product-name">{{ item.ao }}</h3>
          <div class="product-details">
            <p><i class="fas fa-tshirt"></i> <strong>Quần:</strong> {{ item.quan }}</p>
            <p><i class="fas fa-map-marker-alt"></i> <strong>Đ/C:</strong> {{ catNganChuoi(item.diachi, 20) }}</p>
            <p><i class="fas fa-phone"></i> <strong>SĐT:</strong> {{ item.sdt }}</p>
          </div>
        </div>

        <div class="card-footer">
          <button @click="chuyenTrangChiTiet(item.idsanpham)" class="btn-icon btn-view" title="Chi tiết">
            👁️
          </button>
          <button @click="moCuaSoChinhSua(item)" class="btn-icon btn-edit" title="Chỉnh sửa">
            ✏️
          </button>
          <button @click="xoaSanPham(item.idsanpham)" class="btn-icon btn-delete" title="Xóa">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <div v-if="tongSoTrang > 1" class="pagination-container">
      <button 
        class="page-btn" 
        :disabled="trangHienTai === 1"
        @click="doiTrang(trangHienTai - 1)">
        &laquo; Trước
      </button>
      
      <span class="page-info">Trang {{ trangHienTai }} / {{ tongSoTrang }}</span>
      
      <button 
        class="page-btn" 
        :disabled="trangHienTai === tongSoTrang"
        @click="doiTrang(trangHienTai + 1)">
        Sau &raquo;
      </button>
    </div>

    <div v-if="hienThiModal" class="modal-overlay" @click.self="dongCuaSoChinhSua">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ dangChinhSua ? '✏️ Cập Nhật Sản Phẩm' : '✨ Thêm Sản Phẩm Mới' }}</h2>
          <button class="close-btn" @click="dongCuaSoChinhSua">&times;</button>
        </div>
        
        <form @submit.prevent="luuSanPham" class="modal-body">
          <div class="form-section image-section">
            <label class="image-upload-box" :class="{ 'has-image': previewHinhAnh || thongTinForm.hinhAnh }">
              <img v-if="previewHinhAnh" :src="previewHinhAnh" class="preview-img" alt="Preview">
              <img v-else-if="thongTinForm.hinhAnh" :src="thongTinForm.hinhAnh" class="preview-img" alt="Current">
              <div v-else class="upload-placeholder">
                <span>📸</span>
                <p>Nhấn để chọn ảnh</p>
              </div>
              <input type="file" @change="xuLyChonFile" accept="image/*" class="hidden-input">
            </label>
            <p class="hint-text" v-if="dangChinhSua && !previewHinhAnh">Ảnh hiện tại (Nhấn vào ảnh để thay đổi)</p>
            <p class="hint-text new-file" v-if="previewHinhAnh">Ảnh mới đã chọn</p>
          </div>

          <div class="form-section info-section">
            <div class="form-group">
              <label>Tên Áo <span class="required">*</span></label>
              <input v-model="thongTinForm.ao" placeholder="Ví dụ: Áo thun đen..." required>
            </div>
            
            <div class="form-group">
              <label>Tên Quần <span class="required">*</span></label>
              <input v-model="thongTinForm.quan" placeholder="Ví dụ: Quần Jean xanh..." required>
            </div>

            <div class="form-group">
              <label>Địa chỉ</label>
              <input v-model="thongTinForm.diachi" placeholder="Nhập địa chỉ kho...">
            </div>

            <div class="form-group">
              <label>Số điện thoại</label>
              <input v-model="thongTinForm.sdt" placeholder="0901..." type="tel">
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="dongCuaSoChinhSua" class="btn btn-secondary">Hủy bỏ</button>
            <button type="submit" class="btn btn-primary">{{ dangChinhSua ? 'Lưu Thay Đổi' : 'Tạo Mới' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
const SAN_PHAM_MOI_TRANG = 8; // Tăng lên 8 cho đẹp grid

export default {
  name: 'QuanLySanPham',
  data() {
    return {
      duLieu: [],
      trangHienTai: 1,
      dangTai: true,
      hienThiModal: false,
      fileHinhAnh: null,
      previewHinhAnh: null, // URL blob để xem trước ảnh
      thongTinForm: {
        idsanpham: null,
        ao: '',
        quan: '',
        diachi: '',
        sdt: '',
        hinhAnh: '',
        moTaChiTiet: ''
      }
    };
  },
  async mounted() {
    await this.taiDuLieu();
  },
  computed: {
    sanPhamHienThi() {
      if (!this.duLieu) return [];
      const startIndex = (this.trangHienTai - 1) * SAN_PHAM_MOI_TRANG;
      return this.duLieu.slice(startIndex, startIndex + SAN_PHAM_MOI_TRANG);
    },
    tongSoTrang() {
      return Math.ceil(this.duLieu.length / SAN_PHAM_MOI_TRANG) || 1;
    },
    dangChinhSua() {
      return this.thongTinForm.idsanpham !== null;
    }
  },
  methods: {
    async taiDuLieu() {
      this.dangTai = true;
      try {
        await new Promise(r => setTimeout(r, 800)); // Giả lập loading
        this.duLieu = this.taoDuLieuMau(20);
      } catch (e) {
        console.error(e);
      } finally {
        this.dangTai = false;
      }
    },
    chuyenTrangChiTiet(id) {
      // Logic router của bạn
      console.log('Xem chi tiết:', id);
      // this.$router.push({ name: 'chi-tiet', params: { id }});
    },
    
    // Xử lý xem trước ảnh (Preview)
    xuLyChonFile(event) {
      const file = event.target.files[0];
      if (file && file.type.startsWith('image/')) {
        this.fileHinhAnh = file;
        // Tạo URL tạm thời để hiển thị ngay lập tức
        this.previewHinhAnh = URL.createObjectURL(file);
      } else {
        alert("Vui lòng chọn file ảnh hợp lệ!");
      }
    },

    moCuaSoChinhSua(item) {
      this.previewHinhAnh = null; // Reset preview
      this.fileHinhAnh = null;
      
      if (item) {
        this.thongTinForm = { ...item };
      } else {
        this.datLaiForm();
      }
      this.hienThiModal = true;
    },

    dongCuaSoChinhSua() {
      this.hienThiModal = false;
      // Thu hồi URL object để tránh leak memory
      if (this.previewHinhAnh) URL.revokeObjectURL(this.previewHinhAnh);
    },

    datLaiForm() {
      this.thongTinForm = { idsanpham: null, ao: '', quan: '', diachi: '', sdt: '', hinhAnh: '', moTaChiTiet: '' };
    },

    luuSanPham() {
      // 1. Xử lý logic ảnh (Giả lập upload)
      let urlAnhCuoiCung = this.thongTinForm.hinhAnh;
      
      if (this.fileHinhAnh) {
        // Giả lập upload thành công -> trả về URL mới
        // Trong thực tế: const res = await uploadApi(this.fileHinhAnh); urlAnhCuoiCung = res.url;
        urlAnhCuoiCung = `https://picsum.photos/300/200?random=${Date.now()}`;
      } else if (!urlAnhCuoiCung) {
        // Nếu thêm mới mà không chọn ảnh, tạo ảnh ngẫu nhiên
        urlAnhCuoiCung = `https://picsum.photos/300/200?random=${this.layIdMoi()}`;
      }

      const duLieuLuu = {
        ...this.thongTinForm,
        hinhAnh: urlAnhCuoiCung
      };

      if (this.dangChinhSua) {
        const index = this.duLieu.findIndex(i => i.idsanpham === duLieuLuu.idsanpham);
        if (index !== -1) {
          this.duLieu.splice(index, 1, duLieuLuu); // Dùng splice để Vue react
        }
      } else {
        duLieuLuu.idsanpham = this.layIdMoi();
        this.duLieu.unshift(duLieuLuu); // Thêm vào đầu danh sách
        this.trangHienTai = 1;
      }
      
      this.dongCuaSoChinhSua();
    },

    xoaSanPham(id) {
      if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
        this.duLieu = this.duLieu.filter(i => i.idsanpham !== id);
        if (this.sanPhamHienThi.length === 0 && this.trangHienTai > 1) {
          this.trangHienTai--;
        }
      }
    },

    layIdMoi() {
      if (this.duLieu.length === 0) return 1;
      return Math.max(...this.duLieu.map(i => i.idsanpham)) + 1;
    },

    taoDuLieuMau(soLuong) {
      return Array.from({ length: soLuong }, (_, i) => ({
        idsanpham: i + 1,
        ao: `Áo Thun Local Brand ${i + 1}`,
        quan: `Quần Short Kaki ${i + 1}`,
        diachi: `Kho Hàng Quận ${i % 10 + 1}, TP.HCM`,
        sdt: `090${Math.floor(Math.random() * 9000000)}`,
        hinhAnh: `https://picsum.photos/300/200?random=${i}`,
        moTaChiTiet: 'Mô tả sản phẩm mẫu...'
      }));
    },
    
    catNganChuoi(str, len) {
      if (!str) return '';
      return str.length > len ? str.substring(0, len) + '...' : str;
    },
    
    doiTrang(trang) {
      this.trangHienTai = trang;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
};
</script>

<style scoped>
/* Reset & Base */
* { box-sizing: border-box; }
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.header h1 { margin: 0; font-size: 24px; color: #2c3e50; }
.subtitle { margin: 5px 0 0; color: #7f8c8d; font-size: 14px; }

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-primary {
  background-color: #3498db;
  color: white;
  box-shadow: 0 4px 6px rgba(52, 152, 219, 0.2);
}
.btn-primary:hover { background-color: #2980b9; transform: translateY(-2px); }
.btn-secondary { background-color: #ecf0f1; color: #2c3e50; margin-right: 10px; }
.btn-secondary:hover { background-color: #bdc3c7; }

/* Grid Layout */
.item-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 25px;
}

/* Product Card */
.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.card-image {
  height: 180px;
  position: relative;
  overflow: hidden;
}
.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.product-card:hover .card-image img { transform: scale(1.1); }
.card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.card-body { padding: 15px; flex-grow: 1; }
.product-name { margin: 0 0 10px; font-size: 16px; font-weight: 700; color: #2c3e50; }
.product-details p { margin: 5px 0; font-size: 13px; color: #666; display: flex; align-items: center; gap: 8px; }

.card-footer {
  padding: 15px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #eee;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: background 0.2s;
}
.btn-view:hover { background: #e3f2fd; color: #2196f3; }
.btn-edit:hover { background: #fff3e0; color: #ff9800; }
.btn-delete:hover { background: #ffebee; color: #f44336; }

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  gap: 15px;
}
.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-weight: bold; color: #555; }

/* Loading & Empty */
.loading-container, .empty-state {
  text-align: center;
  padding: 50px;
  color: #888;
}
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-content {
  background: white;
  width: 90%;
  max-width: 800px;
  border-radius: 15px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: slideIn 0.3s ease;
}
@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.close-btn { background: none; border: none; font-size: 28px; cursor: pointer; color: #999; }
.close-btn:hover { color: #333; }

.modal-body {
  display: flex;
  padding: 30px;
  gap: 30px;
  flex-wrap: wrap;
}
.form-section { flex: 1; min-width: 300px; }

/* Image Upload Styling */
.image-upload-box {
  width: 100%;
  aspect-ratio: 4/3;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  background: #f8fafc;
  transition: all 0.3s;
}
.image-upload-box:hover { border-color: #3498db; background: #f1f5f9; }
.image-upload-box.has-image { border-style: solid; border-color: #e2e8f0; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.upload-placeholder { text-align: center; color: #64748b; }
.upload-placeholder span { font-size: 40px; display: block; margin-bottom: 10px; }
.hidden-input { display: none; }
.hint-text { text-align: center; font-size: 13px; color: #94a3b8; margin-top: 10px; }
.new-file { color: #2ecc71; font-weight: bold; }

/* Form Fields */
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 14px; }
.required { color: red; }
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}
.form-group input:focus { border-color: #3498db; outline: none; }

.modal-footer {
  padding: 20px 30px;
  background: #f8fafc;
  text-align: right;
  border-top: 1px solid #eee;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-body { flex-direction: column; padding: 20px; }
  .header { flex-direction: column; align-items: flex-start; gap: 15px; }
  .btn-add { width: 100%; }
}
</style>
<style src="../assets/app.css" scoped></style>