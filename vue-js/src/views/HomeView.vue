<template>
  <div class="app-container">
    <header class="header">
      <h1>Quản Lý Sản Phẩm 🛒</h1>
      <button @click="moCuaSoChinhSua(null)" class="add-button">
        + Thêm Sản Phẩm Mới
      </button>
    </header>

    <div v-if="!duLieu" class="loading">
      <p>Đang tải dữ liệu... ⏳</p>
    </div>
    <div v-else-if="duLieu.length === 0" class="empty-state">
      <p>Không tìm thấy sản phẩm nào. Vui lòng thêm sản phẩm mới.</p>
    </div>
    <div v-else class="item-list">
      <div v-for="item in sanPhamHienThi" :key="item.idsanpham" class="item-card">
        <div class="item-image-container">
          <img :src="item.hinhAnh" :alt="'Sản phẩm #' + item.idsanpham" class="item-image">
        </div>

        <div class="item-info">
          <h3>Sản phẩm #{{ item.idsanpham }}</h3>
          <p><strong>Áo:</strong> {{ item.ao }}</p>
          <p><strong>Quần:</strong> {{ item.quan }}</p>
        </div>

        <div class="item-actions">
          <button 
            @click="chuyenTrangChiTiet(item.idsanpham)" 
            class="action-button detail-button">
            Chi Tiết
          </button>
          
          <button @click="moCuaSoChinhSua(item)" class="action-button edit-button">Sửa</button>
          
          <button @click="xoaSanPham(item.idsanpham)" class="action-button delete-button">Xóa</button>
        </div>
      </div>
    </div>

    <div v-if="tongSoTrang > 1" class="pagination-container">
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: trangHienTai === 1 }">
          <a class="page-link" href="#" @click.prevent="doiTrang(trangHienTai - 1)">« Trước</a>
        </li>
        <li v-for="page in tongSoTrang" :key="page" class="page-item" :class="{ active: trangHienTai === page }">
          <a class="page-link" href="#" @click.prevent="doiTrang(page)">{{ page }}</a>
        </li>
        <li class="page-item" :class="{ disabled: trangHienTai === tongSoTrang }">
          <a class="page-link" href="#" @click.prevent="doiTrang(trangHienTai + 1)">Sau »</a>
        </li>
      </ul>
    </div>

    <div v-if="hienThiModal" class="modal-overlay" @click.self="dongCuaSoChinhSua">
      <div class="modal-content">
        <h2>{{ dangChinhSua ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới' }}</h2>
        <form @submit.prevent="luuSanPham">
          
          <div class="form-group">
            <label for="fileHinhAnh">{{ dangChinhSua ? 'Ảnh Mới (Chọn để thay đổi)' : 'Chọn Ảnh Sản Phẩm' }}:</label>
            <input type="file" id="fileHinhAnh" @change="xuLyChonFile" accept="image/*" class="file-input">
            <p v-if="thongTinForm.hinhAnh && !fileHinhAnh" class="current-image-info">
              Đang dùng ảnh: <strong>{{ thongTinForm.hinhAnh.split('?')[0].split('/').pop() || 'Ảnh hiện tại' }}</strong>
            </p>
            <p v-if="fileHinhAnh" class="new-file-selected">
              ✅ Đã chọn file: <strong>{{ fileHinhAnh.name }}</strong>
            </p>
          </div>
          <div class="form-group">
            <label for="ao">Áo:</label>
            <input id="ao" v-model="thongTinForm.ao" required>
          </div>
          <div class="form-group">
            <label for="quan">Quần:</label>
            <input id="quan" v-model="thongTinForm.quan" required>
          </div>
          <div class="form-group">
            <label for="diachi">Địa chỉ:</label>
            <input id="diachi" v-model="thongTinForm.diachi" required>
          </div>
          <div class="form-group">
            <label for="sdt">SĐT:</label>
            <input id="sdt" v-model="thongTinForm.sdt" required>
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-button">{{ dangChinhSua ? 'Lưu Thay Đổi' : 'Tạo Mới' }}</button>
            <button type="button" @click="dongCuaSoChinhSua" class="cancel-button">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script>
const SAN_PHAM_MOI_TRANG = 6;

export default {
  name: 'HomeView', 
  data() {
    return {
      duLieu: null, 
      trangHienTai: 1, 
      hienThiModal: false, 
      fileHinhAnh: null, // [NEW] Biến để giữ file object
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
    try {
      await this.giaLapApi();
      this.duLieu = this.taoDuLieuMau(66); 
    } catch (error) {
      console.error("Lỗi khi fetch data:", error);
      this.duLieu = [];
    }
  },
  computed: {
    sanPhamHienThi() {
      if (!this.duLieu) {
        return [];
      }
      const startIndex = (this.trangHienTai - 1) * SAN_PHAM_MOI_TRANG;
      const endIndex = startIndex + SAN_PHAM_MOI_TRANG;
      return this.duLieu.slice(startIndex, endIndex);
    },
    tongSoTrang() {
      if (!this.duLieu || this.duLieu.length === 0) return 1;
      return Math.ceil(this.duLieu.length / SAN_PHAM_MOI_TRANG);
    },
    dangChinhSua() {
        return this.thongTinForm.idsanpham !== null;
    }
  },
  methods: {
    chuyenTrangChiTiet(id) {
        this.$router.push({ 
            name: 'chi-tiet-san-pham', 
            params: { id: id } 
        });
    },
    layIdMoi() {
        if (!this.duLieu || this.duLieu.length === 0) {
            return 1;
        }
        const maxId = Math.max(...this.duLieu.map(item => item.idsanpham));
        return maxId + 1;
    },
    // [NEW] Xử lý chọn file
    xuLyChonFile(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.fileHinhAnh = file;
        } else {
            alert("Vui lòng chọn một file hình ảnh hợp lệ.");
            this.fileHinhAnh = null;
            event.target.value = null; // Reset input
        }
    },
    moCuaSoChinhSua(item) {
        if (item) {
            this.thongTinForm = { ...item };
        } else {
            this.thongTinForm = {
                idsanpham: null, 
                ao: '',
                quan: '',
                diachi: '',
                sdt: '',
                hinhAnh: '',
                moTaChiTiet: ''
            };
        }
        this.hienThiModal = true;
        this.fileHinhAnh = null; // Reset file object khi mở modal
    },
    dongCuaSoChinhSua() {
        this.hienThiModal = false;
        this.fileHinhAnh = null; // Reset file object khi đóng modal
        this.thongTinForm = {
            idsanpham: null,
            ao: '',
            quan: '',
            diachi: '',
            sdt: '',
            hinhAnh: '',
            moTaChiTiet: ''
        };
    },
    luuSanPham() {
        // [MODIFIED] Logic mô phỏng upload file
        if (this.fileHinhAnh) {
            // Nếu có file mới, mô phỏng upload và tạo URL mới (dùng timestamp)
            const newMockUrl = this.taoDuLieuAnh(new Date().getTime());
            this.thongTinForm.hinhAnh = newMockUrl;
            console.log(`Mô phỏng: File ${this.fileHinhAnh.name} đã được upload. URL mới: ${newMockUrl}`);
        } else if (!this.dangChinhSua) {
             // Nếu là thêm mới mà không chọn file, gán một URL mặc định
            this.thongTinForm.hinhAnh = this.taoDuLieuAnh(this.layIdMoi());
        }
        // Lưu ý: Nếu là chỉnh sửa và không có file mới, hinhAnh vẫn giữ giá trị cũ (URL)
        
        if (this.dangChinhSua) {
            const index = this.duLieu.findIndex(item => item.idsanpham === this.thongTinForm.idsanpham);
            if (index !== -1) {
                const newData = [...this.duLieu];
                newData[index] = { ...this.thongTinForm };
                this.duLieu = newData;
                console.log("Cập nhật thành công:", this.thongTinForm);
            }
        } else {
            const newItem = {
                ...this.thongTinForm,
                idsanpham: this.layIdMoi()
            };
            this.duLieu = [newItem, ...this.duLieu];
            console.log("Thêm mới thành công:", newItem);
            
            this.trangHienTai = 1;
        }
        
        this.dongCuaSoChinhSua();
    },
    xoaSanPham(id) {
        if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm #${id} này không?`)) {
            this.duLieu = this.duLieu.filter(item => item.idsanpham !== id);
            console.log("Xóa thành công sản phẩm #", id);
            
            if (this.sanPhamHienThi.length === 0 && this.trangHienTai > 1) {
                this.doiTrang(this.trangHienTai - 1);
            }
        }
    },
    doiTrang(page) {
      if (page >= 1 && page <= this.tongSoTrang) {
        this.trangHienTai = page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    // [NEW] Hàm helper tạo URL mock
    taoDuLieuAnh(id) {
        return `https://picsum.photos/300/200?random=${id}`;
    },
    taoDuLieuMau(count) {
      const duLieu = [];
      for (let i = 1; i <= count; i++) {
        duLieu.push({
          idsanpham: i,
          ao: `Áo thun cao cấp ${i}`,
          quan: `Quần jean ${i}`,
          diachi: `Địa chỉ ${i}, Quận ${(i % 10) + 1}, TP.HCM`,
          sdt: `0123.456.${String(i).padStart(3, '0')}`,
          hinhAnh: this.taoDuLieuAnh(i), // Sử dụng hàm helper
          moTaChiTiet: `Sản phẩm chất lượng cao, với mã SKU độc quyền: SPU${String(i).padStart(4, '0')}. Được làm từ 100% Cotton tự nhiên, mang lại cảm giác thoáng mát và thoải mái. Thích hợp cho cả dạo phố và đi làm. Bảo hành 12 tháng.`
        });
      }
      return duLieu;
    },
    giaLapApi() {
      return new Promise(resolve => {
        setTimeout(resolve, 1000); 
      });
    }
  }
};
</script>
<style src="../assets/app.css" scoped></style>