require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { engine } = require('express-handlebars');
const { BookReadModel, BookWriteModel } = require('./config/database');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cấu hình Handlebars Engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Cấu hình Stateless Session lưu trực tiếp trên Cloud MongoDB Atlas
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_WRITE_URI, // Lưu session trực tiếp lên MongoDB Atlas
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 ngày
}));

// Tính thuế VAT động theo công thức: VAT = (Chữ số cuối MSSV + 6)%
const lastDigit = parseInt(process.env.MSSV.slice(-1));
const vatRate = lastDigit + 6; // Ví dụ: 3 + 6 = 9%

// Route chính: Trang chủ & Hiển thị danh sách
app.get('/', async (req, res) => {
  try {
    // Luồng Read: Dùng BookReadModel để truy vấn
    const books = await BookReadModel.find().lean();
    
    res.render('home', {
      books,
      studentName: process.env.FULL_NAME,
      mssv: process.env.MSSV,
      vatRate: vatRate
    });
  } catch (err) {
    res.status(500).send("Lỗi đọc dữ liệu: " + err.message);
  }
});

// Route thêm mới Sách (Luồng Write & Kiểm tra bộ lọc)
app.post('/add-book', async (req, res) => {
  const { productCode, title, originalPrice } = req.body;
  
  // Bộ lọc 1: Mã sản phẩm bắt buộc phải có tiền tố là 3 số cuối MSSV
  const mssvPrefix = process.env.MSSV.slice(-3); // Ví dụ: '123'
  if (!productCode || !productCode.startsWith(mssvPrefix)) {
    return res.status(400).send(`Mã sản phẩm phải bắt đầu bằng 3 số cuối MSSV (${mssvPrefix})!`);
  }

  // Tự động tính giá sau thuế
  const price = parseFloat(originalPrice);
  const finalPrice = price + (price * vatRate / 100);

  try {
    // Luồng Write: Dùng BookWriteModel để lưu xuống Cloud
    const newBook = new BookWriteModel({
      productCode,
      title,
      originalPrice: price,
      finalPrice: finalPrice
    });
    await newBook.save();
    res.redirect('/');
  } catch (err) {
    res.status(500).send("Lỗi ghi dữ liệu: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));