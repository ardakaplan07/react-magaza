// backend/repositories/productRepository.js
const Product = require('../models/Product');

const getAllProducts = async () => {
    // routes/products.js'den kestiğimiz 10. satırı buraya taşıdık
    return await Product.find().sort({ createdAt: -1 });
};

module.exports = { getAllProducts };