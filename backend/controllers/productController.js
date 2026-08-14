// backend/controllers/productController.js
const productService = require('../services/productService');

exports.getAllProducts = async (req, res) => {
    try {
        // İsteği Service katmanına iletiyoruz
        const products = await productService.fetchAllProducts();
        res.status(200).json(products);
    } catch (error) {
        console.error("Ürünler getirilirken hata:", error);
        res.status(500).json({ message: "Ürünler getirilemedi." });
    }
};