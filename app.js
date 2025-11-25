const express = require('express');
const mysql = require('mysql2');
const NodeCache = require('node-cache'); // Thêm node-cache

const app = express();
const port = 8080;

const myCache = new NodeCache({ stdTTL: 600 });


app.use(express.static('public'));

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "upredator",
    database: "testjscoban"
});

con.connect(function(err) {
    if (err) {
        console.error("Lỗi kết nối:", err);
        return;
    }
    console.log("Connected to MySQL!");
});

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

        myCache.set(cacheKey, result);

        console.table(result);
        res.send(result);
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});