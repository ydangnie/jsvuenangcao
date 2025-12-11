// ==========================================
// 1. KHAI BÁO & CẤU HÌNH
// ==========================================
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const NodeCache = require('node-cache');

const app = express();
const PORT = 3000;

// Cấu hình Cache
const myCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// KẾT NỐI DATABASE - LƯU Ý: Chỉnh lại password nếu máy bạn có cài đặt
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'upredator', // Để trống nếu dùng XAMPP mặc định. Điền 'upredator' hoặc password của bạn nếu có.
    database: 'shop_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection().then(conn => {
    console.log('✅ Kết nối Database thành công!');
    conn.release();
}).catch(err => console.error('❌ Lỗi kết nối DB:', err.message));

// Cấu hình Upload
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, f, cb) => cb(null, 'uploads/'),
        filename: (req, f, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(f.originalname))
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Chỉ chấp nhận file ảnh!'));
    }
});

// Middleware Validate
const validateSanPham = (req, res, next) => {
    const { ten_sp, gia } = req.body;
    const errors = [];
    // Kiểm tra dữ liệu cơ bản
    if (!ten_sp || ten_sp.trim() === '') errors.push('Tên sản phẩm không được để trống');
    if (!gia || isNaN(gia) || Number(gia) <= 0) errors.push('Giá phải là số dương');

    if (errors.length > 0) {
        if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
        return res.status(400).json({ error: errors.join(', ') });
    }
    next();
};

// ==========================================
// 2. API SẢN PHẨM
// ==========================================

