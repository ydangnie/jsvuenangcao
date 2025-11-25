<template>
  <div class="detail-container-page">
    <div v-if="!sanPham" class="loading">
      <p>Đang tải chi tiết sản phẩm {{ id }}... ⏳</p>
    </div>
    <div v-else class="detail-content-wrapper">
      <button @click="quayLai" class="back-button">← Quay lại Danh sách</button>
      
      <h2>Chi Tiết Sản Phẩm #{{ sanPham.idsanpham }}</h2>
        
      <div class="detail-grid">
        <div class="detail-image-box">
           <img :src="sanPham.hinhAnh" :alt="'Sản phẩm #' + sanPham.idsanpham" class="detail-image">
        </div>
        <div class="detail-info-box">
          <p><strong>ID Sản phẩm:</strong> {{ sanPham.idsanpham }}</p>
          <p><strong>Áo:</strong> {{ sanPham.ao }}</p>
          <p><strong>Quần:</strong> {{ sanPham.quan }}</p>
          <hr>
          <p><strong>Địa chỉ:</strong> {{ sanPham.diachi }}</p>
          <p><strong>SĐT:</strong> {{ sanPham.sdt }}</p>
          <hr>
          <p><strong>Mô tả chi tiết:</strong></p>
          <p class="description-text">{{ sanPham.moTaChiTiet }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Sao chép hàm tạo dữ liệu mẫu để Component chi tiết có thể tìm kiếm dữ liệu
function taoDuLieuMau(count) {
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
}

export default {
    name: 'ChiTietSanPham',
    props: ['id'],
    data() {
        return {
            sanPham: null,
            TONG_SO_SAN_PHAM_MOCK: 66 
        };
    },
    mounted() {
        this.layChiTietSanPham(this.id);
    },
    methods: {
        layChiTietSanPham(id) {
            const duLieuGoc = taoDuLieuMau(this.TONG_SO_SAN_PHAM_MOCK);
            const idNumber = parseInt(id);
            this.sanPham = duLieuGoc.find(item => item.idsanpham === idNumber) || null;
            
            if (!this.sanPham) {
                console.error("Không tìm thấy sản phẩm với ID:", id);
            }
        },
        quayLai() {
            this.$router.push({ name: 'home' });
        }
    }
};
</script>

<style scoped>
/* ======================== CHUNG (Tối ưu chiều cao) ======================== */
.detail-container-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 25px 20px; /* Giảm padding trên/dưới */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  /* Đảm bảo khung chứa chiếm toàn bộ chiều cao màn hình nếu nội dung không quá nhiều */
  min-height: 100vh;
}

.detail-content-wrapper {
    background-color: white;
    padding: 30px; /* Giảm padding */
    border-radius: 15px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    /* Giới hạn chiều cao và cho phép cuộn nếu cần */
    max-height: 95vh; 
    overflow-y: auto; 
}

.back-button {
    margin-bottom: 20px;
}

h2 {
    padding-bottom: 10px;
    margin-bottom: 20px;
    font-size: 2em;
}

/* ======================== BỐ CỤC DETAIL (Tối ưu Flexbox) ======================== */
.detail-grid {
    display: flex;
    gap: 20px;
    align-items: flex-start;
}

.detail-image-box {
    flex-basis: 40%;
    min-width: 250px;
    max-width: 300px;
    /* Giới hạn chiều cao hình ảnh để không chiếm quá nhiều khung nhìn */
    max-height: 280px; 
    overflow: hidden;
    border-radius: 10px;
}

.detail-info-box {
    flex-basis: 60%;
    flex-grow: 1;
}

.detail-info-box p {
    margin: 8px 0; /* Giảm margin */
    font-size: 1em; /* Giảm kích thước chữ */
}

.detail-info-box hr {
    margin: 15px 0;
}

.description-text {
    padding: 10px;
    line-height: 1.5;
}

/* Điều chỉnh responsive */
@media (max-width: 768px) {
    .detail-grid {
        flex-direction: column;
    }
    .detail-image-box {
        max-width: 100% !important;
        max-height: 250px; /* Giới hạn chiều cao trên mobile */
        min-width: auto;
    }
}
</style>