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

const myCache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'upredator',
    database: 'shop_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection().then(conn => {
    console.log('✅ Kết nối Database thành công!');
    conn.release();
}).catch(err => console.error('❌ Lỗi kết nối DB:', err.message));

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

const validateSanPham = (req, res, next) => {
    const { ten_sp, gia } = req.body;
    const errors = [];
    if (!ten_sp || ten_sp.trim() === '') errors.push('Tên sản phẩm không được để trống');
    if (!gia || isNaN(gia) || Number(gia) <= 0) errors.push('Giá phải là số dương');

    if (errors.length > 0) {
        if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
        return res.status(400).json({ error: errors.join(', ') });
    }
    next();
};

// ==========================================
// 2. API SẢN PHẨM (FIXED)
// ==========================================

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

        const sql = `
            SELECT sp.*, 
            (SELECT duong_dan FROM hinh_anh_san_pham ha WHERE ha.id_san_pham = sp.id LIMIT 1) as hinh_anh_dai_dien
            FROM san_pham sp ORDER BY sp.thoi_diem_tao DESC LIMIT ? OFFSET ?
        `;
        const [data] = await db.query(sql, [limit, bo_qua]);

        // 🔥 FIX: Map so_luong_ton -> so_luong để frontend hiển thị đúng
        const mappedData = data.map(item => ({
            ...item,
            so_luong: item.so_luong_ton
        }));

        const responseData = { danh_sach: mappedData, phan_trang: { trang, tong_trang } };
        myCache.set(cacheKey, responseData);
        res.json(responseData);
    } catch (err) {
        console.error("Lỗi GET /api/san-pham:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/san-pham/:id', async(req, res) => {
    try {
        const [sp] = await db.query('SELECT * FROM san_pham WHERE id = ?', [req.params.id]);
        if (!sp.length) return res.status(404).json({ msg: 'Không tìm thấy' });

        const [anh] = await db.query('SELECT * FROM hinh_anh_san_pham WHERE id_san_pham = ?', [req.params.id]);

        // 🔥 FIX: Map so_luong_ton -> so_luong
        const mappedSp = {
            ...sp[0],
            so_luong: sp[0].so_luong_ton,
            danh_sach_anh: anh
        };

        res.json(mappedSp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔥 FIX: Thêm sản phẩm
app.post('/api/san-pham', upload.array('hinh_anh', 5), validateSanPham, async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { ten_sp, gia, so_luong, mo_ta } = req.body;

        console.log('📦 Dữ liệu nhận từ frontend:', { ten_sp, gia, so_luong, mo_ta });

        // 🔥 FIX: Lưu vào đúng cột so_luong_ton
        const soLuongTon = so_luong ? parseInt(so_luong) : 0;

        const [resSp] = await conn.query(
            'INSERT INTO san_pham (ten_sp, gia, so_luong_ton, mo_ta) VALUES (?, ?, ?, ?)', [ten_sp, gia, soLuongTon, mo_ta || '']
        );
        const idSp = resSp.insertId;

        console.log('✅ Đã thêm sản phẩm với ID:', idSp);

        if (req.files && req.files.length > 0) {
            const val = req.files.map(f => [idSp, `/uploads/${f.filename}`]);
            await conn.query('INSERT INTO hinh_anh_san_pham (id_san_pham, duong_dan) VALUES ?', [val]);
            console.log('✅ Đã lưu', req.files.length, 'ảnh');
        }

        await conn.commit();
        myCache.flushAll();
        res.json({ msg: 'Thêm thành công', id: idSp });
    } catch (err) {
        await conn.rollback();
        if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
        console.error("❌ Lỗi POST /api/san-pham:", err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// 🔥 FIX: Sửa sản phẩm
app.put('/api/san-pham/:id', upload.array('hinh_anh', 5), validateSanPham, async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { ten_sp, gia, so_luong, mo_ta, cac_anh_can_xoa } = req.body;

        // 🔥 FIX: Update vào cột so_luong_ton
        const soLuongTon = so_luong ? parseInt(so_luong) : 0;

        await conn.query(
            'UPDATE san_pham SET ten_sp=?, gia=?, so_luong_ton=?, mo_ta=? WHERE id=?', [ten_sp, gia, soLuongTon, mo_ta || '', req.params.id]
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
    } finally {
        conn.release();
    }
});

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
    } finally {
        conn.release();
    }
});

// ==========================================
// 3. API ĐƠN HÀNG (NÂNG CẤP)
// ==========================================

app.post('/api/thanh-toan', async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { khach_hang, gio_hang, tong_tien, email, dia_chi, sdt } = req.body;

        for (const item of gio_hang) {
            const [rows] = await conn.query('SELECT so_luong_ton FROM san_pham WHERE id = ? FOR UPDATE', [item.id]);
            if (!rows.length || rows[0].so_luong_ton < item.so_luong_mua) {
                throw new Error(`Sản phẩm ${item.ten_sp} không đủ hàng!`);
            }
            await conn.query('UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE id = ?', [item.so_luong_mua, item.id]);
        }

        const [hd] = await conn.query(
            `INSERT INTO hoa_don (nguoi_mua, tong_tien, trang_thai, email, dia_chi, sdt, ghi_chu) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                khach_hang,
                tong_tien,
                0,
                email || 'khachle@example.com',
                dia_chi || 'Tại cửa hàng',
                sdt || '0000000000',
                `Đơn hàng từ ${khach_hang}`
            ]
        );

        const chiTiet = gio_hang.map(i => [hd.insertId, i.id, i.ten_sp, i.so_luong_mua, i.gia]);
        await conn.query(
            'INSERT INTO chi_tiet_hoa_don (id_hd, id_sp, ten_sp, so_luong, don_gia) VALUES ?', [chiTiet]
        );

        await conn.commit();
        myCache.flushAll();
        res.json({ msg: 'Thanh toán thành công', id_hoa_don: hd.insertId });
    } catch (err) {
        await conn.rollback();
        console.error("❌ Lỗi Thanh Toán:", err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// 🔥 NEW: API lấy danh sách hóa đơn với tìm kiếm và lọc
app.get('/api/hoa-don', async(req, res) => {
    try {
        const { search, status, startDate, endDate } = req.query;

        let sql = 'SELECT * FROM hoa_don WHERE 1=1';
        const params = [];

        // Tìm kiếm theo tên khách hoặc SĐT
        if (search) {
            sql += ' AND (nguoi_mua LIKE ? OR sdt LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Lọc theo trạng thái
        if (status !== undefined && status !== '') {
            sql += ' AND trang_thai = ?';
            params.push(parseInt(status));
        }

        // Lọc theo ngày
        if (startDate) {
            sql += ' AND DATE(thoi_diem) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            sql += ' AND DATE(thoi_diem) <= ?';
            params.push(endDate);
        }

        sql += ' ORDER BY thoi_diem DESC';

        const [data] = await db.query(sql, params);
        res.json(data);
    } catch (err) {
        console.error("❌ Lỗi GET /api/hoa-don:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/hoa-don/:id/trang-thai', async(req, res) => {
    const { trang_thai } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [hd] = await db.query('SELECT trang_thai FROM hoa_don WHERE id = ?', [req.params.id]);
        if (!hd.length) {
            await conn.rollback();
            return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' });
        }

        const oldStatus = hd[0].trang_thai;
        await conn.query('UPDATE hoa_don SET trang_thai = ? WHERE id = ?', [trang_thai, req.params.id]);

        let hasStockChanged = false;
        if (Number(trang_thai) === 2 && oldStatus !== 2) {
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
    } finally {
        conn.release();
    }
});

app.delete('/api/hoa-don/:id', async(req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [hd] = await conn.query('SELECT trang_thai FROM hoa_don WHERE id = ?', [req.params.id]);
        if (!hd.length) {
            await conn.rollback();
            return res.status(404).json({ msg: 'Không tìm thấy' });
        }

        let hasStockChanged = false;
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
    } finally {
        conn.release();
    }
});

app.get('/api/hoa-don/:id', async(req, res) => {
    try {
        const [hd] = await db.query('SELECT * FROM hoa_don WHERE id=?', [req.params.id]);
        if (!hd.length) return res.status(404).json({ msg: 'Không tìm thấy đơn hàng' });

        const [ct] = await db.query('SELECT * FROM chi_tiet_hoa_don WHERE id_hd=?', [req.params.id]);
        res.json({ thong_tin: hd[0], chi_tiet: ct });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server chạy tại: http://localhost:${PORT}`));