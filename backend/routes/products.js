const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Frontend'in ürünleri çektiği uç nokta
router.get('/all', productController.getAllProducts);

module.exports = router;