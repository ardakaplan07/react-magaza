const express = require('express');
const User = require('../models/User'); 
const Product = require('../models/Product'); 

const router = express.Router();

// ==========================================
// 1. ADMİN İSTATİSTİKLERİNİ GETİR
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    // 1. Veritabanından GERÇEK kullanıcı sayısını çek (sadece role: 'user' olanlar)
    const totalUsers = await User.countDocuments({ role: 'user' });

    // 2. YENİ: Veritabanından GERÇEK ürün sayısını çek
    const totalProducts = await Product.countDocuments();

    // 3. Sipariş tablomuz (modelimiz) henüz olmadığı için 
    // şimdilik arayüzü bozmamak adına geçici statik veriler gönderiyoruz.
    const totalRevenue = 12500; 
    const activeOrders = 5;

    // Verileri Frontend'e (React'e) gönder
    res.status(200).json({
      totalUsers,
      totalProducts,
      totalRevenue,
      activeOrders
    });

  } catch (error) {
    console.error("İstatistik Hatası:", error);
    res.status(500).json({ message: "Sunucu tarafında istatistikler çekilirken hata oluştu!" });
  }
});

// ==========================================
// 2. YENİ ÜRÜN EKLE
// ==========================================
router.post('/add-product', async (req, res) => {
  try {
    // YENİ: Frontend'den gelen verilere vitrin özellikleri (boolean) eklendi
    const { title, category, subCategory, price, stock, description, image, isFreeShipping, isBestSeller, isDealOfTheDay } = req.body;

    // YENİ: Yeni ürünü oluştururken özellikleri de modele gönderiyoruz
    const newProduct = new Product({
      title,
      category,
      subCategory,
      price,
      stock,
      description,
      image,
      isFreeShipping: isFreeShipping || false,
      isBestSeller: isBestSeller || false,
      isDealOfTheDay: isDealOfTheDay || false
    });

    // Veritabanına kaydet
    await newProduct.save();

    res.status(201).json({ message: "Ürün başarıyla eklendi!", product: newProduct });
  } catch (error) {
    console.error("Ürün Ekleme Hatası:", error);
    res.status(500).json({ message: "Ürün eklenirken sunucuda bir hata oluştu." });
  }
});

// ==========================================
// 3. ÜRÜNE İNDİRİM UYGULA / GÜNCELLE
// ==========================================
router.put('/update-discount/:id', async (req, res) => {
  try {
    const { discountPercentage } = req.body;
    
    // Ürünü ID'sine göre bul ve discountPercentage alanını güncelle
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { discountPercentage: Number(discountPercentage) },
      { new: true } // Güncellenmiş veriyi geri döndür
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Ürün bulunamadı!" });
    }

    res.status(200).json({ message: "İndirim başarıyla uygulandı!", product: updatedProduct });
  } catch (error) {
    console.error("İndirim Güncelleme Hatası:", error);
    res.status(500).json({ message: "İndirim uygulanırken sunucuda hata oluştu." });
  }
});

// ==========================================
// 4. ÜRÜN VİTRİN ÖZELLİKLERİNİ GÜNCELLE
// ==========================================
router.put('/update-product-flags/:id', async (req, res) => {
  try {
    const { flagName, value } = req.body;
    
    // Gönderilen özelliğin (örneğin isFreeShipping) değerini (true/false) günceller
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      { [flagName]: value }, 
      { new: true }
    );
    
    res.status(200).json({ message: "Ürün özelliği güncellendi!", product: updatedProduct });
  } catch (error) {
    console.error("Özellik Güncelleme Hatası:", error);
    res.status(500).json({ message: "Özellik güncellenirken hata oluştu." });
  }
});

// ==========================================
// 5. TÜM KULLANICILARI GETİR
// ==========================================
router.get('/users', async (req, res) => {
  try {
    // Kullanıcıları bul ama şifreleri (-password) güvenliğimiz için frontend'e gönderme
    const users = await User.find().select('-password'); 
    res.status(200).json(users);
  } catch (error) {
    console.error("Kullanıcıları Çekme Hatası:", error);
    res.status(500).json({ message: "Kullanıcılar çekilirken hata oluştu." });
  }
});

// ==========================================
// 6. KULLANICI ROLÜNÜ DEĞİŞTİR (Admin/User)
// ==========================================
router.put('/update-role/:id', async (req, res) => {
  try {
    const { role } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { role }, 
      { new: true }
    );
    
    res.status(200).json({ message: "Kullanıcı yetkisi başarıyla güncellendi!", user: updatedUser });
  } catch (error) {
    console.error("Yetki Güncelleme Hatası:", error);
    res.status(500).json({ message: "Yetki güncellenirken hata oluştu." });
  }
});
// ==========================================
// 8. TOPLU ÜRÜN EKLEME (BULK INSERT)
// ==========================================
router.post('/bulk-add-products', async (req, res) => {
  try {
    const { products } = req.body; // Gelen ürün listesi (Array)
    
    // MongoDB'nin mucizesi: Yüzlerce veriyi tek seferde kaydeder!
    const insertedProducts = await Product.insertMany(products);
    
    res.status(201).json({ message: `${insertedProducts.length} adet ürün başarıyla eklendi!` });
  } catch (error) {
    console.error("Toplu Ekleme Hatası:", error);
    res.status(500).json({ message: "Ürünler toplu eklenirken hata oluştu." });
  }
});
// ==========================================
// 7. ÜRÜN SİL
// ==========================================
router.delete('/delete-product/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: "Silinecek ürün bulunamadı!" });
    }
    
    res.status(200).json({ message: "Ürün başarıyla silindi!" });
  } catch (error) {
    console.error("Ürün Silme Hatası:", error);
    res.status(500).json({ message: "Ürün silinirken sunucuda bir hata oluştu." });
  }
});
// ==========================================
// 9. KATEGORİ VE ALT KATEGORİ GÜNCELLEME
// ==========================================
router.put('/update-category/:id', async (req, res) => {
  try {
    const { category, subCategory } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { category, subCategory },
      { new: true } // Güncellenmiş halini geri döndür
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: "Ürün bulunamadı!" });
    }
    
    res.status(200).json({ message: "Kategori başarıyla güncellendi!" });
  } catch (error) {
    console.error("Kategori Güncelleme Hatası:", error);
    res.status(500).json({ message: "Kategori güncellenirken sunucuda bir hata oluştu." });
  }
});
module.exports = router;