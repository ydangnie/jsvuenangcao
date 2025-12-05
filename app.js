const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// --- 1. CẤU HÌNH MIDDLEWARE ---
app.use(cors()); // Quan trọng: Chống lỗi CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Public thư mục ảnh

// --- 2. KẾT NỐI DATABASE ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'upredator', // <--- ĐIỀN MẬT KHẨU MYSQL CỦA BẠN VÀO ĐÂY (nếu có)
    database: 'shop_db'
});

db.connect(err => {
    if (err) {
        console.error('Lỗi kết nối MySQL:', err.message);
        console.log('Hãy kiểm tra lại mật khẩu trong file app.js hoặc đảm bảo đã chạy database script.');
        return;
    }
    console.log('Đã kết nối MySQL thành công!');
});

// --- 3. CẤU HÌNH UPLOAD ẢNH ---
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- 4. API ROUTES (CRUD) ---

// Lấy danh sách
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Lấy chi tiết 1 sản phẩm
app.get('/api/products/:id', (req, res) => {
    db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(results[0]);
    });
});

// Thêm mới
app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, price, description } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price) return res.status(400).json({ message: 'Thiếu tên hoặc giá' });

    const sql = 'INSERT INTO products (name, price, description, image_url) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, price, description, image_url], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Thêm thành công', id: result.insertId });
    });
});

// Cập nhật (Sửa)
app.put('/api/products/:id', upload.single('image'), (req, res) => {
    const { name, price, description } = req.body;
    const id = req.params.id;

    let sql, params;
    if (req.file) {
        // Có up ảnh mới -> Thay cả link ảnh
        const image_url = `/uploads/${req.file.filename}`;
        sql = 'UPDATE products SET name = ?, price = ?, description = ?, image_url = ? WHERE id = ?';
        params = [name, price, description, image_url, id];
    } else {
        // Không up ảnh mới -> Giữ nguyên ảnh cũ
        sql = 'UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?';
        params = [name, price, description, id];
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Cập nhật thành công' });
    });
});

// Xóa
app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Xóa thành công' });
    });
});

app.listen(port, () => {
    console.log(`Server backend đang chạy tại: http://localhost:${port}`);
});