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
            <label for="hinhAnh">Link Hình ảnh:</label>
            <input id="hinhAnh" v-model="thongTinForm.hinhAnh" required placeholder="URL hình ảnh (ví dụ: https://...)">
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
    },
    dongCuaSoChinhSua() {
        this.hienThiModal = false;
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
    taoDuLieuMau(count) {
      const duLieu = [];
      for (let i = 1; i <= count; i++) {
        duLieu.push({
          idsanpham: i,
          ao: `Áo thun cao cấp ${i}`,
          quan: `Quần jean ${i}`,
          diachi: `Địa chỉ ${i}, Quận ${(i % 10) + 1}, TP.HCM`,
          sdt: `0123.456.${String(i).padStart(3, '0')}`,
          hinhAnh: `https://picsum.photos/300/200?random=${i}`,
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
<style scoped>
/* ======================== CHUNG (Giảm padding/margin) ======================== */
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px; /* Giảm padding trên/dưới */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f7f9fc; 
  min-height: 100vh;
}

/* ======================== HEADER & BUTTON ======================== */
.header {
  margin-bottom: 30px; /* Giảm margin dưới */
  padding-bottom: 15px;
  border-bottom: 3px solid #e0e0e0;
}

h1 {
  font-size: 2.5em; /* Giảm kích thước chữ lớn */
}

.add-button {
  padding: 10px 20px; /* Giảm kích thước nút */
  font-size: 1em;
}

.add-button:hover {
  transform: translateY(-2px);
}

/* ======================== DANH SÁCH SẢN PHẨM (Tăng mật độ) ======================== */
.item-list {
  /* Tối ưu hóa Grid để hiển thị nhiều cột hơn */
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px; /* Giảm khoảng cách giữa các item */
}

.item-card {
  border-radius: 10px; /* Bo tròn ít hơn */
}

.item-card:hover {
  transform: translateY(-5px); /* Giảm hiệu ứng nổi */
}

.item-image-container {
    height: 160px; /* Giảm chiều cao ảnh */
}

.item-info {
    padding: 10px 15px; /* Giảm padding info */
    flex-grow: 1;
}

.item-info h3 {
  font-size: 1.3em; /* Giảm kích thước tiêu đề card */
  padding-bottom: 5px;
  margin-bottom: 8px;
}

.item-info p {
  margin: 3px 0; /* Giảm margin giữa các dòng text */
  font-size: 0.9em; 
}

/* ======================== ACTIONS BUTTONS ======================== */
.item-actions {
  gap: 8px;
  padding: 10px 15px 15px; /* Giảm padding action bar */
}

.action-button {
  padding: 8px 10px; /* Giảm kích thước nút */
  font-weight: 500;
}

/* ======================== PAGINATION ======================== */
.pagination-container {
    margin-top: 25px; /* Giảm margin trên */
    margin-bottom: 25px; /* Giảm margin dưới */
}

.page-link {
  padding: 8px 14px; /* Giảm kích thước nút phân trang */
}

/* ======================== MODAL THÊM/SỬA ======================== */
.modal-content {
    max-width: 500px; /* Giảm max-width */
    padding: 30px; /* Giảm padding */
    border-radius: 10px;
}

.modal-content h2 {
    font-size: 1.8em;
    margin-bottom: 20px;
}

.form-group input {
    padding: 10px;
    border-radius: 5px;
}

.save-button, .cancel-button {
    padding: 10px 20px;
}
</style>