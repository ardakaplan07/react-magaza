// backend/services/productService.js
const productRepository = require('../repositories/productRepository');

const fetchAllProducts = async () => {
    // Repository'den veritabanı sorgusunun sonucunu (ürünleri) alıyoruz
    return await productRepository.getAllProducts();
};

module.exports = { fetchAllProducts };