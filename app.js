const express = require('express');
const mysql = require('mysql2');
const NodeCache = require('node-cache');
const multer = require('multer');

const app = express();
const port = 8080;

const myCache = new NodeCache({ stdTTL: 600 });

// =================================================================
// FIX 1: THÊM MIDDLEWARE ĐỂ PHÂN TÍCH BODY CỦA REQUEST
// =================================================================
// Hỗ trợ parse JSON body (thường dùng trong các API request)
app.use(express.json());
// Hỗ trợ parse URL-encoded body (thường dùng trong form submissions)
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// =================================================================
// FIX 2 (KHUYẾN NGHỊ): SỬ DỤNG BIẾN MÔI TRƯỜNG CHO THÔNG TIN NHẠY CẢM
// =================================================================
// KHUYẾN NGHỊ: Thay vì hardcode, bạn nên dùng process.env.DB_USER, process.env.DB_PASSWORD
const con = mysql.createConnection({
    host: "localhost",
    user: "root", // Vui lòng thay thế bằng process.env.DB_USER
    password: "upredator", // Vui lòng thay thế bằng process.env.DB_PASSWORD
    database: "testjscoban"
});

con.connect(function(err) {
    if (err) {
        console.error("Lỗi kết nối:", err);
        return;
    }
    console.log("Connected to MySQL!");
});

// =================================================================
// 2. CẤU HÌNH MULTER CHO UPLOAD ẢNH
// =================================================================

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Lưu file vào thư mục public/uploads/
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
        // Đổi tên file thành timestamp + tên gốc (để tránh trùng lặp)
        // Ví dụ: 1638072000000-tenanh.jpg
        cb(null, Date.now() + '-' + file.originalname.trim());
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Giới hạn 5MB
    fileFilter: function(req, file, cb) {
        // Kiểm tra loại file (chỉ cho phép file ảnh)
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return cb(new Error('Chỉ cho phép file ảnh (jpg, jpeg, png, gif, webp)!'), false);
        }
        cb(null, true);
    }
});


// =================================================================
// 3. ROUTE XỬ LÝ UPLOAD ẢNH MỚI
// =================================================================

/**
 * Endpoint này nhận một file ảnh và lưu nó vào thư mục public/uploads.
 * Tên trường trong form phải là 'productImage'.
 */
app.post('/upload-image', upload.single('productImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh.' });
    }

    // Đường dẫn URL của ảnh (từ góc /pubic/)
    const imageUrl = `/uploads/${req.file.filename}`;

    // Trả về đường dẫn ảnh để client lưu vào database hoặc hiển thị
    res.json({
        success: true,
        message: 'Upload ảnh thành công!',
        imageUrl: imageUrl,
        fileName: req.file.filename
    });
});

// =================================================================
// Các route cũ không thay đổi
// =================================================================

app.get('/', (req, res) => {
    res.send('Hello World from Express!');
});

app.get('/chitiet', (req, res) => {
    res.redirect('/chitiet.html');
});

app.get('/home', (req, res) => {
    const cacheKey = "allProducts"; // Đặt tên cho key của cache

    // 1. Kiểm tra xem có cache hay không
    const cachedData = myCache.get(cacheKey);

    if (cachedData) {
        console.log("Serving from CACHE!");
        console.table(cachedData);
        return res.send(cachedData);
    }

    console.log("Serving from DATABASE...");
    con.query("SELECT idsanpham, ao, quan, diachi, sdt FROM sanpham", function(err, result, fields) {
        if (err) {

            console.error("Lỗi truy vấn database:", err);
            return res.status(500).send("Có lỗi xảy ra khi truy vấn dữ liệu.");
        }

        // Trong trường hợp sản phẩm có ảnh thật (ví dụ: 'public/uploads/1638072000000-tenanh.jpg'), 
        // bạn sẽ cần có một cột `hinhAnh` trong database. 
        // Sau đó thay đổi query để lấy cột đó và trả về:
        // con.query("SELECT idsanpham, ao, quan, diachi, sdt, hinhAnh FROM sanpham", ...

        myCache.set(cacheKey, result);

        console.table(result);
        res.send(result);
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});