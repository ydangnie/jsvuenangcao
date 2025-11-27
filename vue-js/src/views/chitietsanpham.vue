<template>
  <div class="detail-container-page">
    <div v-if="!sanPham" class="loading">
      <div class="spinner"></div>
      <p>Đang tải chi tiết sản phẩm #{{ id }}...</p>
    </div>
    
    <div v-else class="detail-content-wrapper">
      <button @click="quayLai" class="back-button">
        <i class="fas fa-arrow-left"></i> Quay lại Danh sách
      </button>
      
      <div class="detail-header">
        <h2>Chi Tiết Sản Phẩm</h2>
        <div class="product-id-badge">#{{ sanPham.idsanpham }}</div>
      </div>
        
      <div class="detail-grid">
        <div class="detail-image-section">
          <div class="detail-image-box">
            <img :src="sanPham.hinhAnh" :alt="'Sản phẩm #' + sanPham.idsanpham" class="detail-image">
          </div>
        </div>
        
        <div class="detail-info-section">
          <div class="info-card">
            <h3><i class="fas fa-info-circle"></i> Thông tin cơ bản</h3>
            <div class="info-row">
              <span class="info-label"><i class="fas fa-hashtag"></i> ID Sản phẩm:</span>
              <span class="info-value">{{ sanPham.idsanpham }}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i class="fas fa-tshirt"></i> Áo:</span>
              <span class="info-value">{{ sanPham.ao }}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i class="fas fa-tshirt"></i> Quần:</span>
              <span class="info-value">{{ sanPham.quan }}</span>
            </div>
          </div>

          <div class="info-card">
            <h3><i class="fas fa-address-book"></i> Thông tin liên hệ</h3>
            <div class="info-row">
              <span class="info-label"><i class="fas fa-map-marker-alt"></i> Địa chỉ:</span>
              <span class="info-value">{{ sanPham.diachi }}</span>
            </div>
            <div class="info-row">
              <span class="info-label"><i class="fas fa-phone"></i> SĐT:</span>
              <span class="info-value">{{ sanPham.sdt }}</span>
            </div>
          </div>

          <div class="info-card description-card">
            <h3><i class="fas fa-align-left"></i> Mô tả chi tiết</h3>
            <p class="description-text">{{ sanPham.moTaChiTiet }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const TONG_SO_SAN_PHAM_MOCK = 20;

function taoDuLieuMau(count) {
  const duLieu = [];
  for (let i = 1; i <= count; i++) {
    duLieu.push({
      idsanpham: i,
      ao: `Áo Thun Local Brand ${i}`,
      quan: `Quần Short Kaki ${i}`,
      diachi: `Kho Hàng Quận ${(i % 10) + 1}, TP.HCM`,
      sdt: `090${Math.floor(Math.random() * 9000000)}`,
      hinhAnh: `https://picsum.photos/500/400?random=${i}`,
      moTaChiTiet: `Sản phẩm chất lượng cao, với mã SKU độc quyền: SPU${String(i).padStart(4, '0')}. Được làm từ 100% Cotton tự nhiên, mang lại cảm giác thoáng mát và thoải mái. Thích hợp cho cả dạo phố và đi làm. Bảo hành 12 tháng. Sản phẩm được thiết kế theo phong cách hiện đại, phù hợp với mọi lứa tuổi.`
    });
  }
  return duLieu;
}

export default {
  name: 'ChiTietSanPham',
  data() {
    return {
      sanPham: null,
      TONG_SO_SAN_PHAM_MOCK: TONG_SO_SAN_PHAM_MOCK
    };
  },
  computed: {
    id() {
      return this.$route.params.id;
    }
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
        this.$router.push({ name: 'home' });
      }
    },
    quayLai() {
      this.$router.push({ name: 'home' });
    }
  }
};
</script>

<style scoped>
/* Import FontAwesome */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.detail-container-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  padding: 40px;
  max-width: 500px;
  margin: 0 auto;
}

.spinner {
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  font-size: 18px;
  font-weight: 600;
}

.detail-content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 30px;
  font-size: 14px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.back-button:hover {
  transform: translateX(-5px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.detail-header h2 {
  font-size: 32px;
  color: #2d3748;
  font-weight: 700;
  margin: 0;
}

.product-id-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 40px;
  align-items: start;
}

.detail-image-section {
  position: sticky;
  top: 20px;
}

.detail-image-box {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  background: #f7fafc;
  border: 1px solid #e2e8f0;
}

.detail-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.detail-image-box:hover .detail-image {
  transform: scale(1.05);
}

.detail-info-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 25px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.info-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.info-card h3 {
  color: #2d3748;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
}

.info-card h3 i {
  color: #667eea;
  font-size: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
  gap: 20px;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #4a5568;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.info-label i {
  color: #667eea;
  width: 16px;
}

.info-value {
  color: #2d3748;
  font-size: 14px;
  text-align: right;
  flex: 1;
  word-break: break-word;
}

.description-card {
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
}

.description-text {
  color: #4a5568;
  line-height: 1.8;
  font-size: 15px;
  text-align: justify;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 968px) {
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .detail-image-section {
    position: relative;
    top: 0;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .detail-header h2 {
    font-size: 24px;
  }
}

@media (max-width: 640px) {
  .detail-container-page {
    padding: 20px 15px;
  }

  .detail-content-wrapper {
    padding: 25px 20px;
  }

  .back-button {
    width: 100%;
    justify-content: center;
  }

  .info-row {
    flex-direction: column;
    gap: 8px;
  }

  .info-label {
    min-width: auto;
  }

  .info-value {
    text-align: left;
  }

  .detail-header h2 {
    font-size: 20px;
  }

  .product-id-badge {
    font-size: 16px;
    padding: 8px 16px;
  }
}
</style>