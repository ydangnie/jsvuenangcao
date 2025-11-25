<template>
  <div class="app-container">
    <h1>My Vue App</h1>
    <div v-if="!data" class="loading">
      <p>Loading...</p>
    </div>
    <div v-else-if="data.length === 0" class="loading">
      <p>Không tìm thấy sản phẩm nào.</p>
    </div>
    <div v-else class="item-list">
      <div v-for="item in displayedItems" :key="item.idsanpham" class="item-card">
        <h3>Sản phẩm #{{ item.idsanpham }}</h3>
        <p><strong>Áo:</strong> {{ item.ao }}</p>
        <p><strong>Quần:</strong> {{ item.quan }}</p>
        <hr>
        <p><strong>Địa chỉ:</strong> {{ item.diachi }}</p>
        <p><strong>SĐT:</strong> {{ item.sdt }}</p>
      </div>
    </div>

    <!-- Phân trang -->
    <div class="pagination">
      <ul class="pagination">
        <!-- Nút trang trước -->
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Trước</a>
        </li>
        
        <!-- Các nút trang từ 1 đến 11 -->
        <li v-for="page in totalPages" :key="page" class="page-item" :class="{ active: currentPage === page }">
          <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
        </li>
        
        <!-- Nút trang tiếp theo -->
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Sau</a>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
const ITEMS_PER_PAGE = 6;
const TOTAL_PAGES = 11;

export default {
  name: 'App',
  data() {
    return {
      data: null,
      currentPage: 1
    };
  },
  async mounted() {
    // Giả lập API call
    try {
      // Trong thực tế, bạn sẽ gọi API thật
      // const res = await fetch("/api/home/");
      // this.data = await res.json();
      
      // Tạm thời dùng dữ liệu mẫu
      await this.simulateApiCall();
      this.data = this.generateSampleData(66); // 66 sản phẩm để đủ 11 trang
    } catch (error) {
      console.error("Lỗi khi fetch data:", error);
      this.data = [];
    }
  },
  computed: {
    displayedItems() {
      if (!this.data) {
        return [];
      }
      const startIndex = (this.currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return this.data.slice(startIndex, endIndex);
    },
    totalPages() {
      if (!this.data) return 0;
      return TOTAL_PAGES; // Cố định 11 trang
    }
  },
  methods: {
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        // Cuộn lên đầu trang khi chuyển trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    generateSampleData(count) {
      const data = [];
      for (let i = 1; i <= count; i++) {
        data.push({
          idsanpham: i,
          ao: `Áo thun ${i}`,
          quan: `Quần jean ${i}`,
          diachi: `Địa chỉ ${i}, Quận ${(i % 10) + 1}, TP.HCM`,
          sdt: `0123.456.${String(i).padStart(3, '0')}`
        });
      }
      return data;
    },
    simulateApiCall() {
      return new Promise(resolve => {
        setTimeout(resolve, 1000); // Giả lập thời gian load
      });
    }
  }
};
</script>
<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #f4f7f6;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.loading {
  text-align: center;
  font-size: 1.2em;
  color: #888;
}

.item-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.item-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 20px;
  width: 300px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.item-card h3 {
  margin-top: 0;
  color: #0056b3;
}

.item-card p {
  margin: 8px 0;
  line-height: 1.5;
  color: #555;
}

.item-card strong {
  color: #333;
}

.item-card hr {
  border: 0;
  border-top: 1px solid #eee;
  margin: 15px 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  margin-bottom: 30px;
}

.page-item {
  margin: 0 5px;
  list-style: none;
}

.page-link {
  display: block;
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  color: #0056b3;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.page-link:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
}

.page-item.active .page-link {
  background-color: #0056b3;
  border-color: #0056b3;
  color: white;
}

.page-item.disabled .page-link {
  color: #6c757d;
  pointer-events: none;
  background-color: #fff;
  border-color: #dee2e6;
}
</style>