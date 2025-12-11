// ==========================================
// 1. KHAI BÁO & CẤU HÌNH
// ==========================================
const express = require('express');
const mysql = require('mysql2/promise'); // Dùng thư viện Promise
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const NodeCache = require('node-cache'); // Thêm thư viện Cache

const app = express();
const PORT = 3000;

// Cấu hình Cache: stdTTL = 300 giây (5 phút), checkperiod = 600 giây
const myCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Kết nối Database
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'upredator',
    database: 'shop_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối
db.getConnection().then(conn => {
    console.log('✅ Kết nối Database thành công!');
    conn.release();
}).catch(err => console.error('❌ Lỗi kết nối DB:', err));

// Cấu hình Upload
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, f, cb) => cb(null, 'uploads/'),
        filename: (req, f, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(f.originalname))
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh!'));
    }
});

// Middleware Validate
const validateSanPham = (req, res, next) => {
    const { ten_sp, gia, so_luong } = req.body;
    const errors = [];
    if (!ten_sp || ten_sp.trim() === '') errors.push('Tên sản phẩm không được để trống');
    if (!gia || isNaN(gia) || Number(gia) <= 0) errors.push('Giá phải là số dương');
    if (so_luong && (isNaN(so_luong) || Number(so_luong) < 0)) errors.push('Số lượng không hợp lệ');

    if (errors.length > 0) {
        if (req.files) req.files.forEach(f => fs.unlinkSync(f.path)); // Xóa ảnh rác nếu lỗi
        return res.status(400).json({ errors });
    }
    next();
};

// ==========================================
// 2. API SẢN PHẨM (CÓ CACHE)
// ==========================================

