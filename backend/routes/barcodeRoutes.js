const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET: Barkod numarası ile 2 farklı dış API'den ürün bilgilerini çekme
router.get('/lookup/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // --- 1. ARAMA MOTORU: Open Food Facts (Gıda odaklı) ---
    try {
      const offResponse = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      if (offResponse.data.status === 1) {
        const product = offResponse.data.product;
        return res.json({
          success: true,
          name: product.product_name || product.generic_name || '',
          image: product.image_url || product.image_front_url || '',
          brand: product.brands || ''
        });
      }
    } catch (err) {
      console.log("1. Veritabanında bulunamadı, 2. Veritabanı deneniyor...");
    }

    // --- 2. ARAMA MOTORU: UPCitemdb (Genel Ürünler, Teknoloji, Kozmetik vs.) ---
    try {
      const upcResponse = await axios.get(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`);
      if (upcResponse.data && upcResponse.data.items && upcResponse.data.items.length > 0) {
        const product = upcResponse.data.items[0];
        return res.json({
          success: true,
          name: product.title || '',
          image: (product.images && product.images.length > 0) ? product.images[0] : '',
          brand: product.brand || ''
        });
      }
    } catch (err) {
      console.log("2. Veritabanında da bulunamadı.");
    }

    // İKİSİNDE DE YOKSA: (Kullanıcı manuel girecek)
    res.status(404).json({ success: false, message: 'Ürün global veritabanlarında bulunamadı.' });

  } catch (error) {
    console.error('Barkod okuma hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

module.exports = router;