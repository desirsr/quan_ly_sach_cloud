const mongoose = require('mongoose');
const BookSchema = require('../models/Book');

// Tạo 2 connection riêng biệt
const readConnection = mongoose.createConnection(process.env.MONGODB_READ_URI);
const writeConnection = mongoose.createConnection(process.env.MONGODB_WRITE_URI);

readConnection.on('connected', () => console.log('MongoDB Read Connection Successful'));
writeConnection.on('connected', () => console.log('MongoDB Write Connection Successful'));

// Model gắn với từng luồng kết nối tương ứng
const BookReadModel = readConnection.model('Book', BookSchema);
const BookWriteModel = writeConnection.model('Book', BookSchema);

module.exports = { BookReadModel, BookWriteModel, writeConnection };