// Lấy danh sách (Có Cache)
app.get('/api/san-pham', async(req, res) => {
    try {
        const trang = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const cacheKey = `san_pham_page_${trang}_limit_${limit}`;

        // 1. Kiểm tra Cache
        const cachedData = myCache.get(cacheKey);
        if (cachedData) {
            console.log(`⚡ Lấy dữ liệu trang ${trang} từ Cache`);
            return res.json(cachedData);
        }

        // 2. Nếu không có Cache -> Gọi DB
        const bo_qua = (trang - 1) * limit;
        const [dem] = await db.query('SELECT COUNT(*) as tong FROM san_pham');
        const tong_trang = Math.ceil(dem[0].tong / limit);

        const sql = `
            SELECT sp.*, 
            (SELECT duong_dan FROM hinh_anh_san_pham ha WHERE ha.id_san_pham = sp.id LIMIT 1) as hinh_anh_dai_dien
            FROM san_pham sp ORDER BY sp.ngay_tao DESC LIMIT ? OFFSET ?
        `;
        const [data] = await db.query(sql, [limit, bo_qua]);

        const responseData = { danh_sach: data, phan_trang: { trang, tong_trang } };

        // 3. Lưu vào Cache
        myCache.set(cacheKey, responseData);

        res.json(responseData);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Chi tiết sản phẩm
app.get('/api/san-pham/:id', async(req, res) => {
    try {
        const [sp] = await db.query('SELECT * FROM san_pham WHERE id = ?', [req.params.id]);
        if (!sp.length) return res.status(404).json({ msg: 'Không tìm thấy' });

        const [anh] = await db.query('SELECT * FROM hinh_anh_san_pham WHERE id_san_pham = ?', [req.params.id]);
        res.json({...sp[0], danh_sach_anh: anh });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// THÊM SẢN PHẨM
app.post('/api/san-pham', upload.array('hinh_anh', 5), validateSanPham, async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { ten_sp, gia, so_luong, mo_ta } = req.body;

        const [resSp] = await conn.query(
            'INSERT INTO san_pham (ten_sp, gia, so_luong, mo_ta) VALUES (?, ?, ?, ?)', [ten_sp, gia, so_luong || 0, mo_ta]
        );
        const idSp = resSp.insertId;

        if (req.files && req.files.length > 0) {
            const val = req.files.map(f => [idSp, `/uploads/${f.filename}`]);
            await conn.query('INSERT INTO hinh_anh_san_pham (id_san_pham, duong_dan) VALUES ?', [val]);
        }

        await conn.commit();

        // Xóa Cache để cập nhật danh sách mới
        myCache.flushAll();

        res.json({ msg: 'Thêm thành công', id: idSp });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// SỬA SẢN PHẨM
app.put('/api/san-pham/:id', upload.array('hinh_anh', 5), validateSanPham, async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { ten_sp, gia, so_luong, mo_ta, cac_anh_can_xoa } = req.body;

        await conn.query('UPDATE san_pham SET ten_sp=?, gia=?, so_luong=?, mo_ta=? WHERE id=?', [ten_sp, gia, so_luong, mo_ta, req.params.id]);

        // Thêm ảnh mới
        if (req.files && req.files.length > 0) {
            const val = req.files.map(f => [req.params.id, `/uploads/${f.filename}`]);
            await conn.query('INSERT INTO hinh_anh_san_pham (id_san_pham, duong_dan) VALUES ?', [val]);
        }

        // Xóa ảnh cũ
        if (cac_anh_can_xoa) {
            const listId = cac_anh_can_xoa.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (listId.length > 0) {
                const [anhCu] = await conn.query('SELECT duong_dan FROM hinh_anh_san_pham WHERE id IN (?)', [listId]);
                for (const hinh of anhCu) {
                    try { await fsPromises.unlink(path.join(__dirname, hinh.duong_dan)); } catch (e) {}
                }
                await conn.query('DELETE FROM hinh_anh_san_pham WHERE id IN (?)', [listId]);
            }
        }

        await conn.commit();
        myCache.flushAll(); // Clear Cache
        res.json({ msg: 'Cập nhật thành công' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// XÓA SẢN PHẨM
app.delete('/api/san-pham/:id', async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [anhs] = await conn.query('SELECT duong_dan FROM hinh_anh_san_pham WHERE id_san_pham = ?', [req.params.id]);

        await conn.query('DELETE FROM san_pham WHERE id = ?', [req.params.id]);

        for (const hinh of anhs) {
            try { await fsPromises.unlink(path.join(__dirname, hinh.duong_dan)); } catch (e) {}
        }

        await conn.commit();
        myCache.flushAll(); // Clear Cache
        res.json({ msg: 'Xóa thành công' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// ==========================================
// 3. API ĐƠN HÀNG
// ==========================================

// Thanh toán (Trừ kho -> Xóa cache kho)
app.post('/api/thanh-toan', async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { khach_hang, gio_hang, tong_tien } = req.body;

        for (const item of gio_hang) {
            const [rows] = await conn.query('SELECT so_luong FROM san_pham WHERE id = ?', [item.id]);
            if (!rows.length || rows[0].so_luong < item.so_luong_mua) {
                throw new Error(`Sản phẩm ${item.ten_sp} không đủ hàng!`);
            }
            await conn.query('UPDATE san_pham SET so_luong = so_luong - ? WHERE id = ?', [item.so_luong_mua, item.id]);
        }

        const [hd] = await conn.query(
            'INSERT INTO hoa_don (ten_khach_hang, tong_tien, trang_thai) VALUES (?, ?, ?)', [khach_hang, tong_tien, 'dang_xu_ly']
        );

        const chiTiet = gio_hang.map(i => [hd.insertId, i.id, i.ten_sp, i.so_luong_mua, i.gia]);
        await conn.query('INSERT INTO chi_tiet_hoa_don (id_hoa_don, id_san_pham, ten_sp_luc_mua, so_luong_mua, don_gia) VALUES ?', [chiTiet]);

        await conn.commit();

        // Vì số lượng tồn kho thay đổi, cần xóa cache sản phẩm để Home cập nhật
        myCache.flushAll();

        res.json({ msg: 'Thanh toán thành công', id_hoa_don: hd.insertId });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// Cập nhật trạng thái (Hoàn kho nếu hủy -> Xóa cache)
app.put('/api/hoa-don/:id/trang-thai', async(req, res) => {
    const { trang_thai } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [hd] = await conn.query('SELECT trang_thai FROM hoa_don WHERE id = ?', [req.params.id]);
        if (!hd.length) { await conn.rollback(); return res.status(404).json({ msg: 'Không tìm thấy' }); }

        const oldStatus = hd[0].trang_thai;
        await conn.query('UPDATE hoa_don SET trang_thai = ? WHERE id = ?', [trang_thai, req.params.id]);

        let hasStockChanged = false;
        // Hủy đơn -> Cộng kho
        if (trang_thai === 'da_huy' && oldStatus !== 'da_huy') {
            const [ct] = await conn.query('SELECT id_san_pham, so_luong_mua FROM chi_tiet_hoa_don WHERE id_hoa_don = ?', [req.params.id]);
            for (const i of ct) await conn.query('UPDATE san_pham SET so_luong = so_luong + ? WHERE id = ?', [i.so_luong_mua, i.id_san_pham]);
            hasStockChanged = true;
        }
        // Khôi phục đơn từ hủy -> Trừ kho
        else if (oldStatus === 'da_huy' && trang_thai !== 'da_huy') {
            const [ct] = await conn.query('SELECT id_san_pham, so_luong_mua FROM chi_tiet_hoa_don WHERE id_hoa_don = ?', [req.params.id]);
            for (const i of ct) await conn.query('UPDATE san_pham SET so_luong = so_luong - ? WHERE id = ?', [i.so_luong_mua, i.id_san_pham]);
            hasStockChanged = true;
        }

        await conn.commit();
        if (hasStockChanged) myCache.flushAll(); // Update lại cache nếu kho thay đổi

        res.json({ msg: `Đã cập nhật: ${trang_thai}` });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// Xóa đơn hàng (Hoàn kho nếu chưa hủy -> Xóa cache)
app.delete('/api/hoa-don/:id', async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [hd] = await conn.query('SELECT trang_thai FROM hoa_don WHERE id = ?', [req.params.id]);
        if (!hd.length) { await conn.rollback(); return res.status(404).json({ msg: 'Ko thay' }); }

        let hasStockChanged = false;
        if (hd[0].trang_thai !== 'da_huy') {
            const [ct] = await conn.query('SELECT id_san_pham, so_luong_mua FROM chi_tiet_hoa_don WHERE id_hoa_don = ?', [req.params.id]);
            for (const i of ct) await conn.query('UPDATE san_pham SET so_luong = so_luong + ? WHERE id = ?', [i.so_luong_mua, i.id_san_pham]);
            hasStockChanged = true;
        }

        await conn.query('DELETE FROM hoa_don WHERE id = ?', [req.params.id]);

        await conn.commit();
        if (hasStockChanged) myCache.flushAll();

        res.json({ msg: 'Đã xóa hóa đơn' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

app.get('/api/hoa-don', async(req, res) => {
    const [d] = await db.query('SELECT * FROM hoa_don ORDER BY ngay_tao DESC');
    res.json(d);
});
app.get('/api/hoa-don/:id', async(req, res) => {
    const [hd] = await db.query('SELECT * FROM hoa_don WHERE id=?', [req.params.id]);
    if (!hd.length) return res.status(404).json({ msg: 'Ko thay' });
    const [ct] = await db.query('SELECT * FROM chi_tiet_hoa_don WHERE id_hoa_don=?', [req.params.id]);
    res.json({ thong_tin: hd[0], chi_tiet: ct });
});

app.listen(PORT, () => console.log(`🚀 Server chạy tại: http://localhost:${PORT}`));