// Lấy danh sách sản phẩm
app.get('/api/san-pham', async(req, res) => {
    try {
        const trang = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const cacheKey = `san_pham_page_${trang}_limit_${limit}`;

        const cachedData = myCache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        const bo_qua = (trang - 1) * limit;
        const [dem] = await db.query('SELECT COUNT(*) as tong FROM san_pham');
        const tong_trang = Math.ceil(dem[0].tong / limit);

        // SỬA: dùng 'thoi_diem_tao' thay vì 'ngay_tao'
        const sql = `
            SELECT sp.*, 
            (SELECT duong_dan FROM hinh_anh_san_pham ha WHERE ha.id_san_pham = sp.id LIMIT 1) as hinh_anh_dai_dien
            FROM san_pham sp ORDER BY sp.thoi_diem_tao DESC LIMIT ? OFFSET ?
        `;
        const [data] = await db.query(sql, [limit, bo_qua]);

        const responseData = { danh_sach: data, phan_trang: { trang, tong_trang } };
        myCache.set(cacheKey, responseData);
        res.json(responseData);
    } catch (err) {
        console.error("Lỗi GET /api/san-pham:", err);
        res.status(500).json({ error: err.message });
    }
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

// Thêm sản phẩm
app.post('/api/san-pham', upload.array('hinh_anh', 5), validateSanPham, async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { ten_sp, gia, so_luong, mo_ta } = req.body;

        // SỬA: Map đúng 'so_luong' từ frontend vào 'so_luong_ton' trong DB
        const [resSp] = await conn.query(
            'INSERT INTO san_pham (ten_sp, gia, so_luong_ton, mo_ta) VALUES (?, ?, ?, ?)', [ten_sp, gia, so_luong || 0, mo_ta]
        );
        const idSp = resSp.insertId;

        // Lưu ảnh vào bảng hinh_anh_san_pham
        if (req.files && req.files.length > 0) {
            const val = req.files.map(f => [idSp, `/uploads/${f.filename}`]);
            await conn.query('INSERT INTO hinh_anh_san_pham (id_san_pham, duong_dan) VALUES ?', [val]);
        }

        await conn.commit();
        myCache.flushAll();
        res.json({ msg: 'Thêm thành công', id: idSp });
    } catch (err) {
        await conn.rollback();
        if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
        console.error("Lỗi POST /api/san-pham:", err); // Log lỗi ra console để debug
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// Sửa sản phẩm
app.put('/api/san-pham/:id', upload.array('hinh_anh', 5), validateSanPham, async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { ten_sp, gia, so_luong, mo_ta, cac_anh_can_xoa } = req.body;

        await conn.query(
            'UPDATE san_pham SET ten_sp=?, gia=?, so_luong_ton=?, mo_ta=? WHERE id=?', [ten_sp, gia, so_luong, mo_ta, req.params.id]
        );

        if (req.files && req.files.length > 0) {
            const val = req.files.map(f => [req.params.id, `/uploads/${f.filename}`]);
            await conn.query('INSERT INTO hinh_anh_san_pham (id_san_pham, duong_dan) VALUES ?', [val]);
        }

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
        myCache.flushAll();
        res.json({ msg: 'Cập nhật thành công' });
    } catch (err) {
        await conn.rollback();
        if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// Xóa sản phẩm
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
        myCache.flushAll();
        res.json({ msg: 'Xóa thành công' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// ==========================================
// 3. API ĐƠN HÀNG (SỬA LẠI THEO SQL MỚI)
// ==========================================

app.post('/api/thanh-toan', async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        // Lấy thêm thông tin email, dia_chi, sdt từ client gửi lên
        const { khach_hang, gio_hang, tong_tien, email, dia_chi, sdt } = req.body;

        // 1. Trừ kho
        for (const item of gio_hang) {
            const [rows] = await conn.query('SELECT so_luong_ton FROM san_pham WHERE id = ? FOR UPDATE', [item.id]);
            if (!rows.length || rows[0].so_luong_ton < item.so_luong_mua) {
                throw new Error(`Sản phẩm ${item.ten_sp} không đủ hàng!`);
            }
            await conn.query('UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE id = ?', [item.so_luong_mua, item.id]);
        }

        // 2. Tạo hóa đơn
        // SỬA: Insert vào đúng cột 'nguoi_mua', 'email', 'dia_chi', 'sdt'
        // Cung cấp giá trị mặc định nếu frontend không gửi để tránh lỗi NOT NULL
        const [hd] = await conn.query(
            `INSERT INTO hoa_don (nguoi_mua, tong_tien, trang_thai, email, dia_chi, sdt) 
             VALUES (?, ?, ?, ?, ?, ?)`, [
                khach_hang,
                tong_tien,
                0, // 0: Đang xử lý
                email || 'khachle@example.com', // Giá trị mặc định nếu thiếu
                dia_chi || 'Tại cửa hàng', // Giá trị mặc định nếu thiếu
                sdt || '0000000000' // Giá trị mặc định nếu thiếu
            ]
        );

        // 3. Lưu chi tiết hóa đơn
        // SỬA: Map đúng cột 'id_hd', 'id_sp', 'ten_sp', 'so_luong', 'don_gia'
        const chiTiet = gio_hang.map(i => [hd.insertId, i.id, i.ten_sp, i.so_luong_mua, i.gia]);
        await conn.query(
            'INSERT INTO chi_tiet_hoa_don (id_hd, id_sp, ten_sp, so_luong, don_gia) VALUES ?', [chiTiet]
        );

        await conn.commit();
        myCache.flushAll();
        res.json({ msg: 'Thanh toán thành công', id_hoa_don: hd.insertId });
    } catch (err) {
        await conn.rollback();
        console.error("Lỗi Thanh Toán:", err);
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// Cập nhật trạng thái đơn hàng
app.put('/api/hoa-don/:id/trang-thai', async(req, res) => {
    const { trang_thai } = req.body; // trang_thai là số (0, 1, 2...)
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [hd] = await db.query('SELECT trang_thai FROM hoa_don WHERE id = ?', [req.params.id]);
        if (!hd.length) { await conn.rollback(); return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' }); }

        const oldStatus = hd[0].trang_thai;
        await conn.query('UPDATE hoa_don SET trang_thai = ? WHERE id = ?', [trang_thai, req.params.id]);

        // Logic hoàn kho: Giả sử trạng thái '2' là Hủy đơn (bạn cần thống nhất số này với frontend)
        let hasStockChanged = false;
        if (Number(trang_thai) === 2 && oldStatus !== 2) {
            // SỬA: Dùng đúng tên cột 'id_hd', 'id_sp', 'so_luong'
            const [ct] = await conn.query('SELECT id_sp, so_luong FROM chi_tiet_hoa_don WHERE id_hd = ?', [req.params.id]);
            for (const i of ct) {
                await conn.query('UPDATE san_pham SET so_luong_ton = so_luong_ton + ? WHERE id = ?', [i.so_luong, i.id_sp]);
            }
            hasStockChanged = true;
        }

        await conn.commit();
        if (hasStockChanged) myCache.flushAll();

        res.json({ msg: `Đã cập nhật trạng thái đơn: ${trang_thai}` });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally { conn.release(); }
});

// Xóa đơn hàng
app.delete('/api/hoa-don/:id', async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [hd] = await conn.query('SELECT trang_thai FROM hoa_don WHERE id = ?', [req.params.id]);
        if (!hd.length) { await conn.rollback(); return res.status(404).json({ msg: 'Không tìm thấy' }); }

        let hasStockChanged = false;
        // Nếu đơn chưa hủy (khác 2) mà xóa -> hoàn kho
        if (hd[0].trang_thai !== 2) {
            const [ct] = await conn.query('SELECT id_sp, so_luong FROM chi_tiet_hoa_don WHERE id_hd = ?', [req.params.id]);
            for (const i of ct) {
                await conn.query('UPDATE san_pham SET so_luong_ton = so_luong_ton + ? WHERE id = ?', [i.so_luong, i.id_sp]);
            }
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

// Lấy danh sách hóa đơn
app.get('/api/hoa-don', async(req, res) => {
    try {
        // SỬA: 'thoi_diem' thay vì 'ngay_tao'
        const [d] = await db.query('SELECT * FROM hoa_don ORDER BY thoi_diem DESC');
        res.json(d);
    } catch (err) {
        console.error("Lỗi GET /api/hoa-don:", err);
        res.status(500).json({ error: err.message });
    }
});

// Chi tiết hóa đơn
app.get('/api/hoa-don/:id', async(req, res) => {
    try {
        const [hd] = await db.query('SELECT * FROM hoa_don WHERE id=?', [req.params.id]);
        if (!hd.length) return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' });

        // SỬA: 'id_hd' thay vì 'id_hoa_don'
        const [ct] = await db.query('SELECT * FROM chi_tiet_hoa_don WHERE id_hd=?', [req.params.id]);
        res.json({ thong_tin: hd[0], chi_tiet: ct });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server chạy tại: http://localhost:${PORT}`));