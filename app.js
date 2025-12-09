const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ung_dung = express();
const cong = 3000;

ung_dung.use(cors());
ung_dung.use(express.json());
ung_dung.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const ket_noi = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'upredator',
    database: 'shop_db'
});

ket_noi.connect(e => e ? console.error(e) : console.log('Kết nối DB thành công!'));

// Cấu hình upload
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, f, cb) => cb(null, 'uploads/'),
        filename: (req, f, cb) => cb(null, Date.now() + '-' + f.originalname)
    })
});

// --- API SẢN PHẨM (PHÂN TRANG 9 ITEM/TRANG) ---
ung_dung.get('/api/san-pham', (req, res) => {
    const trang = parseInt(req.query.page) || 1;
    const gioi_han = 6; // Yêu cầu: 9 sản phẩm mỗi trang
    const bo_qua = (trang - 1) * gioi_han;

    ket_noi.query('SELECT COUNT(*) as tong FROM san_pham', (err, dataCount) => {
        if (err) return res.status(500).json(err);

        // Backend tự động tính lại tổng số trang dựa trên giới hạn mới (6)
        const tong_trang = Math.ceil(dataCount[0].tong / gioi_han);

        const sql = 'SELECT * FROM san_pham ORDER BY ngay_tao DESC LIMIT ? OFFSET ?';
        ket_noi.query(sql, [gioi_han, bo_qua], (err, data) => {
            if (err) return res.status(500).json(err);
            res.json({ danh_sach: data, phan_trang: { trang, tong_trang } });
        });
    });
});

ung_dung.get('/api/san-pham/:id', (req, res) => {
    ket_noi.query('SELECT * FROM san_pham WHERE id = ?', [req.params.id], (err, data) => {
        if (err || data.length === 0) return res.status(404).json({ msg: 'Lỗi' });
        res.json(data[0]);
    });
});

ung_dung.post('/api/san-pham', upload.single('hinh_anh'), (req, res) => {
    const { ten_sp, gia, so_luong, mo_ta } = req.body;
    const img = req.file ? `/uploads/${req.file.filename}` : null;
    const sql = 'INSERT INTO san_pham (ten_sp, gia, so_luong, mo_ta, hinh_anh) VALUES (?, ?, ?, ?, ?)';
    ket_noi.query(sql, [ten_sp, gia, so_luong || 0, mo_ta, img], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ msg: 'Thêm thành công' });
    });
});

ung_dung.put('/api/san-pham/:id', upload.single('hinh_anh'), (req, res) => {
    const { ten_sp, gia, so_luong, mo_ta } = req.body;
    let sql = 'UPDATE san_pham SET ten_sp=?, gia=?, so_luong=?, mo_ta=? WHERE id=?';
    let params = [ten_sp, gia, so_luong, mo_ta, req.params.id];

    if (req.file) {
        sql = 'UPDATE san_pham SET ten_sp=?, gia=?, so_luong=?, mo_ta=?, hinh_anh=? WHERE id=?';
        params = [ten_sp, gia, so_luong, mo_ta, `/uploads/${req.file.filename}`, req.params.id];
    }
    ket_noi.query(sql, params, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ msg: 'Sửa thành công' });
    });
});

ung_dung.delete('/api/san-pham/:id', (req, res) => {
    ket_noi.query('DELETE FROM san_pham WHERE id=?', [req.params.id], (err) => res.json({ msg: 'Xóa ok' }));
});

// --- API THANH TOÁN & TRỪ KHO ---
ung_dung.post('/api/thanh-toan', (req, res) => {
    const { khach_hang, gio_hang, tong_tien } = req.body;

    // 1. Tạo hóa đơn
    ket_noi.query('INSERT INTO hoa_don (ten_khach_hang, tong_tien) VALUES (?, ?)', [khach_hang, tong_tien], (err, result) => {
        if (err) return res.status(500).json(err);
        const id_hd = result.insertId;

        // 2. Lưu chi tiết hóa đơn
        const chi_tiet = gio_hang.map(item => [id_hd, item.id, item.ten_sp, item.so_luong_mua, item.gia]);
        ket_noi.query('INSERT INTO chi_tiet_hoa_don (id_hoa_don, id_san_pham, ten_sp_luc_mua, so_luong_mua, don_gia) VALUES ?', [chi_tiet], (err) => {
            if (err) return res.status(500).json(err);

            // 3. CẬP NHẬT KHO (TRỪ SỐ LƯỢNG) - Logic đồng bộ số lượng
            gio_hang.forEach(item => {
                ket_noi.query('UPDATE san_pham SET so_luong = so_luong - ? WHERE id = ?', [item.so_luong_mua, item.id]);
            });

            res.json({ msg: 'Thanh toán thành công', id_hoa_don: id_hd });
        });
    });
});

// API xem hóa đơn
ung_dung.get('/api/hoa-don', (req, res) => {
    ket_noi.query('SELECT * FROM hoa_don ORDER BY ngay_tao DESC', (err, data) => res.json(data));
});

ung_dung.get('/api/hoa-don/:id', (req, res) => {
    ket_noi.query('SELECT * FROM hoa_don WHERE id=?', [req.params.id], (err, hd) => {
        if (err || !hd.length) return res.status(404).json({ msg: 'Ko tim thay' });
        ket_noi.query('SELECT * FROM chi_tiet_hoa_don WHERE id_hoa_don=?', [req.params.id], (err, ct) => {
            res.json({ thong_tin: hd[0], chi_tiet: ct });
        });
    });
});

ung_dung.listen(cong, () => console.log(`Server chạy: http://localhost:${cong}`));