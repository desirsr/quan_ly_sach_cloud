const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  productCode: { type: String, required: true },
  title: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  finalPrice: { type: Number, required: true }
});

module.exports = BookSchema;