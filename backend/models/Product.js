const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  category: { type: String, required: true },
  subCategory: { type: String },
  image: { type: String },
  isBestSeller: { type: Boolean, default: false },
  isFreeShipping: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);